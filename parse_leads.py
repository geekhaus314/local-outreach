#!/usr/bin/env python3
"""Turn leads.csv (produced by run_scraper.py) into pitch dossiers.

Design rule for this file: every claim in a pitch must be a fact we actually
harvested or measured. The previous version opened plumbing leads with "A client
note recently said they spent 4 days trying to leave phone messages with no
callback" -- an invented customer complaint. That is the kind of detail a
prospect will cheerfully ask you to prove, and it burns the relationship on the
first reply. The same goes for seeding the database with 555-number fake
businesses, which made a run with no real data look like a working pipeline.

Run the scraper first:

    python3 run_scraper.py
    python3 parse_leads.py
"""

from __future__ import annotations

import csv
import re
import sys
from pathlib import Path

WS_RE = re.compile(r"\s+")

ROOT = Path(__file__).resolve().parent
CSV_PATH = ROOT / "leads.csv"
OUT_PATH = ROOT / "leads_dashboard.md"

REQUIRED_COLUMNS = {"Business Name", "Industry", "Website", "Traffic Tier"}

# Skip anything that is not a real prospect: chains, directories, and businesses
# whose site is already fine.
SKIP_CLASSES = {"HAS_DECENT_SITE"}

# Psychological Profiling Matrix for Blue-Collar Owners
PSYCH_PROFILES = {
    "Plumbing": {
        "archetype": "The Burning Firefighter (Overwhelmed Operations)",
        "personality": "High-stress, highly reactive, non-technical, pragmatic. Dislikes tech jargon, loves immediate operational fixes.",
        "leverage": "Focus entirely on missed revenue from unreturned calls. Keep text lines open, simple booking mechanics.",
        "trap_to_avoid": "Do not explain frameworks, APIs, or hosting configurations. Speak purely in terms of jobs saved.",
        "pain_word": "jobs",
    },
    "Roofing": {
        "archetype": "The Visual Traditionalist (Proof & Trust Dependent)",
        "personality": "Skeptical, proud of craftsmanship, operates via word-of-mouth. Worried about scams and digital overhead.",
        "leverage": r"Focus on high-ticket visual proof. They lose \$10k+ roof replacements if a cautious homeowner can't see dynamic 'before/after' photos.",
        "trap_to_avoid": "Do not pitch monthly subscriptions or retention fees. Offer a clean, flat-rate portfolio asset they completely own.",
        "pain_word": "roof jobs",
    },
    "Automotive": {
        "archetype": "The Efficiency Optimizer (Margin & Logistics Focused)",
        "personality": "Process-driven, protective of operational hours, cautious of digital friction taking time away from the bay.",
        "leverage": "Expose their unique competitive advantage (e.g., evening hours, bike + car dual diagnostics) hidden from standard searches.",
        "trap_to_avoid": "Do not break down complex UI design. Focus on minimizing diagnostic booking phone time for mechanics.",
        "pain_word": "service bays",
    },
}
DEFAULT_PROFILE = {
    "archetype": "The Pragmatic Operator (Time & Margin Focused)",
    "personality": "Busy, non-technical, protective of operating hours. Sceptical of digital overhead and recurring fees.",
    "leverage": "Lead with missed calls and enquiries, not technology. Concrete before/after beats adjectives.",
    "trap_to_avoid": "No jargon, no subscriptions, no retainer language. Speak in booked work.",
    "pain_word": "jobs",
}


def profile_for(industry: str) -> dict:
    return PSYCH_PROFILES.get(industry, DEFAULT_PROFILE)


# --------------------------------------------------------------------------- #
# Evidence
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
# Friction
# --------------------------------------------------------------------------- #
CLASS_FRICTION = {
    "NO_PRESENCE": (10, "CRITICAL: ZERO DIGITAL FOOTPRINT"),
    "DEAD_SITE": (10, "CRITICAL: LISTED SITE IS DEAD OR PARKED"),
    "SOCIAL_ONLY": (9, "CRITICAL: SOCIAL PAGE IS THE ONLY PRESENCE"),
    "MARKETPLACE_ONLY": (8, "HIGH: DIRECTORY LISTING, NOT AN OWNED SITE"),
    "NEEDS_REHAB": (7, "HIGH: LIVE BUT UNDERPOWERED SITE"),
    "HAS_DECENT_SITE": (2, "LOW: SITE IS FINE"),
}


def friction_index(row: dict) -> tuple[int, str]:
    cls = get(row, "Classification")
    if cls in CLASS_FRICTION:
        return CLASS_FRICTION[cls]
    tier = get(row, "Traffic Tier")
    if tier in ("None", ""):
        return 10, "CRITICAL: ZERO DIGITAL FOOTPRINT"
    if tier == "Dead":
        return 10, "CRITICAL: LISTED SITE IS DEAD OR PARKED"
    if tier == "Minimal":
        return 7, "HIGH: LIVE BUT UNDERPOWERED SITE"
    return 2, "LOW: SITE IS ACTIVE"


