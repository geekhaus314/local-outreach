"""Website auditor.

This is the part that actually answers "do they desperately need a site?", because
"no website listed" is only one of the ways a business ends up invisible. A live
site from 2014 with no mobile view, no way to book, and a dead contact form is a
*better* prospect than no site at all: the owner thinks they're online, so they
never prioritise it, and the evidence for the pitch is concrete and checkable.

Every finding carries a penalty and a ``quote`` -- a short factual statement that
is safe to put in front of the prospect without embellishment.
"""

from __future__ import annotations

import re
import socket
from dataclasses import dataclass, field
from datetime import datetime
from html import unescape
from urllib.parse import urlparse

from .config import (
    LEGACY_STACK_MARKERS,
    MODERN_STACK_MARKERS,
    PARKED_MARKERS,
    SOCIAL_HOSTS,
    WEAK_PARKED_MARKERS,
)
from .contact import extract as extract_emails
from .http_client import fetch_page, normalize_url, registrable_domain
from .surfaces import (
    META_CHECKS,
    TEXT_SURFACES,
    check_metadata,
    check_text_files,
    robots_blocks_everything,
)

try:  # optional, we have a regex fallback for the few places it matters
    from bs4 import BeautifulSoup
except ImportError:  # pragma: no cover
    BeautifulSoup = None  # type: ignore[assignment]

TAG_RE = re.compile(r"<(script|style|noscript)[^>]*>.*?</\1>", re.I | re.S)
TITLE_RE = re.compile(r"<title[^>]*>(.*?)</title>", re.I | re.S)
META_RE = re.compile(r"<meta\b[^>]*>", re.I)
# Attribute values are quoted and routinely contain spaces -- a meta description
# is one long sentence. The previous pattern stopped at the first whitespace, so
# content="Roof repair, replacement and storm damage" parsed as "Roof", every
# description looked 4 characters long, and the auditor told a business with a
# complete 149-character description that it was "too short to persuade anyone to
# click". Quoted and bare values are matched separately and unwrapped below.
ATTR_RE = re.compile(
    r'([\w:-]+)\s*=\s*(?:"([^"]*)"|\'([^\']*)\'|([^\s"\'>]*))', re.I
)

# Statuses that mean "an automated client was refused", not "this site is broken".
# WordPress hosts and WAFs in front of small-business sites answer 403/406/429
# with a stub page. Every content check would then read the stub and conclude the
# business has no contact form, no meta description and no analytics -- four
# false claims in a pitch the prospect can disprove in five seconds.
BLOCKED_STATUSES = frozenset({401, 403, 406, 418, 429, 451, 503})

# Suffixed to catch sites whose *title* is a different company's name, e.g. a
# plumber's domain that has been parked on someone else's blog.
_NAME_NOISE = frozenset({
    "inc", "llc", "co", "company", "corp", "incorporated", "the", "and",
    "services", "service", "group", "plus", "usa", "us",
})

# Words that describe the trade rather than the business. They appear in half the
# sites in any given market, so a shared "plumbing" proves nothing about whether
# a page belongs to a particular plumber -- and treating it as proof is what let
# a rival plumber's blog pass as "St Charles Plumbing Company".
_GENERIC_TRADE_WORDS = frozenset({
    "plumbing", "plumber", "roofing", "roofer", "hvac", "heating", "cooling",
    "air", "conditioning", "painting", "painter", "electrical", "electric",
    "landscaping", "concrete", "repairs", "repair", "contractors",
    "contracting", "exteriors", "exterior", "home", "remodeling", "roof",
    "siding", "gutters", "fence", "flooring", "windows", "solar", "cleaning",
    "photography", "photographer", "portrait", "studio", "auto", "automotive",
    "dental", "dentist", "medical", "massage", "salon", "restaurant",
    "construction", "builders", "building", "systems", "solutions", "works",
})


def _attr_value(m: re.Match) -> str:
    for grp in (2, 3, 4):
        if m.group(grp) is not None:
            return m.group(grp)
    return ""


