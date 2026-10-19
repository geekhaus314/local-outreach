"""Contact-address discovery.

The lead list has a phone number on 985 of 1,165 rows and an email address on
none of them, because the harvester collects phone from the Places listing and
never went looking for a mailbox. That makes the queue phone-only, which is the
wrong shape for outreach: a cold phone call interrupts someone, a cold email
does not, and TCPA exposure on unsolicited texts to local businesses is a real
liability in a way that a CAN-SPAM-compliant email is not.

So this module mines the address off the prospect's own site. That is the whole
ethical argument, and it is why this is safe to run at scale: every address
here was published by that business, on that business's own website, for exactly
this purpose. Nothing is guessed, bought, or inferred. If a site does not
publish an address, the lead stays phone-only and that is the honest answer.

Three tiers of confidence, in the order they are trusted:

    mailto:      a real link in the markup -- the site is offering this address
    visible:     an address rendered as page text, usually beside "Contact us"
    deobfuscated: "info [at] example [dot] com" -- deliberately hidden, so it
                  is still published, just awkward to scrape

Anything that fails the junk filter is dropped rather than ranked down. A wrong
address in a lead list is worse than a missing one: it bounces, it burns the
sending reputation, and it is the kind of failure that gets a domain
blacklisted for everyone behind it.
"""

from __future__ import annotations

import re
from dataclasses import dataclass
from urllib.parse import unquote, urlparse

from .http_client import registrable_domain

# Deliberately conservative. Anything here is a vendor, a placeholder, a build
# artefact, or an address that belongs to the platform rather than the business.
JUNK_LOCAL_PARTS = (
    "example", "domain", "yourdomain", "yourname", "youremail", "test",
    "demo", "sample", "placeholder", "changeme", "someone", "email",
    "name", "user", "username", "firstname", "lastname", "address",
    "sentry", "wixpress", "godaddy", "squarespace", "shopify", "stripe",
    "cloudflare", "w3", "sentry", "no-reply", "noreply", "donotreply",
    "postmaster", "abuse", "webmaster", "hostmaster", "root", "ftp",
    "mailer", "bounce", "bounces", "unsubscribe", "list", "info-list",
)

# File extensions that show up in srcset/href attributes and produce addresses
# that are real addresses belonging to the CDN, not the business.
_ASSET_SUFFIX = (
    ".png", ".jpg", ".jpeg", ".gif", ".svg", ".webp", ".avif", ".ico",
    ".css", ".js", ".json", ".woff", ".woff2", ".ttf", ".mp4", ".webm",
)

# Free mailbox providers. An address at one of these still reaches a person, and
# for a two-person shop it is often the only mailbox there is -- so it is not
# junk, it is just weaker evidence than an address on the site's own domain.
FREE_MAIL_HOSTS = (
    "gmail.com", "googlemail.com", "yahoo.com", "yahoo.co.uk", "hotmail.com",
    "outlook.com", "live.com", "msn.com", "aol.com", "icloud.com", "me.com",
    "mac.com", "gmx.com", "zoho.com", "protonmail.com", "proton.me",
    "fastmail.com", "comcast.net", "verizon.net", "att.net", "sbcglobal.net",
    "cox.net", "charter.net", "bellsouth.net", "earthlink.net", "juno.com",
    "mail.com", "yandex.com", "hey.com", "tutanota.com", "mail.ru",
)

# Addresses that are almost always a bot, a monitor, or an automated receipt.
AUTOMATED_LOCAL = (
    "noreply", "no-reply", "donotreply", "do-not-reply", "postmaster",
    "webmaster", "hostmaster", "abuse", "billing", "invoice", "receipt",
    "payment", "payments", "orders", "order", "shipping", "notify",
    "notification", "notifications", "alerts", "alert", "bounce", "bounces",
    "unsubscribe", "mailer-daemon", "root", "ftp", "www", "web", "info-list",
    "sales-notification", "system", "support-notification", "no-reply",
)

# The best cold-outreach targets for a small business, in order. A person at a
# business with no staff is often the owner, and "info@" is frequently the only
# monitored box.
ROLE_PRIORITY = (
    "info", "contact", "hello", "office", "team", "service", "sales",
    "owner", "admin", "enquiries", "inquiries", "support", "help", "front",
    "office", "reception", "book", "booking", "appointments", "shop",
    "office", "mail", "email",
)

EMAIL_RE = re.compile(
    r"\b[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,24}\b"
)

# "info [at] example [dot] com" -- the full spelling out.
DEOBF_DOT_RE = re.compile(
    r"([A-Za-z0-9._%+\-]+)\s*(?:\[|\(|\{)?\s*(?:at|@)\s*(?:\]|\)|\})?\s*"
    r"([A-Za-z0-9\-]+)\s*(?:\[|\(|\{)?\s*(?:dot|punkt)\s*(?:\]|\)|\})?\s*"
    r"([A-Za-z]{2,24})\b",
    re.I,
)

# "info(at)example.com", "info@ example.com", "info at example.com" -- the
# separator is spelled out but the domain is left intact, which is the more
# common variant of the trick.
DEOBF_AT_RE = re.compile(
    r"([A-Za-z0-9._%+\-]+)\s*(?:\[|\(|\{)?\s*(?:at|@)\s*(?:\]|\)|\})?\s*"
    r"([A-Za-z0-9\-]+(?:\.[A-Za-z0-9\-]+)*\.[A-Za-z]{2,24})\b",
    re.I,
)

# Top-level domains that are really file extensions. "hero@2x.png" parses as a
# perfectly well-formed address, and the only thing that catches it is knowing
# that nobody has a mailbox at a .png.
ASSET_TLDS = frozenset(
    {
        "png", "jpg", "jpeg", "gif", "svg", "webp", "avif", "ico", "css",
        "js", "json", "woff", "woff2", "ttf", "otf", "eot", "mp4", "webm",
        "mov", "pdf", "zip", "psd", "ai", "eps", "html", "htm", "xml",
        "php", "asp", "aspx", "txt", "csv",
    }
)

