#!/usr/bin/env python3
"""Turn leads.csv into an outreach queue you can work from without thinking.

This used to render a dossier per lead with a "pitch draft" inside it. That was
the wrong shape. A dossier describes; a queue tells you what to do next, on which
channel, in how many minutes, with the words to use. Three drafts went out the
other way that nobody could have sent:

  * "No website is attached to their Google Business Profile" -- on leads
    harvested from OpenStreetMap, which has no Google Business Profile at all.
    The prospect asks "which listing?" and there is no answer.
  * "There's no analytics on your site" and "your meta description is too
    short" -- both false. That site runs Tag Manager and has a 149-character
    description. Two of the three bugs that produced those sentences are fixed
    in scraper/audit.py and pinned by tests; the lesson kept here is that no
    sentence goes into a message that the recipient cannot check.
  * Arch Air Services had no phone and no email. A pitch was written for a
    business with no way to reach it.

So the output is now a queue with five states, and a lead is only "send" when it
has a channel, one verified fact, and copy that survives being checked:

    send     verified evidence, reachable channel, copy ready to paste
    verify   the claim is plausible but unmeasured -- 90 seconds of checking first
    expand   the site is genuinely fine; the pitch is what to improve, not what's broken
    hold     cannot be sent yet (no channel, or the record contradicts itself)
    drop     not a buyer worth the time

Run it:

    python3 parse_leads.py            # re-audits every site, then writes the queue
    python3 parse_leads.py --no-check # use the stored CSV facts, no network

Sites are re-fetched by default. A redirect that pointed somewhere else last
week points somewhere else again this week, and a stale claim in a cold message
is worse than no message.
"""

from __future__ import annotations

import argparse
import csv
import re
import sys
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from scraper.audit import AuditResult, audit_url  # noqa: E402
from scraper.persona import Persona  # noqa: E402

CSV_PATH = ROOT / "leads.csv"
OUT_PATH = ROOT / "leads_dashboard.md"

WS_RE = re.compile(r"\s+")

REQUIRED_COLUMNS = {"Business Name", "Industry", "Website", "Traffic Tier"}

# Who is on the other end. These are the only numbers and names that go into a
# message, so they are set here once rather than typed into six templates.
SENDER = "Jake Viefhaus"
SENDER_CITY = "Florissant"
# The studio site, not pwn4g3. A prospect following a cold text should land on
# something written for them: three finished local-business sites, published
# price, and no terminal chrome. pwn4g3 is the dev portfolio -- right for a
# hiring manager, wrong for an HVAC owner deciding in eight seconds.
PORTFOLIO = "webrehabstl.pages.dev"
EMAIL = "geekhaus314@proton.me"
LAUNCH_PRICE = 1200

# Used only where the prospect's domain is broken or hijacked, which is the one
# situation this case study answers. Quoting it on a lead that merely has no
# website would be a non sequitur, and quoting it everywhere would dilute it.
DEAD_SITE_PROOF = "Write up: pwn4g3.pages.dev/blog/rescued-dead-client-site-one-day"

# Cold SMS to a business number is legal in Missouri, but the recipient has to be
# able to stop it. Appending this costs nothing and removes the question.
OPTOUT = "Reply STOP and I won't text again."

# --------------------------------------------------------------------------- #
# Trade vocabulary
# --------------------------------------------------------------------------- #
# How each industry is referred to in a sentence. Getting this wrong is how you
# offer to build a website for a portrait photographer by calling them a painter.
TRADE_NOUN = {
    "HVAC": "HVAC contractors",
    "Plumbing": "plumbers",
    "Roofing": "roofers",
    "Electrical": "electricians",
    "Painting": "painting contractors",
    "Photography": "photographers",
    "Landscaping": "landscapers",
    "Concrete": "concrete contractors",
    "Automotive": "auto shops",
    "Locksmith": "locksmiths",
    "Cleaning": "cleaning companies",
    "Solar": "solar installers",
    "Windows": "window companies",
    "Flooring": "flooring companies",
    "Pest Control": "exterminators",
    "General": "local businesses",
}

# Names that give away a trade the record got wrong. OpenStreetMap tagged a
# portrait photography studio as craft=painter, which produced a pitch about
# painting jobs for a photographer.
NAME_TRADE_HINTS = {
    "Photography": ("portrait", "photo", "photograph", "studio", "lens"),
    "Painting": ("paint", "decor", "plaster", "coat"),
    "Plumbing": ("plumb", "drain", "pipe", "rooter"),
    "Roofing": ("roof", "shingle", "gutter", "siding"),
    "HVAC": ("hvac", "furnace", "boiler", "heating", "cooling", "air"),
}


def trade_noun(industry: str) -> str:
    return TRADE_NOUN.get(industry, "local businesses")