# --------------------------------------------------------------------------- #
# Pitch
# --------------------------------------------------------------------------- #
def reputation_line(row: dict) -> str:
    rating, reviews = as_float(row, "Rating"), as_int(row, "Review Count")
    if rating is None or not reviews:
        return ""
    if rating >= 4.8 and reviews >= 100:
        return f"a {rating:.1f}-star rating across {reviews} reviews"
    if rating >= 4.5:
        return f"a {rating:.1f}-star rating across {reviews} reviews"
    return f"a {rating:.1f}-star rating from {reviews} reviews"


# Words that, when a standalone finding is spliced into a sentence, need
# lowercasing. Anything else is assumed to be a proper noun and left alone.
_FUNCTION_WORDS = {
    "there's", "there", "your", "the", "a", "an", "it", "no", "not",
    "every", "anyone", "people", "visitors", "most", "nobody",
}


def _lower_first(text: str) -> str:
    """Lowercase a leading function word, e.g. 'There's no form' -> 'there's no form'."""
    if not text:
        return text
    first, _, rest = text.partition(" ")
    if first.lower() in _FUNCTION_WORDS and first[:1].isupper():
        return first.lower() + _ + rest
    return text


def _clean_fact(text: str) -> str:
    """Make a fact quotable inside a sentence.

    Findings are written as standalone quotes and may end in a period or use an
    em-dash aside. Splicing those straight into a sentence produces things like
    "no obvious way to reach you., and that's costing you calls".
    """
    out = WS_RE.sub(" ", text).strip()
    out = out.rstrip(" .;,")
    out = out.replace(" -- ", ", ")
    return out


def opening_problem(row: dict, name: str) -> str:
    """One or two sentences built only from measured facts."""
    facts = [_clean_fact(f) for f in split_facts(row)]
    cls = get(row, "Classification")

    if cls == "NO_PRESENCE":
        base = (
            "I pulled up your listing and there's no website attached to it at all "
            "-- so when someone searches for what you do, all they get is a map pin."
        )
    elif cls == "DEAD_SITE":
        base = facts[0] + "." if facts else "The website listed for you doesn't load."
    elif cls == "SOCIAL_ONLY":
        base = facts[0] + "." if facts else "Your only web presence is a social media page."
    elif cls == "MARKETPLACE_ONLY":
        base = facts[0] + "." if facts else "Your 'website' is a third-party directory listing."
    elif cls == "NEEDS_REHAB":
        detail = _lower_first(facts[0]) if facts else "it has real problems"
        base = (
            "I actually loaded your site. It's live, so you've probably got a "
            f"mental note that you're online -- but {detail}, and that's costing "
            "you calls."
        )
    else:
        base = "I took a look at your current setup."

    rep = reputation_line(row)
    if rep and cls != "HAS_DECENT_SITE":
        base += (
            f" You've got {rep}, which tells me the work is good and the online "
            "side is what's lagging."
        )
    return base


def generate_pitch(row: dict) -> str:
    name = get(row, "Business Name", "there")
    industry = get(row, "Industry", "General")
    prof = profile_for(industry)
    facts = split_facts(row)
    website = get(row, "Website")

    opener = opening_problem(row, name)

    if industry == "Plumbing":
        value = (
            "I build fast, single-page sites for plumbers with a real request form "
            "that texts you the job the second it comes in, so nothing sits in a "
            "voicemail while you're under a sink. Flat price, you own it, no "
            "subscription."
        )
    elif industry == "Roofing":
        value = (
            "I build fast, mobile-first sites for roofers where you can push "
            "before/after photos straight from your phone, so the cautious "
            "homeowner sees proof instead of bouncing. Flat price, you own it "
            "completely, no monthly fee."
        )
    elif industry == "Automotive":
        value = (
            "I build mobile-first sites for independent auto shops that let people "
            "request a diagnostic slot instead of holding for the phone, and put "
            "your real differentiators in front of them instead of burying them in "
            "map metadata."
        )
    else:
        value = (
            "I build fast, mobile-first sites for local businesses with a simple "
            "form that sends you the enquiry by text right away. Flat price, you "
            "own it, no subscription."
        )

    evidence = ""
    if facts:
        # The opener already states the headline problem in plain language.
        # Repeating it verbatim in the evidence list reads like padding, so
        # drop any fact covering the same topic. Compared on topic keywords
        # rather than full phrases: the opener and the finding are worded
        # differently ("no website attached to it" vs "No website is
        # attached to their listing") but mean the same thing.
        opener_low = opener.lower()
        topics = ("no website", "parked placeholder", "does not load",
                  "redirects to", "returns http")
        kept: list[str] = []
        for fact in facts:
            fact_low = fact.lower()
            if any(topic in fact_low and topic in opener_low for topic in topics):
                continue
            kept.append(fact)
        if kept:
            bullets = "\n".join(f"  - {f}" for f in kept[:4])
            evidence = f"\n\nWhat I actually found:\n{bullets}"

    site_line = ""
    if website and get(row, "Classification") not in ("NO_PRESENCE",):
        site_line = f" ({website})"

    return (
        f"Hey {name} team{site_line},\n\n"
        f"I'm Jake, a developer in Florissant. {opener}{evidence}\n\n"
        f"{value}\n\n"
        f"Open to a 5-minute look at a rough layout for you? I can mock one up "
        f"before you commit to anything.\n\n"
        f"-- Jake"
    )


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
        header = reader.fieldnames or []
        missing = REQUIRED_COLUMNS - set(header)
        if missing:
            print(
                f"error: {path.name} is missing columns: {sorted(missing)}\n"
                f"       This file was not produced by run_scraper.py. Re-run it:\n"
                f"         python3 run_scraper.py",
                file=sys.stderr,
            )
            raise SystemExit(2)
        return list(reader)


