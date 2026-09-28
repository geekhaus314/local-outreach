"""Presence files and metadata -- what a site leaves on the table without
looking broken.

Every other check in the auditor asks "is this site broken?". These ask "is this
site leaving money on the table", which is a different conversation, and the only
one available when the site is already fine. That distinction is the whole reason
this lives in its own module.

It matters for outreach because a business with a healthy site is not a lost
lead, it is a lead whose pitch cannot be a defect list. What is left is a short,
specific, checkable list of things a competent developer would add anyway:

  robots.txt      crawler instructions. Absent means you are asking every bot to
                  take your whole site on trust.
  sitemap.xml     the map search engines actually read. Absent on a site with
                  service-area pages means those pages are being found by luck.
  ads.txt         Google requires any business running call or lead-gen ads to
                  declare itself in ads.txt, and will suspend the account if it
                  does not. A roofer spending on Google Ads without one is
                  non-compliant today, and does not know it.
  security.txt    RFC 9116. How to reach someone when a vulnerability turns up.
                  Free credibility with any business that handles payments or
                  customer details, and there is almost never one.
  llms.txt        the emerging convention for telling AI assistants what a
                  business actually does and which pages to quote. New enough
                  that "nobody has this yet" is a real observation.

**Every finding here carries a penalty of zero.** These are improvements, not
defects. Charging for them would push healthy sites across the
``penalty >= 30`` threshold in audit.py and reclassify working businesses as
broken, which is exactly backwards. They inform the pitch; they never move a
score or a classification.

The fetch of four small text files per site is skipped for sites that are
already unambiguously broken -- a parked domain does not need an ads.txt audit.
"""

from __future__ import annotations

import re
from concurrent.futures import ThreadPoolExecutor
from dataclasses import dataclass, field
from urllib.parse import urlparse

from .http_client import fetch_page

# Relative path -> what it is for, and the sentence to use if it is missing.
# The sentence is a fact about the file, not an opinion about the business.
TEXT_SURFACES: dict[str, dict[str, str]] = {
    "robots.txt": {
        "label": "No robots.txt",
        "why": "crawler instructions",
        "quote": (
            "Your site has no robots.txt, so you have no say in what search "
            "engines are allowed to crawl."
        ),
    },
    "sitemap.xml": {
        "label": "No sitemap.xml",
        "why": "a map of your pages for search engines",
        "quote": (
            "There's no sitemap on your site, which is the file search engines "
            "use to find pages like your service areas."
        ),
    },
    "ads.txt": {
        "label": "No ads.txt",
        "why": "ad compliance and call tracking",
        "quote": (
            "There's no ads.txt on your site. If you ever run Google call ads or "
            "lead-gen campaigns, Google requires you to declare yourself there "
            "and will suspend the account for it."
        ),
    },
    ".well-known/security.txt": {
        "label": "No security.txt",
        "why": "a published way to report vulnerabilities",
        "quote": (
            "Your site publishes no security.txt, so there's no published way "
            "for someone to tell you about a security problem they find."
        ),
    },
    "llms.txt": {
        "label": "No llms.txt",
        "why": "guidance for AI assistants",
        "quote": (
            "Your site has no llms.txt, which is the file that tells AI "
            "assistants what you actually do and which pages to quote when "
            "someone asks them for a recommendation. Almost nobody has one yet."
        ),
    },
}

# Cheap HTML features that are polish rather than breakage. Same zero-penalty
# rule as the files above.
META_CHECKS: dict[str, dict] = {
    "canonical": {
        "pattern": re.compile(r'rel\s*=\s*["\']canonical', re.I),
        "label": "No canonical URL",
        "quote": (
            "Your pages don't declare a canonical URL, so search engines can "
            "index the same page under several addresses."
        ),
    },
    "og_image": {
        "pattern": re.compile(r'property\s*=\s*["\']og:image', re.I),
        "label": "No social preview image",
        "quote": (
            "Your site has no social preview image, so when you post a link on "
            "Facebook or in a text message it shows up as a bare link."
        ),
    },
    "og_complete": {
        "pattern": re.compile(r'property\s*=\s*["\']og:(title|description)', re.I),
        "label": "Incomplete social tags",
        "quote": (
            "Your social sharing tags are incomplete, so your links preview "
            "without a title or description."
        ),
    },
    "json_ld": {
        "pattern": re.compile(r'application/ld\+json', re.I),
        "label": "No structured data",
        "quote": (
            "Your site has no structured data, so Google can't show your hours, "
            "service area or rating in search results."
        ),
    },
}