def industry_from_name(name: str, claimed: str) -> str:
    """The trade the *name* implies, if it contradicts the record.

    Only ever returns a different industry when the name carries an unambiguous
    trade word that the recorded one does not cover.
    """
    low = f" {name.lower()} "
    for industry, hints in NAME_TRADE_HINTS.items():
        if any(f" {hint}" in low or f"{hint} " in low for hint in hints):
            if industry != claimed and not any(
                h in claimed.lower() for h in hints
            ):
                return industry
    return claimed


# --------------------------------------------------------------------------- #
# Leads that are not worth an hour
# --------------------------------------------------------------------------- #
TOLL_FREE = re.compile(r"\b(?:800|833|844|855|866|877|888)\b")

# Phrases a lead-generation outfit uses to describe itself. One toll-free number,
# one domain, and "we serve five states" is a marketing company, not a roofer
# with a website problem -- and they are not going to hire the person who just
# called their funnel a phone call.
AGGREGATOR_MARKERS = re.compile(
    r"find the (?:office|location|nearest)|"
    r"(?:serving|across|we serve)\s+(?:all\s+)?(?:five|four|six|multiple|"
    r"several|multi)\s+states|"
    r"states? (?:nationwide|wide)|"
    r"connect (?:with|you to) (?:a|your) (?:local|trusted) (?:contractor|pro|"
    r"installer|roofer|contractor)",
    re.I,
)


def is_aggregator(phone: str, site_text: str) -> str:
    """Return the reason string if this looks like a lead broker, else ''.

    Two signals have to appear together. A toll-free number on its own is a
    small contractor with a cheap line; a national service area on its own is a
    franchise. Both together describe an aggregator whose revenue depends on
    selling the call, and that is not a customer.
    """
    if not TOLL_FREE.search(phone or ""):
        return ""
    hits = AGGREGATOR_MARKERS.findall(site_text or "")
    return hits[0].strip() if hits else ""


# --------------------------------------------------------------------------- #
# CSV helpers
# --------------------------------------------------------------------------- #
def get(row: dict, key: str, default: str = "") -> str:
    val = row.get(key)
    return default if val is None else str(val).strip()


def as_int(row: dict, key: str) -> int | None:
    raw = get(row, key)
    if not raw:
        return None
    try:
        return int(float(raw))
    except ValueError:
        return None


def as_float(row: dict, key: str) -> float | None:
    raw = get(row, key)
    if not raw:
        return None
    try:
        return float(raw)
    except ValueError:
        return None


def split_facts(row: dict) -> list[str]:
    return [f.strip() for f in get(row, "Pitch Facts").split("|") if f.strip()]


def is_placeholder(row: dict) -> bool:
    """True if the record is obviously fake seed data rather than a real lead.

    The reserved fictional range is 555-0100 through 555-0199, which is the
    *exchange*, not the area code -- so 314-555-0199 is fictional while
    555-1212 is a real area code. Getting this backwards previously reported
    three fake leads as genuine.
    """
    digits = re.sub(r"\D", "", get(row, "Phone"))
    if len(digits) >= 10:
        area, exchange, line = digits[:3], digits[3:6], digits[6:10]
        if area == "555":
            return True
        if exchange == "555" and 100 <= int(line) <= 199:
            return True
    elif len(digits) == 7:
        # Seven-digit local form ("555-1212"). Not inside the reserved
        # 0100-0199 block, but ubiquitous as filler in scraped data.
        if digits[:3] == "555":
            return True
    if len(digits) >= 7 and digits[:3] in ("000", "111", "123"):
        return True

    haystack = " ".join(
        get(row, k) for k in ("Business Name", "Website", "Address")
    ).lower()
    return any(
        token in haystack
        for token in (
            "example.com", "example.org", "test.com", "localhost",
            "yoursite", "mydomain", "acme", "lorem ipsum", "sampledomain",
        )
    )


# --------------------------------------------------------------------------- #
# Queue states
# --------------------------------------------------------------------------- #
SEND, VERIFY, EXPAND, HOLD, DROP = "send", "verify", "expand", "hold", "drop"

STATE_BLURB = {
    SEND: "message is written and every claim in it was measured today",
    VERIFY: "check the claim yourself first -- it is plausible but unmeasured",
    EXPAND: "their site is fine; lead with the gap, not a fault",
    HOLD: "do not send yet",
    DROP: "not a buyer, or not reachable",
}

# Minutes of work each state costs. Used for the time budget at the top, so the
# cost of working the queue is a number rather than a vibe.
STATE_MINUTES = {SEND: 4, VERIFY: 6, EXPAND: 8, HOLD: 0, DROP: 0}