def build_report(rows: list[dict]) -> str:
    kept = [
        r for r in rows
        if get(r, "Classification") not in SKIP_CLASSES
        and as_int(r, "Opportunity Score") is not None
        and not is_placeholder(r)
    ]
    kept.sort(key=lambda r: -(as_int(r, "Opportunity Score") or 0))
    skipped_clean = sum(1 for r in rows if get(r, "Classification") in SKIP_CLASSES)
    skipped_fake = sum(1 for r in rows if is_placeholder(r))

    out: list[str] = []
    out.append("# HIGH-CONVERSION TARGET REPORT: UNREACHED LOCAL MARKETS\n")
    out.append(
        f"**Total Opportunities Analyzed:** {len(kept)} | "
        f"**Skipped (healthy site):** {skipped_clean} | "
        f"**Skipped (placeholder data):** {skipped_fake}\n"
    )
    out.append(
        "Every claim below comes from the harvested record or from a live audit of "
        "the business's own website. Nothing is inferred.\n"
    )
    out.append("---\n")

    for idx, lead in enumerate(kept, 1):
        name = get(lead, "Business Name", "UNKNOWN")
        industry = get(lead, "Industry", "General")
        prof = profile_for(industry)
        score, label = friction_index(lead)
        opp = as_int(lead, "Opportunity Score")
        health = as_int(lead, "Site Health")
        cls = get(lead, "Classification")

        out.append(f"## [{idx}] {name.upper()}")
        out.append(f"**{cls} | Opportunity {opp}/100 | {industry}**\n")

        out.append("### Measured State")
        out.append(f"*   **Friction Score:** {score}/10 -> **{label}**")
        out.append(f"*   **Listed Site:** `{get(lead, 'Website') or 'NONE'}`")
        out.append(f"*   **Audit Result:** {get(lead, 'Audit Summary') or 'n/a'}")
        if health is not None:
            out.append(f"*   **Site Health:** {health}/100")
        rating, reviews = as_float(lead, "Rating"), as_int(lead, "Review Count")
        if rating is not None and reviews:
            out.append(f"*   **Reputation:** {rating:.1f} stars / {reviews} reviews")
        out.append(f"*   **Traffic Tier:** `{get(lead, 'Traffic Tier') or 'n/a'}`")
        if get(lead, "Low Confidence") == "yes":
            out.append(
                "*   **Data Quality:** low confidence (free OSM source, verify before "
                "contacting -- the 'no website' tag may simply be unmapped)"
            )
        out.append("")

        out.append("### Verified Evidence")
        facts = split_facts(lead)
        if facts:
            for f in facts:
                out.append(f"*   {f}")
        else:
            out.append("*   No specific findings recorded.")
        out.append("")

        out.append("### Target Contact")
        out.append(f"*   **Role to ask for:** {get(lead, 'Decision Maker') or 'Owner/Operator'}")
        out.append(f"*   **Phone:** {get(lead, 'Phone') or 'NOT AVAILABLE'}")
        out.append(f"*   **Address:** {get(lead, 'Address') or 'n/a'}")
        maps = get(lead, "Maps URL")
        if maps:
            out.append(f"*   **Maps:** {maps}")
        out.append("")

        out.append("### Psychological Read")
        out.append(f"*   **Archetype:** {prof['archetype']}")
        out.append(f"*   **Mindset:** {prof['personality']}")
        out.append(f"*   **Highest Leverage Hook:** *\"{prof['leverage']}\"*")
        out.append(f"*   **Fatal Closing Traps:** *{prof['trap_to_avoid']}*\n")

        out.append("### Pitch Draft")
        out.append("```text")
        out.append(generate_pitch(lead))
        out.append("```\n")
        out.append("---\n")

    if not kept:
        out.append(
            "_No actionable leads. If you only ran the free OpenStreetMap "
            "fallback, that is expected: set GOOGLE_PLACES_API_KEY in `.env` and "
            "re-run._\n"
        )
    return "\n".join(out)


def main() -> int:
    rows = load_leads(CSV_PATH)
    report = build_report(rows)
    OUT_PATH.write_text(report, encoding="utf-8")
    count = report.count("## [")
    print(f"Report written -> {OUT_PATH} ({count} dossiers)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