@dataclass
class Surface:
    """One presence file, and what we actually learned about it.

    Three states, not two, and the third one is the important one. A timeout, a
    refused connection and a bot block all look like "no file" if you only
    record yes/no -- which is how a large roofing company with a perfectly good
    robots.txt got told it had none. ``absent`` is only ever set on a clean 404.
    """
    path: str
    present: bool = False
    absent: bool = False       # confirmed 404/410 -- safe to state as a fact
    status: int | None = None
    note: str = ""
    body: str = ""


@dataclass
class SurfaceReport:
    files: dict[str, Surface] = field(default_factory=dict)
    meta: dict[str, bool] = field(default_factory=dict)

    @property
    def missing(self) -> list[str]:
        return [p for p, s in self.files.items() if not s.present]

    def has(self, path: str) -> bool:
        s = self.files.get(path)
        return bool(s and s.present)


def origin_of(url: str) -> str:
    """scheme://host for a URL, which is where presence files actually live.

    Resolving them against the current page instead is a quiet, expensive bug:
    a check run on https://example.com/service-areas/st-louis/ asked for
    /service-areas/st-louis/robots.txt, got a confident 404, and reported a
    roofing company with a working robots.txt as having none.
    """
    parsed = urlparse(url if "//" in url else f"https://{url}")
    if not parsed.scheme or not parsed.netloc:
        return ""
    return f"{parsed.scheme}://{parsed.netloc}"


def check_text_files(url: str, timeout: int | None = None) -> dict[str, Surface]:
    """Fetch each presence file once. Never raises, never blocks.

    Only a clean 404 counts as "not there". A timeout, a refused connection, a
    bot block and a 5xx all mean *we did not find out*, and saying "you have no
    robots.txt" on the strength of a failed request is how a roofing company with
    a perfectly good robots.txt ended up on a list of things to fix. Those cases
    come back with neither ``present`` nor ``absent`` set, and the caller stays
    quiet about them.

    Fetched in parallel: five sequential requests per site turned a ten-second
    audit into a minute, and one slow host stalled every site behind it.
    """
    paths = list(TEXT_SURFACES)
    out: dict[str, Surface] = {p: Surface(path=p) for p in paths}
    base = origin_of(url)
    if not base:
        return out

    def probe(path: str) -> tuple[str, Surface]:
        surface = Surface(path=path)
        try:
            page = fetch_page(f"{base}/{path}", timeout=timeout)
        except Exception as exc:  # a missing file must never fail the audit
            surface.note = f"{type(exc).__name__}"
            return path, surface

        surface.status = page.status
        body = (page.html or "").strip()

        if page.status is not None and 200 <= page.status < 300 and body:
            # Guard against soft-404s: plenty of hosts answer 200 with a
            # "page not found" body, which would read as a real robots.txt.
            head = body[:400].lower()
            if "404" not in head and "not found" not in head and len(body) > 20:
                surface.present = True
                surface.body = body[:2000]
        elif page.status in (404, 410):
            surface.absent = True
        else:
            surface.note = page.error or f"HTTP {page.status}"
        return path, surface

    with ThreadPoolExecutor(max_workers=len(paths)) as pool:
        for path, surface in pool.map(probe, paths):
            out[path] = surface
    return out


def check_metadata(html: str) -> dict[str, bool]:
    """Boolean map of the polish-level HTML features."""
    return {key: bool(spec["pattern"].search(html)) for key, spec in META_CHECKS.items()}


def robots_blocks_everything(body: str) -> bool:
    """True for a robots.txt that disallows the entire site.

    Worth catching loudly: a business that has paid someone to block crawlers,
    or shipped a security setting meant for staging, has quietly removed
    itself from every search engine.
    """
    disallow_all = re.search(r'^\s*disallow\s*:\s*/\s*$', body, re.I | re.M)
    if not disallow_all:
        return False
    # A wildcard User-agent followed by Disallow: / is a real pattern in
    # development. Ignore it if the file also opens everything up for somebody.
    allows = re.search(r'^\s*allow\s*:\s*/\s*$', body, re.I | re.M)
    return not allows