def _name_tokens(name: str) -> set[str]:
    """Meaningful lowercase tokens from a business name.

    Deliberately drops the legal suffixes, because the check is "does this page
    look like this business" and "SMP Plumbing Company" and "SMP Plumbing" have to
    compare the same. Short tokens are dropped too: a three-letter word matches
    by accident constantly.
    """
    cleaned = re.sub(r"[^\w\s]", " ", name.lower())
    return {
        t for t in cleaned.split()
        if len(t) >= 4 and t not in _NAME_NOISE
    }
YEAR_RE = re.compile(r"(?:©|&copy;|copyright)\s*(?:copyright)?\s*(\d{4})", re.I)
TAG_STRIP_RE = re.compile(r"<[^>]+>")
WS_RE = re.compile(r"\s+")

BOOKING_MARKERS = (
    "book online", "book now", "schedule appointment", "schedule service",
    "request a quote", "request quote", "get a quote", "book appointment",
    "online booking", "reserve now", "booksy", "square appointments",
    "calendly", "service titan", "jobber", "housecall pro", "fenix",
    "squarespace scheduling", " acuity scheduling", "schedulicity",
)
# The plain-language and linked forms. Buckingham's homepage says "Schedule Your
# Appointment Today!" and links /schedule-now, and the old marker list missed
# both, producing "your site is a phone call" for a site with a booking form.
# These are deliberately generous: a false negative only loses a finding, while
# a false positive sends the owner a claim they can disprove in one click.
BOOKING_RE = re.compile(
    r"\b(?:book|booking|appointment|appointments|schedul(?:e|ing)|reserve)\b",
    re.I,
)
BOOKING_HREF_RE = re.compile(
    r'href\s*=\s*["\'][^"\']*(?:book|appointment|schedul)', re.I
)
ANALYTICS_MARKERS = (
    "google-analytics", "googletagmanager", "gtag(", "ga.js",
    "facebook.net", "clarity.ms", "hotjar", "plausible.io", "matomo",
)
FORM_MARKERS = ("<form",)
CIAS = ("sentry", "trustpilot", "bbb.org", "google.com/maps", "gmpg.org")


def _meta_tags(html: str) -> list[dict[str, str]]:
    tags: list[dict[str, str]] = []
    for raw in META_RE.findall(html):
        attrs = {m.group(1).lower(): _attr_value(m) for m in ATTR_RE.finditer(raw)}
        if attrs:
            tags.append(attrs)
    return tags


def _visible_text(html: str) -> str:
    return WS_RE.sub(" ", TAG_STRIP_RE.sub(" ", TAG_RE.sub(" ", html)))


def _detect_parked(
    html: str, low: str, title_low: str, vis_low: str, text_len: int
) -> bool:
    """Decide whether a page is a parked/for-sale/unbuilt placeholder.

    Strong markers match anywhere. Weak markers only match when they are the
    actual subject of the page -- in the title, or on a page with almost no
    content -- because a live business site will mention "under construction"
    in a blog post without being parked.
    """
    for marker in PARKED_MARKERS:
        if marker in low or marker in vis_low:
            return True

    for marker in WEAK_PARKED_MARKERS:
        if marker in title_low:
            return True
        if marker in vis_low and text_len < 1200:
            return True
    return False


@dataclass
class Finding:
    code: str
    label: str
    penalty: int
    detail: str
    quote: str = ""