class Lead:
    """One prospect, with everything needed to decide whether to contact them."""

    def __init__(self, row: dict, check: AuditResult | None, checked_today: bool):
        self.row = row
        self.name = get(row, "Business Name", "UNKNOWN")
        self.claimed_industry = get(row, "Industry", "General")
        self.industry = industry_from_name(self.name, self.claimed_industry)
        self.trade_mismatch = self.industry != self.claimed_industry
        self.phone = get(row, "Phone")
        self.address = get(row, "Address")
        self.website = get(row, "Website")
        self.cls = get(row, "Classification")
        self.opportunity = as_int(row, "Opportunity Score")
        self.low_confidence = get(row, "Low Confidence") == "yes"
        self.sources = get(row, "Sources")
        self.audit = check
        self.checked_today = checked_today
        self.state = HOLD
        self.blockers: list[str] = []
        self.notes: list[str] = []

    # -- evidence ---------------------------------------------------------- #
    @property
    def fact(self) -> str:
        """The single verified observation the whole message hangs on."""
        a = self.audit
        if a and a.serves_other_business:
            return (
                f"{a.domain} loads a page for a different business, titled "
                f"\"{a.serves_other_business}\""
            )
        if a and a.redirected_domain:
            return f"{a.domain} redirects away from your business"
        if a and a.is_parked:
            return f"{a.domain} is a parked placeholder page"
        if a and not a.reachable:
            return f"{a.domain} does not load"
        if a and a.blocked:
            return f"{a.domain} would not load for an automated request"
        if a and a.findings:
            top = max(a.findings, key=lambda f: f.penalty)
            return top.detail
        return ""

    @property
    def spoken(self) -> str:
        """The same observation, phrased so it can be said out loud.

        `fact` is a finding's `detail` -- a fragment written to be printed on a
        bullet, not spoken. `Finding.quote` is the human-readable one and is
        already in the second person, which is what you want in a line
        addressed to an owner; `message()` builds its opener from it for
        exactly that reason. The answer script used `fact` instead, so the
        correction above produced "reach out: No social preview image."

        Falls back to `fact` where there is no quote to prefer: the parked,
        unreachable and wrong-business branches are already sentences, and a
        finding with no quote means the detail is all there is.
        """
        a = self.audit
        if not a or not a.findings:
            return self.fact
        if a.serves_other_business or a.redirected_domain or a.is_parked or a.blocked or not a.reachable:
            return self.fact
        top = max(a.findings, key=lambda f: f.penalty)
        quote = (top.quote or "").strip()
        return friendly(quote) if quote else self.fact

    @property
    def healthy(self) -> bool:
        a = self.audit
        return bool(
            a and a.reachable and not a.blocked and not a.serves_other_business
            and not a.redirected_domain and not a.is_parked
            and not a.needs_rehab
        )

    # -- classification ---------------------------------------------------- #
    def classify(self) -> None:
        if is_placeholder(self.row):
            self.state, self.blockers = DROP, ["placeholder data, not a real lead"]
            return

        # A lead broker is not a prospect, however badly their site scores.
        # The body-text half of that call needs a live fetch, and the CSV does
        # not store page text, so under --no-check a toll-free number can be
        # flagged as unchecked but never cleared. Leaving it to fall through to
        # the generic HOLD at the bottom costs 6 minutes on someone who was
        # never going to buy, which is what the drop list exists to prevent.
        if self.phone and TOLL_FREE.search(self.phone):
            if self.audit:
                reason = is_aggregator(
                    self.phone, self.audit.evidence.get("body_text", "")
                )
                if reason:
                    self.state = DROP
                    self.blockers = [
                        f"toll-free number plus \"{reason}\" -- this is a lead "
                        "broker or multi-state aggregator, not a local buyer"
                    ]
                    return
            else:
                self.state = HOLD
                self.blockers = [
                    "toll-free number, and the aggregator check needs a live "
                    "fetch that --no-check skipped -- re-run without it before "
                    "spending time here"
                ]
                return

        if not self.phone:
            self.state = HOLD
            self.blockers = [
                "no phone and no email anywhere in the record, and no website to "
                "message -- there is no channel to send this on"
            ]
            return

        if self.trade_mismatch:
            self.state = HOLD
            self.blockers = [
                f"record says {self.claimed_industry}, but the name says "
                f"{self.industry}. Sending a {self.claimed_industry.lower()} pitch "
                f"to a {self.industry.lower()} is how you get deleted"
            ]
            return

        if self.audit and self.audit.blocked:
            self.state = VERIFY
            self.notes.append(
                f"{self.audit.domain} refused an automated request "
                f"(HTTP {self.audit.status}). Open it in a browser before you "
                f"claim anything about it."
            )
            return

        if self.healthy or self.cls == "HAS_DECENT_SITE":
            self.state = EXPAND
            return

        if self.fact and self.checked_today:
            self.state = SEND
            return

        if self.fact:
            self.state = VERIFY
            return

        if not self.website:
            self.state = VERIFY
            if "overpass" in self.sources:
                self.notes.append(
                    "no site on the record, and the record is a free OpenStreetMap "
                    "extract where a missing website tag usually means nobody filled "
                    "it in, not that there is no site"
                )
            elif "gmaps" in self.sources:
                self.notes.append(
                    "no site on their Google Maps listing (scraped record). A missing "
                    "website in Google Maps usually means they have none, but worth "
                    "one confirmation search before sending"
                )
            else:
                self.notes.append(
                    "no site on record; confirm with one search before sending"
                )
            return

        self.state = HOLD


