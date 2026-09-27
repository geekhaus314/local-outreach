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
from urllib.parse import urlparse

from .config import (
    LEGACY_STACK_MARKERS,
    MODERN_STACK_MARKERS,
    PARKED_MARKERS,
    SOCIAL_HOSTS,
    WEAK_PARKED_MARKERS,
)
from .http_client import fetch_page, normalize_url, registrable_domain

try:  # optional, we have a regex fallback for the few places it matters
    from bs4 import BeautifulSoup
except ImportError:  # pragma: no cover
    BeautifulSoup = None  # type: ignore[assignment]

TAG_RE = re.compile(r"<(script|style|noscript)[^>]*>.*?</\1>", re.I | re.S)
TITLE_RE = re.compile(r"<title[^>]*>(.*?)</title>", re.I | re.S)
META_RE = re.compile(r"<meta\b[^>]*>", re.I)
ATTR_RE = re.compile(r'([\w:-]+)\s*=\s*["\']?([^"\'>\s]*)', re.I)
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
ANALYTICS_MARKERS = (
    "google-analytics", "googletagmanager", "gtag(", "ga.js",
    "facebook.net", "clarity.ms", "hotjar", "plausible.io", "matomo",
)
FORM_MARKERS = ("<form",)
CIAS = ("sentry", "trustpilot", "bbb.org", "google.com/maps", "gmpg.org")


def _meta_tags(html: str) -> list[dict[str, str]]:
    tags: list[dict[str, str]] = []
    for raw in META_RE.findall(html):
        attrs = {k.lower(): v for k, v in ATTR_RE.findall(raw)}
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


def audit_url(url: str) -> AuditResult:
    """Run the full audit against one URL. Never raises."""
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
    res.title = title[:200]

    vis = _visible_text(html)
    vis_low = vis.lower()
    text_len = len(vis.strip())

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
        if nm.startswith("og:") and "og_title" not in res.evidence:
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
    has_viewport = bool(viewport) and "width" in viewport.lower()
    res.evidence["has_viewport"] = has_viewport
    res.evidence["no_viewport"] = not has_viewport
    if not has_viewport:
        res.findings.append(
            Finding("NO_MOBILE", "No mobile viewport", 55,
                    "No <meta name=viewport> tag",
                    "Your site isn't set up for phones -- visitors on mobile see a "
                    "shrunken desktop page, and most of your customers will be "
                    "searching from one.")
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
    has_booking = any(m in vis or m in low for m in BOOKING_MARKERS)
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

    # ---- thin content --------------------------------------------------- #
    # text_len was computed above, before the parked check, so it is reused.
    res.evidence["text_length"] = text_len
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

    if not res.evidence.get("modern_stack"):
        res.findings.append(
            Finding("NO_ANALYTICS_OR_MODERN", "No analytics / modern tooling", 10,
                    "No known analytics or modern framework detected",
                    "There's no analytics on your site, so you can't see how many "
                    "people visit or where they click.")
        )
    has_analytics = any(m in low for m in ANALYTICS_MARKERS)
    res.evidence["has_analytics"] = has_analytics
    if not has_analytics:
        res.findings.append(
            Finding("NO_ANALYTICS", "No analytics installed", 12,
                    "No GA/GTM/Clarity/Hotjar markers found",
                    "Your site has no analytics installed, so you have no idea how "
                    "many people are actually looking at it.")
        )

    # ---- stale copyright ------------------------------------------------ #
    years = [int(y) for y in YEAR_RE.findall(html) if 1990 < int(y) <= 2100]
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
    res.health = max(0, 100 - total_penalty)
    res.needs_rehab = total_penalty >= 30 or res.is_parked
    return res


def dns_resolves(host: str) -> bool:
    try:
        socket.getaddrinfo(host, None)
        return True
    except (socket.gaierror, UnicodeError):
        return False