@dataclass
class AuditResult:
    url: str
    domain: str = ""
    reachable: bool = False
    status: int | None = None
    final_url: str = ""
    is_social_only: bool = False
    is_parked: bool = False
    redirected_domain: str = ""
    health: int = 0
    needs_rehab: bool = False
    load_ms: int | None = None
    title: str = ""
    # True when the host refused an automated request. Content findings are
    # meaningless in that case, so none are emitted.
    blocked: bool = False
    # True when the page does not appear to belong to the business we asked
    # about -- a plumber's domain still serving a different plumber's blog.
    serves_other_business: str = ""
    findings: list[Finding] = field(default_factory=list)
    evidence: dict = field(default_factory=dict)
    error: str | None = None

    def top_findings(self, n: int = 4) -> list[Finding]:
        return sorted(self.findings, key=lambda f: -f.penalty)[:n]

    def quotes(self, n: int = 3) -> list[str]:
        out = [f.quote for f in self.top_findings(n) if f.quote]
        return out

    def summary_line(self) -> str:
        if not self.reachable:
            return f"UNREACHABLE ({self.error or 'no response'})"
        bits = []
        if self.is_parked:
            bits.append("parked placeholder")
        if self.redirected_domain:
            bits.append(f"redirects to {self.redirected_domain}")
        if self.evidence.get("no_viewport"):
            bits.append("no mobile layout")
        if self.evidence.get("no_contact_form") and self.evidence.get("has_phone"):
            bits.append("phone-only, no booking form")
        if self.evidence.get("stale_copyright_years"):
            bits.append(f"copyright {self.evidence['stale_copyright_years']}")
        if self.evidence.get("legacy_stack"):
            bits.append("legacy stack")
        if not bits:
            # Penalty-based findings that the bit-list above does not describe
            # (thin content, no meta description, no analytics, slow load...).
            # Falling back to these keeps the summary consistent with the
            # NEEDS_REHAB classification instead of claiming all is well.
            top = self.top_findings(3)
            if self.needs_rehab and top:
                bits = [f.label.lower() for f in top]
            else:
                bits.append("live, no major issues detected")
        return ", ".join(bits)


def is_social_or_marketplace(url: str) -> bool:
    host = (urlparse(url).hostname or "").lower()
    return any(host == h or host.endswith("." + h) for h in SOCIAL_HOSTS)