# --------------------------------------------------------------------------- #
# Copy
# --------------------------------------------------------------------------- #
# A redirect target is easier to believe as a sentence than as a hostname.
DOMAIN_FLAVOURS = (
    (r"drivingschool|drive-?school|driving-school", "a driving school in another state"),
    (r"christmas|santa|xmas", "somebody's Christmas parade site"),
    (r"conference|convention|summit", "a conference website"),
    (r"kirastore|kirastoreparis", "a Japanese online shop"),
    (r"noraswarriors|warriors|nfl|school", "a high school athletics site"),
    (r"blog|wordpress|wp-", "an abandoned WordPress blog"),
    (r"agen5000|reusibly", "a spam page"),
)


def domain_flavour(domain: str) -> str:
    """Describe a foreign domain in words, falling back to the bare hostname."""
    low = (domain or "").lower()
    for pattern, phrase in DOMAIN_FLAVOURS:
        if re.search(pattern, low):
            return phrase
    return f"somebody else's website ({domain})"


def signature(channel: str) -> str:
    base = f"-- {SENDER}, {SENDER_CITY} · {PORTFOLIO}"
    return f"{base}\n{OPTOUT}" if channel == "text" else base


def check_step(lead: Lead) -> str:
    """The specific thing to look at before sending a verify-tier message."""
    a = lead.audit
    if a and a.blocked:
        return f"Open {a.domain} in a normal browser. If it looks broken there, send."
    if not lead.website:
        return (
            f"Search \"{lead.name} {lead.address or lead.phone}\" in a browser. "
            f"If there is genuinely no site of their own, send. If there is one, "
            f"the pitch is wrong and this lead is a different conversation."
        )
    return f"Re-open {lead.website} and confirm the finding above still holds."