MAILTO_RE = re.compile(r"mailto:([^\"'?>\s]+)", re.I)

# Pages worth a second fetch when the homepage has no address on it. Ordered by
# how often the address actually is there.
CONTACT_PATHS = ("/contact", "/contact-us", "/contactus", "/get-in-touch", "/about")


@dataclass(frozen=True)
class Candidate:
    """One address, and how much we trust it."""

    address: str
    source: str  # mailto | visible | deobfuscated
    local: str
    host: str
    on_site_domain: bool

    @property
    def role(self) -> str:
        """The role part of a role-based address, lowercased."""
        return self.local.split("+", 1)[0].split(".", 1)[0].strip().lower()


def _is_junk(address: str) -> bool:
    """True when an address is a vendor, a placeholder, or an asset path."""
    low = address.lower()
    local, _, host = low.partition("@")
    if not local or not host or "." not in host:
        return True
    # sentry.io, wixpress.com, godaddy.com and friends are the platform, not
    # the business. Rejecting the whole domain is safer than allow-listing.
    junk_hosts = ("sentry.io", "wixpress.com", "wix.com", "godaddy.com",
                  "squarespace.com", "shopify.com", "cloudflare.com",
                  "example.com", "example.org", "example.net", "domain.com",
                  "yourdomain.com", "email.com", "test.com", "localhost",
                  "company.com", "mycompany.com", "business.com")
    if host in junk_hosts or any(host.endswith("." + h) for h in junk_hosts):
        return True
    # A local part that is a file name is a srcset attribute, not a mailbox.
    stem = local.rsplit("@", 1)[0]
    if any(stem.endswith(sfx) for sfx in _ASSET_SUFFIX):
        return True
    # "info@2x.png" and friends.
    if re.fullmatch(r"[0-9]+x?", local):
        return True
    if local in AUTOMATED_LOCAL:
        return True
    # A local part that is itself a filename is how Shopify/Wix emit asset
    # addresses into visible text; catch the tail.
    tail = local.rsplit("/", 1)[-1].rsplit(".", 1)[0]
    if tail and tail in JUNK_LOCAL_PARTS:
        return True
    if any(p in local for p in ("example", "yourdomain", "sentry", "wixpress")):
        return True
    # Require a plausible TLD of letters only -- and not one that is really a
    # file extension, which is the only thing that separates a real address
    # from "hero@2x.png" in a srcset attribute.
    tld = host.rsplit(".", 1)[-1]
    if not tld.isalpha() or len(tld) < 2 or tld in ASSET_TLDS:
        return True
    return False


def _clean(address: str) -> str:
    """Strip the decoration that survives extraction."""
    return unquote(address).strip().strip(".,;:'\"").lower()


def _mk(address: str, source: str, site_domain: str) -> Candidate | None:
    address = _clean(address)
    if not address or not EMAIL_RE.fullmatch(address):
        return None
    if _is_junk(address):
        return None
    local, _, host = address.partition("@")
    if not local or not host:
        return None
    on_site = False
    if site_domain:
        on_site = registrable_domain(host) == registrable_domain(site_domain)
    return Candidate(address=address, source=source, local=local, host=host,
                     on_site_domain=on_site)


def _rank(c: Candidate) -> tuple:
    """Order candidates so the best address is first.

    On-site domain beats free mailbox; a mailto: beats rendered text; a real
    role beats a person's name; and an address that looks like a role name
    sorts ahead of one that does not.
    """
    is_role = c.role in ROLE_PRIORITY
    return (
        0 if c.on_site_domain else 1,
        0 if c.source == "mailto" else 1,
        0 if is_role else 1,
        ROLE_PRIORITY.index(c.role) if is_role else len(ROLE_PRIORITY),
        c.address,
    )


def extract(html: str = "", text: str = "", site_domain: str = "") -> list[Candidate]:
    """Every usable address on one page, best first.

    ``html`` is raw markup, ``text`` is its visible text. Both are scanned
    because a site can hide the address in a mailto: that never appears as
    text, and a site can also print it as plain text with no link at all.
    """
    found: dict[str, Candidate] = {}

    def add(address: str, source: str) -> None:
        c = _mk(address, source, site_domain)
        if c and c.address not in found:
            found[c.address] = c

    # 1. mailto: -- strongest evidence, the site links it on purpose.
    for raw in MAILTO_RE.findall(html or ""):
        # mailto:?subject=... -- drop the query before parsing.
        add(raw.split("?", 1)[0], "mailto")

    # 2. Addresses visible in the markup.
    for raw in EMAIL_RE.findall(html or ""):
        add(raw, "visible")

    # 3. Addresses visible in the rendered text.
    for raw in EMAIL_RE.findall(text or ""):
        add(raw, "visible")

    # 4. Deliberately obfuscated addresses, both spellings of the trick. Scanned
    #    in the markup as well as the text, because the anti-scraper version is
    #    usually a <span> with the separator written out inside it.
    for blob in (html or "", text or ""):
        for local, host, tld in DEOBF_DOT_RE.findall(blob):
            add(f"{local}@{host}.{tld}", "deobfuscated")
        for local, host in DEOBF_AT_RE.findall(blob):
            add(f"{local}@{host}", "deobfuscated")

    ordered = sorted(found.values(), key=_rank)
    return ordered


def best(cands: list[Candidate]) -> str:
    """The single address to use for outreach, or '' if there is none."""
    return cands[0].address if cands else ""


def host_of(address: str) -> str:
    return urlparse("mailto:" + address).hostname or ""