def audit_url(url: str, business_name: str = "") -> AuditResult:
    """Run the full audit against one URL. Never raises.

    ``business_name`` is optional and only used by the belongs-to-you check. It
    has to be passed in because the auditor otherwise cannot tell a healthy site
    from a healthy site belonging to someone else.
    """
    url = normalize_url(url)
    res = AuditResult(url=url, domain=registrable_domain(url))

    if not url:
        res.error = "no url supplied"
        res.health = 0
        res.needs_rehab = True
        res.findings.append(
            Finding("NO_SITE", "No website at all", 100,
                    "No website is listed on their Google Business Profile.",
                    "You don't have a website of your own right now -- your Google "
                    "listing is the only thing customers can see.")
        )
        return res

    if is_social_or_marketplace(url):
        res.is_social_only = True
        res.reachable = True
        res.status = 200
        res.health = 12
        res.needs_rehab = True
        res.error = None
        res.findings.append(
            Finding(
                "SOCIAL_ONLY",
                "Social/marketplace page instead of a website",
                85,
                f"Their only web presence is {urlparse(url).hostname}.",
                f"Your website field just points at a "
                f"{urlparse(url).hostname} page -- there's no site you actually own, "
                "which means you don't rank in normal search and you can't track "
                "who's clicking.",
            )
        )
        return res

    page = fetch_page(url)
    res.final_url = page.final_url or url
    res.status = page.status
    res.load_ms = page.elapsed_ms
    res.error = page.error

    if page.error and page.status is None:
        res.reachable = False
        res.health = 0
        res.needs_rehab = True
        kind = "domain does not resolve" if isinstance(page.error, str) and "DNS" in page.error else "site is down"
        res.findings.append(
            Finding("DEAD_SITE", "Website is down / dead", 95,
                    f"Could not reach {res.domain}: {page.error}",
                    f"Your website is listed but it doesn't load -- "
                    f"{res.domain} isn't responding at all right now.")
        )
        return res

    html = page.html or ""
    low = html.lower()
    res.reachable = True

    # ---- title (needed by several checks below) ------------------------- #
    title_match = TITLE_RE.search(html)
    title = WS_RE.sub(" ", title_match.group(1)).strip() if title_match else ""
    # Entities are decoded here rather than at each use. A title of
    # "Arch Plumbing &#8211; My WordPress Blog" is correct for a page and wrong
    # in a text message to a customer, and the raw entity was reaching the
    # outreach copy verbatim.
    # Decode once here so every downstream consumer -- evidence quotes, the
    # reporter, a text message to a prospect -- gets clean text.
    title = unescape(title)
    res.title = title[:200]

    # ---- did we actually get the site, or a block page? ----------------- #
    # Bail out before any content check. A 403 stub is ~500 bytes of "Forbidden"
    # with no links and no metadata, and reading it as the business's homepage
    # manufactures four false claims at once.
    vis = _visible_text(html)
    text_len = len(vis.strip())
    res.blocked = (
        page.status in BLOCKED_STATUSES
        or (page.status is not None and page.status >= 400 and text_len < 800)
    )
    if res.blocked:
        res.health = 50          # unknown, not bad
        res.needs_rehab = False  # deliberately not classified on a stub
        res.evidence["text_length"] = text_len
        res.findings.append(
            Finding("BLOCKED", "Site refuses automated requests", 0,
                    f"HTTP {page.status} to a scripted request "
                    f"({text_len} chars of body)",
                    "")
        )
        return res

    vis_low = vis.lower()

    # ---- parked / placeholder detection -------------------------------- #
    # Strong markers are unambiguous wherever they appear. Weak markers
    # ("coming soon", "under construction") only count when the page is
    # actually a stub -- otherwise a real business page that happens to say
    # "kitchen under construction" gets flagged as parked.
    res.is_parked = _detect_parked(html, low, title.lower(), vis_low, text_len)

    if res.is_parked:
        res.findings.append(
            Finding("PARKED", "Domain is parked or a placeholder", 90,
                    f"{res.domain} serves a parked/placeholder page "
                    f"(title={title[:60]!r})",
                    f"{res.domain} is sitting on a parked placeholder page -- "
                    "anyone who types your web address sees a 'coming soon' "
                    "screen instead of your business.")
        )
    elif text_len < 120 and any(m in vis_low for m in WEAK_PARKED_MARKERS):
        res.is_parked = True
        res.findings.append(
            Finding("PARKED", "Placeholder page", 88,
                    f"Near-empty page mentioning a placeholder phrase (title={title[:60]!r})",
                    f"{res.domain} is a placeholder page, not a real website.")
        )

    # ---- domain redirected to a different business ---------------------- #
    # The whole chain, not just the first foreign domain. A domain that walks
    # through eleven unrelated businesses and lands on a spam page is a very
    # different conversation from one that 301s to a single stale site, and
    # naming a single hop from the middle of the chain is a claim that stops
    # being true within hours -- the chain grew a new link during this work.
    chain = []
    # getattr rather than attribute access: this function is documented as never
    # raising, and a test double or an older PageResult should not be able to
    # take down an audit over a diagnostic field.
    for hop in (getattr(page, "redirect_chain", None) or []):
        host = registrable_domain(hop) or hop
        if host and host not in chain:
            chain.append(host)
    res.evidence["redirect_chain"] = chain

    orig_domain = registrable_domain(url)
    final_domain = registrable_domain(res.final_url or url)
    if final_domain and orig_domain and final_domain != orig_domain:
        res.redirected_domain = final_domain
        res.findings.append(
            Finding("DOMAIN_REDIRECT", "Domain points at a different business", 65,
                    f"{orig_domain} -> {final_domain}",
                    f"The web address listed for your business doesn't go to your "
                    f"business -- {orig_domain} just redirects to {final_domain}.")
        )


    if res.status and res.status >= 500:
        res.findings.append(
            Finding("SERVER_ERROR", "Server error", 80,
                    f"Returned HTTP {res.status}",
                    f"Your site returned a {res.status} error when I tried to load it.")
        )
    elif res.status == 404:
        res.findings.append(
            Finding("HTTP_404", "Page not found", 70,
                    "Returned HTTP 404",
                    "The web address listed for your business returns a "
                    "'page not found' error.")
        )

    # ---- final HTTPS state --------------------------------------------- #
    started_https = url.startswith("https://")
    ended_https = (res.final_url or "").startswith("https://")
    if started_https and not ended_https:
        res.findings.append(
            Finding("SSL_BROKEN", "HTTPS broken", 75, "Started https, ended on http",
                    "Your site redirects a secure connection back to an unencrypted one.")
        )
    elif not started_https and ended_https:
        res.evidence["upgraded_to_https"] = True

    # ---- meta tags ------------------------------------------------------ #
    metas = _meta_tags(html)
    desc = ""
    generator = ""
    viewport = ""
    for attrs in metas:
        nm = (attrs.get("name") or "").lower()
        if nm == "description" and not desc:
            desc = attrs.get("content", "").strip()
        if nm == "generator" and not generator:
            generator = attrs.get("content", "").strip()
        if nm == "viewport" and not viewport:
            viewport = attrs.get("content", "").strip()
        # Open Graph carries `property=`, Twitter carries `name=`. This only
        # looked at `name`, so `og_title` was never recorded for a site using
        # standard OG markup -- which is every site -- and expansion_angle's
        # "your links are bare links" claim, gated on this key, fired for
        # everyone. It was firing on a site whose OG tags were all present
        # except the image, where the claim is simply false. It also matched
        # any `og:*`, so it could store an og:image URL as the title.
        prop = (attrs.get("property") or "").lower()
        if (prop == "og:title" or nm == "og:title") and "og_title" not in res.evidence:
            res.evidence["og_title"] = attrs.get("content", "")[:120]

    if not title:
        res.findings.append(
            Finding("NO_TITLE", "No page title", 30, "<title> missing or empty",
                    "Your homepage has no title text, so Google can't tell what "
                    "the page is about.")
        )
    elif len(title) < 15:
        res.findings.append(
            Finding("THIN_TITLE", "Very short title", 12, f"Title is only {len(title)} chars",
                    "Your page title is so short it tells search engines almost "
                    "nothing about the business.")
        )

    if not desc:
        res.findings.append(
            Finding("NO_META_DESC", "No meta description", 15,
                    "No <meta name=description>",
                    "Your site has no meta description, so Google invents the text "
                    "it shows under your listing in search results.")
        )
    elif len(desc) < 50:
        res.findings.append(
            Finding("THIN_META_DESC", "Weak meta description", 8,
                    f"Description is only {len(desc)} chars",
                    "Your meta description is too short to persuade anyone to click.")
        )

    # ---- mobile --------------------------------------------------------- #
    # A viewport tag without width=device-width is still a mobile failure, but
    # it is not a missing tag. Duda emits the id-first form
    # `<meta id="view" name="viewport" content="initial-scale=1, ...">`, and the
    # old message told that business it had no viewport tag at all -- a claim
    # they could disprove by viewing source. Same finding, honest wording.
    has_viewport_tag = bool(viewport)
    has_viewport = has_viewport_tag and "width" in viewport.lower()
    res.evidence["has_viewport"] = has_viewport
    res.evidence["no_viewport"] = not has_viewport
    if not has_viewport:
        if not has_viewport_tag:
            detail = "No <meta name=viewport> tag"
            quote = (
                "Your site isn't set up for phones -- visitors on mobile see a "
                "shrunken desktop page, and most of your customers will be "
                "searching from one."
            )
            penalty = 55
        else:
            detail = f"Viewport tag omits width=device-width ({viewport[:60]})"
            quote = (
                "Your viewport tag doesn't set width=device-width, so phones can "
                "still render the full desktop layout instead of reflowing it."
            )
            penalty = 30
        res.findings.append(
            Finding("NO_MOBILE", "No mobile viewport", penalty, detail, quote)
        )

    # ---- stack / age ---------------------------------------------------- #
    legacy = [m for m in LEGACY_STACK_MARKERS if m in low]
    modern = [m for m in MODERN_STACK_MARKERS if m in low]
    res.evidence["legacy_stack"] = legacy
    res.evidence["modern_stack"] = modern
    res.evidence["generator"] = generator

    if generator:
        res.evidence["generator"] = generator
        ver = re.search(r"(\d+\.\d+(?:\.\d+)?)", generator)
        if "wordpress" in generator.lower() and ver:
            major = int(ver.group(1).split(".")[0])
            if major < 5:
                res.findings.append(
                    Finding("WP_EOL", "Unsupported CMS version", 45,
                            f"WordPress {ver.group(1)}",
                            f"Your site is running WordPress {ver.group(1)}, a version "
                            "that stopped getting security updates years ago.")
                )

    if legacy and not modern:
        res.findings.append(
            Finding("LEGACY_STACK", "Outdated web technology", 35,
                    f"Legacy markers: {', '.join(legacy[:3])}",
                    "Your site is built on very old web technology "
                    f"({', '.join(legacy[:2])}), which is why it's slow and hard to "
                    "update.")
        )

    if res.load_ms and res.load_ms > 3000:
        sev = 40 if res.load_ms > 5000 else 20
        res.findings.append(
            Finding("SLOW", "Slow load time", sev,
                    f"Time to first byte {res.load_ms}ms",
                    f"Your site took {res.load_ms / 1000:.1f}s to respond. Most "
                    "people leave a page that slow in under 3 seconds.")
        )

    # ---- contact & booking paths --------------------------------------- #
    has_phone = bool(re.search(r'href\s*=\s*["\']tel:', low))
    has_mail = bool(re.search(r'href\s*=\s*["\']mailto:', low))
    has_form = any(m in low for m in FORM_MARKERS)
    has_booking = (
        any(m in vis or m in low for m in BOOKING_MARKERS)
        or bool(BOOKING_RE.search(vis))
        or bool(BOOKING_HREF_RE.search(html))
    )
    res.evidence.update(
        has_phone=has_phone, has_email=has_mail,
        has_contact_form=has_form, has_online_booking=has_booking,
    )

    if not has_phone and not has_mail and not has_form:
        res.findings.append(
            Finding("NO_CONTACT", "No way to make contact", 65,
                    "No tel:, no mailto:, no form",
                    "There's no phone link, no email link and no contact form on "
                    "your site -- a visitor has no obvious way to reach you.")
        )
    elif has_phone and not has_form and not has_booking:
        res.findings.append(
            Finding("NO_BOOKING", "Phone-only, cannot book or request online", 50,
                    "Has tel: but no form and no booking",
                    "Your site is a phone call. There's no form or booking button, "
                    "so anyone who wants to request a job after hours has nothing "
                    "to click and just bounces.")
        )
    elif has_form and not has_booking:
        res.findings.append(
            Finding("NO_BOOKING", "No online scheduling", 25,
                    "Contact form but no scheduling",
                    "Your site has a contact form but no way to book or request a "
                    "slot directly.")
        )



    # ---- the page is somebody else's business --------------------------- #
    # The redirect check above only catches a different *domain*. A domain that
    # still serves first-party-looking content for another company slips past
    # it entirely: a plumber's address still hosting a rival plumber's WordPress
    # blog, with the plumber's own name nowhere on it. Nothing in the page
    # announces this -- the site looks alive and scores like a healthy one, so
    # the audit previously passed it as "decent, skip".
    #
    # Three conditions have to hold, because the cost of a false positive here is
    # the worst in the whole pipeline: telling a real business that its domain
    # belongs to someone else is an accusation, not an observation.
    #   1. no distinctive part of its own name appears anywhere on the page
    #   2. the page does not look like a working site for that trade -- no way to
    #      contact anyone, or barely any content
    #   3. it did not simply redirect somewhere else, which is its own finding
    # Businesses named only after their trade ("Plumbing Company") have no
    # distinctive token to test and are left alone rather than guessed at.
    distinctive = _name_tokens(business_name) - _GENERIC_TRADE_WORDS
    alts = " ".join(re.findall(r'alt\s*=\s*["\']([^"\']*)', html, re.I))
    page_words = set(_name_tokens(f"{title} {vis} {alts}"))
    looks_abandoned = (
        not (has_phone or has_mail or has_form) or text_len < 1500
    )
    if (
        distinctive
        and not res.is_parked
        and not res.redirected_domain
        and looks_abandoned
        and not (distinctive & page_words)
    ):
        res.serves_other_business = title[:80] or "an unrelated page"
        res.findings.append(
            Finding("SITE_IS_OTHER_BUSINESS",
                    "Domain serves a different business", 80,
                    f"page is titled {res.serves_other_business!r}, "
                    f"expected {business_name!r}; no contact paths, "
                    f"{text_len} chars of text",
                    f"Your web address doesn't show your business any more -- "
                    f"it loads a page for somebody else "
                    f"(titled \"{res.serves_other_business}\").")
        )

    # ---- thin content --------------------------------------------------- #
    # text_len was computed above, before the parked check, so it is reused.
    res.evidence["text_length"] = text_len
    # A bounded sample of the page's own words. The reporter reads it to tell a
    # local operator from a lead broker -- "serving five states" and a toll-free
    # number together mean there is no small local business on the other end of
    # that phone number, which is not something the markup alone will say.
    res.evidence["body_text"] = vis[:4000]

    # ---- published contact addresses ------------------------------------ #
    # Only addresses the business published on this page. A missing email is
    # an honest answer, not a reason to guess one.
    emails = extract_emails(html=html, text=vis, site_domain=res.domain)
    if emails:
        res.evidence["email"] = emails[0].address
        res.evidence["emails"] = [c.address for c in emails]
    if text_len < 200 and not res.is_parked:
        res.findings.append(
            Finding("THIN_CONTENT", "Almost no content", 30,
                    f"Only ~{text_len} characters of visible text",
                    "Your homepage is essentially empty -- there isn't enough text "
                    "on it for Google to rank you for anything.")
        )

    if "lorem ipsum" in vis_low:
        res.findings.append(
            Finding("PLACEHOLDER", "Placeholder text left in", 35,
                    "Found 'lorem ipsum'",
                    "Your site still has 'lorem ipsum' placeholder text in it, so "
                    "parts of it were never finished.")
        )

    # ---- security / hygiene --------------------------------------------- #
    if "https://" in html:
        http_links = re.findall(r'(?:src|href)\s*=\s*["\']http://(?!www\.w3\.org|schemas)', html, re.I)
        res.evidence["mixed_content_count"] = len(http_links)
        if len(http_links) >= 5:
            res.findings.append(
                Finding("MIXED_CONTENT", "Insecure assets", 20,
                        f"{len(http_links)} http:// asset references",
                        f"Your site loads {len(http_links)} images or scripts over "
                        "unencrypted http, which browsers flag as insecure.")
            )

    insecure_form = re.findall(r'<form[^>]*action\s*=\s*["\']http://', html, re.I)
    if insecure_form and res.final_url.startswith("https://"):
        res.findings.append(
            Finding("INSECURE_FORM", "Form posts over plain http", 45,
                    "Form action uses http://",
                    "Your contact form submits over an unencrypted connection, so "
                    "anything a customer types into it travels in the clear.")
        )

    # Analytics gets its own check, and nothing else is allowed to make the
    # claim. The previous version hung a "no analytics" quote off the *modern
    # framework* check, so any site on an older page builder was told "there's no
    # analytics on your site" while quietly running Tag Manager. Both halves were
    # asserted as one fact and one of them was always wrong.
    has_analytics = any(m in low for m in ANALYTICS_MARKERS)
    res.evidence["has_analytics"] = has_analytics
    if not has_analytics:
        res.findings.append(
            Finding("NO_ANALYTICS", "No analytics installed", 12,
                    "No GA/GTM/Clarity/Hotjar markers found",
                    "Your site has no analytics installed, so you have no idea how "
                    "many people are actually looking at it.")
        )
    if not res.evidence.get("modern_stack") and not legacy and not has_analytics:
        res.findings.append(
            Finding("BARE_BONES", "No analytics and no modern tooling", 10,
                    "No analytics, no known framework, no legacy markers either",
                    "There's no analytics on your site, so you can't see how many "
                    "people visit or where they click.")
        )

    # ---- stale copyright ------------------------------------------------ #
    # Only years that have actually happened count. A stock theme can ship a
    # hardcoded "2038" in its footer markup, and treating that as the newest
    # date on the site hid the real one.
    this_year = datetime.now().year
    years = [int(y) for y in YEAR_RE.findall(html) if 1990 < int(y) <= this_year]
    if years:
        newest = max(years)
        age = datetime.now().year - newest
        res.evidence["copyright_year"] = newest
        if age >= 2:
            res.findings.append(
                Finding("STALE_COPYRIGHT", "Outdated copyright year", 18,
                        f"Newest copyright year on site is {newest}",
                        f"The newest copyright date anywhere on your site is "
                        f"{newest} -- which tells people the site hasn't been "
                        "touched in a while.")
            )

    # ---- reviews / trust widgets ---------------------------------------- #
    has_reviews_widget = any(m in low for m in CIAS)
    res.evidence["has_reviews_widget"] = has_reviews_widget
    if not has_reviews_widget and not modern:
        res.findings.append(
            Finding("NO_PROOF", "No reviews or trust signals on site", 20,
                    "No review widget or trust badge detected",
                    "Your site shows no Google reviews or trust badges, so visitors "
                    "get no reassurance before they call you.")
        )

    res.evidence["image_count"] = len(re.findall(r"<img\b", html, re.I))
    res.evidence["size_bytes"] = len(html)

    # ---- score ---------------------------------------------------------- #
    total_penalty = sum(f.penalty for f in res.findings)
    # flagged in the per-lead report.
    res.needs_rehab = total_penalty >= 30 or res.is_parked
    res.health = max(0, 100 - total_penalty)

    # ---- what a working site is still leaving on the table ---------------- #
    # Runs last, and only for sites that are actually alive. Every finding here
    # is penalty 0 on purpose: these are improvements, not defects, and charging
    # for them would drag healthy sites over the NEEDS_REHAB line above. They
    # exist so that a business with a good site still has something true to be
    # pitched -- see scraper/surfaces.py.
    if res.reachable and not res.is_parked and not res.serves_other_business:
        for key, present in check_metadata(html).items():
            res.evidence[f"meta_{key}"] = present
            if not present:
                spec = META_CHECKS[key]
                # The detail is the observation `lead.fact` prints verbatim as
                # "The fact to lead with", so it has to stand on its own. This
                # used to be the bare fragment "not present in the page head",
                # which came out as "The fact to lead with: not present in the
                # page head." -- no subject, so nothing to check, and wrong
                # besides: check_metadata scans the whole document rather than
                # the head, which means a recipient could disprove our one
                # verified fact just by scrolling. The label always names what
                # is missing, so the label is the observation.
                res.findings.append(
                    Finding(f"META_{key.upper()}", spec["label"], 0,
                            spec["label"], spec["quote"])
                )

        if not res.redirected_domain:
            for path, surface in check_text_files(res.final_url or url).items():
                spec = TEXT_SURFACES[path]
                key = f"has_{path.replace('.', '_').replace('/', '_')}"
                res.evidence[key] = surface.present
                res.evidence[f"{key}_confirmed"] = surface.absent
                if surface.present:
                    if path == "robots.txt" and robots_blocks_everything(surface.body):
                        res.findings.append(
                            Finding("ROBOTS_BLOCKS_ALL", "robots.txt blocks all crawlers", 40,
                                    "robots.txt contains 'Disallow: /'",
                                    "Your robots.txt tells search engines not to "
                                    "index anything on your site, which means you've "
                                    "dropped out of search results entirely.")
                        )
                    continue
                if not surface.absent:
                    # We never found out. Saying "you have no ads.txt" because
                    # the request timed out is exactly the kind of claim that
                    # discredits the whole report, so nothing is claimed.
                    continue
                res.findings.append(
                    Finding(f"NO_{path.replace('.', '_').upper()}", spec["label"], 0,
                            f"HTTP {surface.status} for /{path}", spec["quote"])
                )

    return res


def dns_resolves(host: str) -> bool:
    try:
        socket.getaddrinfo(host, None)
        return True
    except (socket.gaierror, UnicodeError):
        return False