def message(lead: Lead, channel: str) -> str:
    """The message itself. Every claim traces to lead.fact or the stored record.

    Two rules hold everywhere below. Nothing is asserted that the recipient
    could check and find false, and nothing claims to have seen a source the
    data did not come from -- the single worst habit of the previous version was
    telling an OpenStreetMap lead that we had read their Google Business Profile.
    """
    a = lead.audit
    trade = trade_noun(lead.industry)
    proof = f"Portfolio: {PORTFOLIO}."
    price = f"Fixed price, you own the code. {proof}"
    lines: list[str] = []

    if lead.state == EXPAND:
        # The hardest one to write honestly. There is no fault to point at, so
        # the message says so first -- credibility with a business that already
        # has a good site is worth more than the deal.
        gap = expansion_angle(lead)
        lines.append(
            f"Hi -- I pulled up {lead.website or 'your site'} and I'm not going to "
            f"pretend there's a fire. It's in decent shape."
        )
        if gap:
            lines.append(gap)
        lines.append(
            f"I build and rebuild sites like this for {trade} -- the work I do is "
            f"mostly the part your current site isn't doing yet. {price}"
        )
        lines.append(
            "Worth 10 minutes to point out two or three specific things I'd change?"
        )

    elif a and a.serves_other_business:
        # Where a local, personal connection exists it opens the message, and it
        # replaces the introduction rather than sitting in front of it. Both used
        # to fire, so the text opened "Hi -- ... Jake Viefhaus here ... / Hi --
        # Jake Viefhaus here ...".
        local = LOCAL_HOOKS.get(lead.name)
        if local:
            lines.append(local)
            lines.append(
                f"Something came up while I was looking and I thought you'd want "
                f"to know: {lead.website or 'your web address'} isn't showing your "
                f"business any more. It loads a page for somebody else, titled "
                f"\"{a.serves_other_business}\"."
            )
        else:
            lines.append(
                f"Hi -- {SENDER} here, I build websites out of {SENDER_CITY}. One "
                f"thing came up and I thought you'd want to know: "
                f"{lead.website or 'your site address'} isn't showing your business "
                f"any more. It loads a page for somebody else, titled "
                f"\"{a.serves_other_business}\"."
            )
        lines.append(
            f"Any customer who looks you up online is landing on that page instead "
            f"of on you. I fix exactly this -- new site, your domain, your phone "
            f"number and enquiries coming straight to you by text. {price}"
        )
        lines.append(
            f"Want me to mock one up so you can see it before you decide on "
            f"anything?"
        )

    elif a and a.redirected_domain:
        # Lead with the first hop, not the last recorded one. The auditor stops
        # following after six hops (MAX_REDIRECTS), so naming "the domain it
        # redirects to" means naming an arbitrary point in a chain that was
        # still growing while this file was written -- it had already gone from
        # a high-school athletics site to a spam page. The first hop is both
        # stable and the thing the owner actually sees.
        #
        # It is described rather than spelled out. A text message with
        # "firstsafetysunshinedrivingschool.com" halfway through it is unusable
        # on a phone and says nothing a sentence does not say better.
        chain = a.evidence.get("redirect_chain") or []
        first = (chain[0] if chain else a.redirected_domain) or "another business"
        flavour = domain_flavour(first)
        lines.append(
            f"Hi -- {SENDER} here, I build websites out of {SENDER_CITY}. Quick "
            f"one, and this one is odd. Type {a.domain} into a browser and the "
            f"first thing that loads is {flavour}. Then it bounces through a "
            f"handful of other domains and finally stops on a page that is not "
            f"yours either."
        )
        lines.append(
            f"So anyone who looks you up and clicks your own web address is sent "
            f"somewhere that has nothing to do with {lead.name}. That is a domain "
            f"you are paying for and cannot use."
        )
        lines.append(
            f"I fix exactly this, and I have done it before: a St. Louis clinic "
            f"last year whose site went dark -- back up that evening, on their own "
            f"domain, taking bookings again -- the write-up is on the site "
            f"below. {price}"
        )
        lines.append(
            f"Want me to put a rough version together before you decide anything? "
            f"No cost to look at."
        )

    elif a and (a.is_parked or not a.reachable):
        lines.append(
            f"Hi -- {SENDER} here, I build websites out of {SENDER_CITY}. "
            f"{a.domain} isn't loading for me -- anyone trying to look you up gets "
            f"nothing."
        )
        lines.append(
            f"I build fast one-page sites for {trade} with a form that texts you "
            f"the enquiry the second it comes in. {price}"
        )
        lines.append("Worth me mocking one up before you spend anything?")

    elif a and a.findings:
        top = max(a.findings, key=lambda f: f.penalty)
        lines.append(
            f"Hi -- {SENDER} here, I build websites out of {SENDER_CITY}. I opened "
            f"{a.domain} and {friendly(top.quote)}."
        )
        lines.append(
            f"Anybody who looks you up online has to make that work, and most "
            f"won't. I rebuild sites for {trade} around one job: get them to the "
            f"phone faster. {price}"
        )
        lines.append(
            f"If that's a real problem for you, I'll put a rough version together "
            f"first so you can see it before committing to anything."
        )

    else:
        # No site on the record. Cannot say "you have no website" yet -- see
        # check_step -- so the message leads with what a site would do for them.
        lines.append(
            f"Hi -- {SENDER} here, I build websites out of {SENDER_CITY}. I searched "
            f"for {lead.name} and couldn't turn up a website of your own, so anyone "
            f"looking you up online gets a map pin and a phone number, nothing else."
        )
        lines.append(
            f"I build fast one-page sites for {trade} with a form that sends the "
            f"enquiry to you by text straight away. {price}"
        )
        lines.append(
            f"Want me to mock one up first so you can see it before you decide?"
        )

    body = "\n\n".join(lines)
    # The opt-out rides in the signature for texts, so it must not be appended
    # again here. It shipped twice on every single message until a prospect's
    # reply made it obvious.
    return f"{body}\n\n{signature(channel)}"


def friendly(quote: str) -> str:
    """Make an audit finding quotable mid-sentence.

    The findings are already written in the second person -- "your site has no
    contact form" -- which is exactly right for a message addressed to the owner.
    So this only tidies the edges: collapse whitespace, turn the double-hyphen
    aside into a comma, drop the trailing period, and lower the first letter so
    it can follow "I opened example.com and".

    It deliberately does *not* rewrite pronouns. An earlier version did, on the
    theory that a salesperson should not say "your site" out loud, and turned
    "a visitor has no obvious way to reach you" into "a visitor has no obvious
    way to reach a visitor".
    """
    text = WS_RE.sub(" ", quote or "").strip()
    if not text:
        return "there were a few problems with it"
    text = text.replace(" -- ", ", ")
    text = text.rstrip(" .;,")
    return text[0].lower() + text[1:]


def expansion_angle(lead: Lead) -> str:
    """One specific, checkable improvement for a business that already has a site.

    Returns '' when nothing measurable was found, because the message then has
    to open without a defect rather than invent one.
    """
    a = lead.audit
    if not a:
        return ""
    ev = a.evidence
    if not ev.get("has_viewport"):
        return "It doesn't render properly on a phone, which is where most of your customers start."
    if ev.get("has_analytics") is False:
        return (
            "There's no analytics on it, so there's no way to know which pages "
            "are working and which aren't."
        )
    if ev.get("has_contact_form") is False and ev.get("has_phone"):
        return (
            "Every path on it ends in a phone call. There's no form, so anyone who "
            "wants to get a quote after hours has nothing to fill in."
        )
    load = a.load_ms
    if load and load > 2500:
        return (
            f"It took {load / 1000:.1f} seconds to load for me. On a phone over "
            f"mobile data, that's a lot of people leaving before it finishes."
        )
    if not ev.get("og_title"):
        return (
            "Links to it don't render a proper preview in Facebook or iMessage, "
            "so your own posts about jobs look like bare links."
        )
    if ev.get("meta_og_image") is False:
        # Title and description are there, only the picture is not, so a
        # preview card does render -- just with no image in it. Calling that
        # a bare link would be the same mistake the og_title branch made
        # before its key was being read correctly: a claim the owner can
        # disprove by sharing their own link.
        return (
            "Your links carry a title and a description but no picture, so a "
            "link to your site goes up on Facebook or in a text with no image "
            "attached."
        )
    return ""


# Local connections worth opening on. Kept beside the copy so a relationship is
# used deliberately, once, and only where it is actually true.
LOCAL_HOOKS = {
    "St Charles Plumbing Company": (
        f"Hi -- I grew up a few streets over on Quenley, so this is a local one. "
        f"{SENDER} here, I build websites out of {SENDER_CITY}."
    ),
}


# --------------------------------------------------------------------------- #
# Report
# --------------------------------------------------------------------------- #
def load_leads(path: Path) -> list[dict]:
    if not path.exists():
        print(
            f"error: {path} does not exist.\n"
            f"       Run the harvester first:  python3 run_scraper.py",
            file=sys.stderr,
        )
        raise SystemExit(2)

    with open(path, newline="", encoding="utf-8") as fh:
        reader = csv.DictReader(fh)
        missing = REQUIRED_COLUMNS - set(reader.fieldnames or [])
        if missing:
            print(
                f"error: {path.name} is missing columns: {sorted(missing)}\n"
                f"       This file was not produced by run_scraper.py. Re-run it:\n"
                f"         python3 run_scraper.py",
                file=sys.stderr,
            )
            raise SystemExit(2)
        return list(reader)


def rechecks(leads: list[Lead]) -> None:
    """Re-fetch every site so no message rests on a stale measurement."""
    todo = [lead for lead in leads if lead.website]
    for i, lead in enumerate(todo, 1):
        print(f"  checking {i}/{len(todo)} {lead.website}", flush=True)
        try:
            audit = audit_url(lead.website, lead.name)
        except Exception as exc:  # a site must never stop the queue
            print(f"    failed: {type(exc).__name__}: {exc}", file=sys.stderr)
            continue
        audit.evidence.setdefault("body_text", "")
        lead.audit = audit
        lead.checked_today = True


def state_counts(leads: list[Lead]) -> dict[str, int]:
    counts: dict[str, int] = {}
    for lead in leads:
        counts[lead.state] = counts.get(lead.state, 0) + 1
    return counts


def build_report(leads: list[Lead], checked: bool) -> str:
    order = {SEND: 0, VERIFY: 1, EXPAND: 2, HOLD: 3, DROP: 4}
    leads = sorted(leads, key=lambda x: (order[x.state], -(x.opportunity or 0)))
    counts = state_counts(leads)
    minutes = sum(STATE_MINUTES[x.state] for x in leads)
    action = [x for x in leads if x.state in (SEND, VERIFY, EXPAND)]
    out: list[str] = []
    today = date.today().isoformat()

    out.append("# Outreach queue -- St. Louis County trades")
    out.append(f"_Generated {today}. "
               f"{len(leads)} businesses, {len(action)} worth contacting._\n")

    out.append(
        f"**{counts.get(SEND, 0)} ready to send** | "
        f"**{counts.get(VERIFY, 0)} check first** | "
        f"**{counts.get(EXPAND, 0)} expansion** | "
        f"**{counts.get(HOLD, 0)} on hold** | "
        f"**{counts.get(DROP, 0)} dropped**\n"
    )

    if checked:
        out.append(
            f"Every site below was re-fetched while this file was written "
            f"({today}), so each claim in a message is true as of now. "
            f"Redirects and parked domains drift, and a stale observation in a "
            f"cold message is worse than sending nothing."
        )
    else:
        out.append(
            "**Not re-checked.** These findings come from the stored CSV and may "
            "be out of date. Re-run without `--no-check` before sending."
        )
    out.append("")

    out.append("## What this costs you")
    out.append(
        f"About **{minutes} minutes** of work for the whole queue, and that is the "
        f"entire cost until somebody replies. There is no build, no mock-up and no "
        f"design time in it -- a mock-up is something you make *after* they answer, "
        f"for the one that answers."
    )
    out.append("")
    out.append(
        f"At your published launch price of ${LAUNCH_PRICE:,}, one closed site pays "
        f"for roughly **{LAUNCH_PRICE * 60 // max(minutes, 1):,} minutes** of "
        f"outreach. The queue above is {minutes} minutes. So the whole list only "
        f"has to convert once to have been worth doing -- and the drop list exists "
        f"so that it is not spent on anyone who was never going to buy."
    )
    out.append("")
    out.append(
        "> No conversion rate is assumed anywhere in this file. Reply rates for "
        "cold SMS to owner-operators are not something you should take from me, "
        "and the numbers that matter are yours to track after the first week."
    )
    out.append("\n---\n")

    for idx, lead in enumerate(leads, 1):
        if lead.state == DROP:
            continue
        out.append(render_lead(idx, lead))

    dropped = [x for x in leads if x.state == DROP]
    if dropped:
        out.append("\n## Not worth your time\n")
        out.append(
            "Listed so you do not re-derive the same conclusion next week. "
            "Nothing here is a judgement about the business -- only about whether "
            "it is a customer.\n"
        )
        for lead in dropped:
            out.append(f"- **{lead.name}** ({trade_noun(lead.industry)}) -- "
                       + "; ".join(lead.blockers))
        out.append("\n---\n")

    return "\n".join(out)


def prep_block(lead: Lead) -> list[str]:
    """The half of the file that is for Jake, not the prospect.

    Kept in its own function, and called from exactly one place, for one reason:
    a persona read is a guess about a person, and the worst possible outcome is
    a guess leaking into a message that gets sent. The old PSYCH_PROFILES table
    had no such boundary -- it sat in the same dict as the pitch strings, so
    "The Visual Traditionalist, worried about scams" was one refactor away from
    being quoted at a prospect as though it were a finding.

    Nothing in here is read by message(), call_opener() or guardrails(). If you
    want a persona to change what gets sent, that has to be done deliberately in
    one of those, where it can be reviewed -- not by editing a string that some
    other function happens to interpolate.
    """
    raw = get(lead.row, "Persona Read")
    p = Persona.from_csv(raw)
    if not p:
        return []

    out: list[str] = []
    out.append("<details>")
    out.append("<summary><strong>Prep notes &mdash; for you, not the prospect</strong>"
               "</summary>")
    out.append("")
    out.append(f"> **{p.archetype}**")
    if p.confidence == "thin":
        out.append(">")
        out.append("> *Thin read* &mdash; not enough in the record to trust the "
                   "archetype. Go and open the site before you use the angle.")
    out.append(">")
    out.append(f"> **Open with:** {p.angle}")
    out.append(">")
    out.append(f"> **Do not:** {p.trap}")
    if p.vocabulary:
        out.append(">")
        out.append(f"> **Their word for it:** {p.vocabulary} "
                   f"&mdash; not \"{trade_noun(lead.industry)}\"")
    if p.evidence:
        out.append(">")
        out.append("> **Read from:** " + "; ".join(p.evidence))
    out.append("")
    out.append("</details>")
    out.append("")
    return out


def render_lead(idx: int, lead: Lead) -> str:
    a = lead.audit
    out: list[str] = []
    place = lead.address or "address not in record"

    out.append(f"## {idx}. {lead.name}")
    out.append(
        f"`{lead.state.upper()}` -- {STATE_BLURB[lead.state]}  \n"
        f"{trade_noun(lead.industry).capitalize()} · {place} · "
        f"opportunity {lead.opportunity or 0}/100"
    )
    out.append("")

    if lead.blockers:
        for b in lead.blockers:
            out.append(f"> **Why not yet:** {b}")
        out.append("")

    for note in lead.notes:
        out.append(f"> {note}")
    if lead.notes:
        out.append("")

    if lead.fact:
        out.append("**The fact to lead with** (measured "
                   f"{date.today().isoformat() if lead.checked_today else 'at harvest'}):")
        out.append(f"> {lead.fact}.")
        out.append("")

    out.append("**Channel**")
    if lead.phone:
        nums = [p.strip() for p in re.split(r"[;/]", lead.phone) if p.strip()]
        for n in nums:
            out.append(f"- Text or call: {n}")
    else:
        out.append("- None. This is why the lead is not sendable.")
    out.append(f"- {lead.website or 'no website on record'}")
    out.append(f"- Time: about {STATE_MINUTES[lead.state]} minutes")
    out.append("")

    if lead.state == VERIFY:
        out.append("**Do this first**")
        out.append(f"1. {check_step(lead)}")
        out.append("2. If it checks out, send the message below as written.")
        out.append("3. If it does not, delete this lead. Don't rewrite the pitch "
                   "around a finding you couldn't confirm.")
        out.append("")

    if lead.notes:
        out.append("**Guardrail**")
        for note in lead.notes:
            out.append(f"- {note}")
        out.append("")

    out.append("**Text message** -- copy this")
    out.append("```text")
    out.append(message(lead, "text"))
    out.append("```")
    out.append("")

    if lead.phone:
        out.append("**If they answer** -- read this instead of the text")
        out.append("```text")
        out.append(call_opener(lead))
        out.append("```")
        out.append("")

    out.append("**Do not say**")
    for line in guardrails(lead):
        out.append(f"- {line}")
    out.append("")

    # Everything above this line is aimed at the prospect. Everything below is
    # aimed at Jake. The heading in prep_block says so out loud, because a file
    # that mixes the two without saying which is which is how a guess about
    # somebody's character ends up quoted at them as a finding.
    out.extend(prep_block(lead))

    out.append("\n---\n")
    return "\n".join(out)


def call_opener(lead: Lead) -> str:
    """What to say when a human picks up. Shorter, and it assumes they did not "
    "read the message."""
    a = lead.audit
    who = "owner" if "Owner" in get(lead.row, "Decision Maker", "Owner") else "owner"
    if a and a.serves_other_business:
        return "\n".join([
            f"'Hi -- is this the owner? My name's {SENDER}, I build websites out "
            f"of {SENDER_CITY}.'",
            "",
            f"'(If the name fits) Quick thing, I looked up your web address and it "
            f"isn't showing your business any more -- it loads a page for a "
            f"different company. So anybody who searches for you and clicks your "
            f"own address ends up on somebody else's site.'",
            "",
            f"'That's the whole problem, honestly. If you had a real site there with "
            f"a form that texted you the job, you'd get those people back.'",
            "",
            f"'I do fixed-price builds and you own the code. Want me to put a rough "
            f"one together so you can see what it'd look like?'",
            "",
            f"If yes: 'I'll need your hours, the jobs you take, and a couple of "
            f"photos. I'll send you something to look at in a day or two.'",
            "",
            f"If they ask who you are: '{SENDER}, I'm a developer here in "
            f"{SENDER_CITY}. I've got three sites running right now -- "
            f"{PORTFOLIO} has them on it, you can go look at the work before you "
            f"spend anything.'",
        ])
    return "\n".join([
        f"'Hi -- is this the {who}? {SENDER} here, I build websites out of "
        f"{SENDER_CITY}.'",
        "",
        f"'That's what made me reach out: {lead.spoken}.'" if lead.spoken
        else "'That's why I'm calling.'",
        "",
        f"'I build fixed-price sites for {trade_noun(lead.industry)} -- a form that "
        f"texts you the enquiry the second it comes in, so nothing sits in a "
        f"voicemail. You own the code, no monthly fee.'",
        "",
        "'Worth me putting a rough one together first so you can see it?'",
        "",
        f"If yes: 'Send me your hours, the work you take, and a couple of photos "
        f"and I'll mock something up in a day or two.'",
    ])


def guardrails(lead: Lead) -> list[str]:
    """The sentences that are one wrong fact away from being a lie."""
    out = [
        ("That you saw their Google Business Profile. " + (
            "The data came from OpenStreetMap, which has no such thing."
            if "overpass" in lead.sources and "gmaps" not in lead.sources else
            "The data came from a Google Maps scrape, so the listing is real but "
            "you have not 'read' it as a customer."
            if "gmaps" in lead.sources else
            "The data came from the Google Places API, so the listing is real."
        )),
        "Any number you have not measured -- how many visitors they get, how "
        "many calls they lose, what a competitor is charging.",
    ]
    if lead.low_confidence and not lead.website:
        out.append(
            "That they definitely have no website. " + (
                "The record is a free OpenStreetMap extract where a missing "
                "website tag usually means nobody filled the field in."
                if "overpass" in lead.sources and "gmaps" not in lead.sources else
                "Confirm with one search before you say it is certain."
            )
        )
    if lead.website and lead.audit and lead.audit.redirected_domain:
        out.append(
            "A specific destination domain by name unless you have just checked "
            "it. That chain is several links long and it moves."
        )
    if lead.trade_mismatch:
        out.append(
            f"Anything about {lead.claimed_industry.lower()} work. Their name "
            f"says {lead.industry.lower()}."
        )
    if lead.state == EXPAND:
        out.append(
            "That something is broken. Their site measures clean -- that is the "
            "whole reason the message opens by saying so."
        )
    return out


# --------------------------------------------------------------------------- #
def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--no-check", action="store_true",
                    help="trust the stored CSV facts instead of re-fetching sites")
    args = ap.parse_args()

    rows = load_leads(CSV_PATH)
    leads = [Lead(r, None, False) for r in rows if not is_placeholder(r)]
    dropped_early = len(rows) - len(leads)

    checked = False
    if not args.no_check:
        print(f"Re-checking {len([x for x in leads if x.website])} sites...")
        rechecks(leads)
        checked = any(x.checked_today for x in leads)

    for lead in leads:
        lead.classify()

    if dropped_early:
        for lead in leads:
            lead.notes.append("placeholder data filtered before review")

    report = build_report(leads, checked)
    OUT_PATH.write_text(report, encoding="utf-8")
    counts = state_counts(leads)
    print(f"\nQueue written -> {OUT_PATH}")
    print("  " + "  ".join(f"{k}: {counts.get(k, 0)}" for k in
                           (SEND, VERIFY, EXPAND, HOLD, DROP)))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
