"""Persona derivation -- reading who you are actually talking to.

Why this exists
---------------
The version of `parse_leads.py` that this replaces carried `PSYCH_PROFILES`:
a dict keyed on industry, mapping `Plumbing` to a fixed archetype, a fixed
`leverage` line, and a fixed `trap_to_avoid`. The instinct behind it was right
and the implementation was wrong twice over.

Wrong once because a lookup on `Industry` cannot tell you anything about *this*
business. A 4.9-star roofer with 300 reviews and one with 6 are both
`Roofing`, and they want opposite pitches. The field exists because the provider
guessed it, not because anybody measured it.

Wrong twice because it was unfalsifiable. Nothing in the table recorded where
any of it came from, so "The Visual Traditionalist, proud of craftsmanship,
worried about scams" was as available for a lead with no website and no reviews
as for one with a portfolio of before-and-after shots. It read like knowledge
and functioned as decoration.

So this derives instead of looking up, and every claim carries the signal that
produced it. A persona read with no evidence trail is the same failure as a
fabricated statistic, just aimed at you rather than at the prospect -- which is
worse, because you are the one who has to act on it.

What it can and cannot see
--------------------------
It reads only what the harvest already measured: reputation, site maturity,
the classification, and the business's own words off their own site. It does not
read reviews, because `reviews_summary()` is not wired into the pipeline and
until it is, a "customers complain they cannot find you" persona would be
invented rather than observed. It does not infer personality from a name, and it
does not guess intent.

Everything it produces is a *prior to check*, not a conclusion. The output is a
label and an angle, and the honest use is "open with the proof angle, because
they are established and sceptical" -- not "this man is a Visual Traditionalist".
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field

# --------------------------------------------------------------------------- #
# Signal vocabulary
# --------------------------------------------------------------------------- #
# Only language that a tradesperson's own site actually uses. Each pattern is
# deliberately narrow: "we" on its own is not a signal, "family owned" is.

URGENCY = re.compile(
    r"\b(24\s*/\s*7|24hr|24-7|emergency|urgent|right now|call now|fast response)\b", re.I
)
# Trade-standard credibility claims. Their presence means the owner already
# thinks in terms of being licensed and vetted, and pitch accordingly.
CREDENTIAL = re.compile(
    r"\b(licensed|insured|bonded|certified|accredited|guarantee[ds]?|warranty|"
    r"family[- ]owned|since \d{4}|years of experience|established)\b",
    re.I,
)
# Price-forward language. An owner advertising numbers is running on margin and
# will ask what this costs in the first ten seconds.
PRICING = re.compile(
    r"(\$\s?\d|\bfrom \$\d|\bstarting (?:at|from) \$|\bfree estimate|"
    r"\bcall for (?:a )?(?:price|quote)|\bno obligation)",
    re.I,
)
# First-person plural, and a personal name. Distinguishes a crew from a sole
# trader, which changes who you are actually asking for a decision.
WE_VOICE = re.compile(r"\b(we|our|us)\b", re.I)
SOLE_TRADER = re.compile(r"\b(my|me|I)\b", re.I)
# Discounting or urgency-ticket language. An owner running a sale is usually
# reacting to a slow month, which is a conversation, not a website.
DISCOUNTING = re.compile(
    r"(\b\d{1,2}%\s*off|\bfree (?:consultation|estimate|quote)|\bsale\b|"
    r"\blimited time\b|\bcall now to save\b)",
    re.I,
)
HYPE = re.compile(r"(!!!|\bBEST\b|\b#1\b|\bGUARANTEED\b|\bCHEAPEST\b)", re.I)


# --------------------------------------------------------------------------- #
# The read
# --------------------------------------------------------------------------- #
@dataclass
class Persona:
    """A per-lead read, with the evidence that produced it.

    `evidence` is not decoration. It is the difference between a prior you can
    check and a stereotype you have to believe: if the archetype says
    "established and price-cautious", `evidence` should let you see it was 4.8
    stars over 240 reviews plus a "call for a quote" on their own homepage.
    """

    archetype: str
    # The opening move. What to lead with, and why that and not the obvious
    # thing. Usually the opposite of what the archetype predicts.
    angle: str
    # What would land wrong. The single most likely way to talk past them.
    trap: str
    # Their word for a job, if their own site used one we recognised.
    vocabulary: str = ""
    # Every input that produced the above, as short readable facts.
    evidence: list[str] = field(default_factory=list)
    # How much of this is guesswork. "thin" means go and look, not "act on it".
    confidence: str = "good"

    def to_dict(self) -> dict:
        return {
            "archetype": self.archetype,
            "angle": self.angle,
            "trap": self.trap,
            "vocabulary": self.vocabulary,
            "evidence": self.evidence,
            "confidence": self.confidence,
        }

    def to_csv(self) -> str:
        """Flat, single-cell form for leads.csv.

        `|` is the separator already used by Pitch Facts, and the semicolons
        inside the angle keep the four fields distinguishable once a spreadsheet
        has flattened the row.
        """
        return (
            f"{self.archetype} | {self.angle} | {self.trap} | "
            f"vocabulary: {self.vocabulary or 'unclear'} | "
            f"evidence: {'; '.join(self.evidence) or 'none'} | "
            f"confidence: {self.confidence}"
        )

    @staticmethod
    def from_csv(raw: str) -> "Persona | None":
        if not raw:
            return None
        parts = [p.strip() for p in raw.split("|")]
        if len(parts) < 3:
            return None
        vocab, evidence = "", []
        for extra in parts[3:]:
            if extra.startswith("vocabulary:"):
                vocab = extra.split(":", 1)[1].strip()
            elif extra.startswith("evidence:"):
                evidence = [
                    e.strip() for e in extra.split(":", 1)[1].split(";") if e.strip()
                ]
            elif extra.startswith("confidence:"):
                pass
        confidence = "good"
        for extra in parts[3:]:
            if extra.startswith("confidence:"):
                confidence = extra.split(":", 1)[1].strip()
        return Persona(parts[0], parts[1], parts[2], vocab, evidence, confidence)


# --------------------------------------------------------------------------- #
# Derivation
# --------------------------------------------------------------------------- #
# Reputation bands, from the two fields the sources actually give us. The point
# of the split is that a well-reviewed business and an unreviewed one want
# opposite things: the first wants to be shown it is being taken seriously, the
# second is cheaper to win and will say yes faster.
ESTABLISHED_RATING = 4.5
ESTABLISHED_REVIEWS = 50
THIN_REVIEWS = 10


def _site_voice(audit) -> str:
    """The business's own words, if we have them."""
    if not audit:
        return ""
    return " ".join(
        str(v)
        for v in (
            getattr(audit, "title", "") or "",
            (audit.evidence or {}).get("body_text", "") or "",
        )
    )


def read_persona(lead, audit=None) -> Persona:
    """Derive a persona for one lead. `lead` is a ScoredLead, `audit` an
    AuditResult or None. Never raises -- a persona is advisory, and an advisory
    layer is not a reason to lose a lead."""
    try:
        return _read(lead, audit)
    except Exception:  # pragma: no cover - defensive; see docstring
        return Persona(
            archetype="Unread",
            angle="Go and look at the site before you pitch this one.",
            trap="Anything templated -- you have no read on them at all.",
            confidence="none",
        )


def _read(lead, audit) -> Persona:
    ev: list[str] = []
    voice = _site_voice(audit)
    classification = lead.classification

    # ---- reputation ------------------------------------------------------- #
    rating, reviews = lead.rating, lead.review_count
    established = bool(
        rating is not None and reviews is not None
        and rating >= ESTABLISHED_RATING and reviews >= ESTABLISHED_REVIEWS
    )
    thin = reviews is not None and reviews < THIN_REVIEWS

    if rating is not None:
        ev.append(f"{rating:.1f} stars")
    if reviews is not None:
        ev.append(f"{reviews} reviews")
    if lead.low_confidence:
        ev.append("low-confidence source record; verify before sending")
    # site_health is a field on the lead, not a property of the audit object, so
    # it is emitted whether or not the audit is still in hand. Gating it on
    # `if audit:` dropped the single most useful number whenever the caller had
    # only the CSV.
    if lead.site_health is not None:
        ev.append(f"site health {lead.site_health}/100")

    # ---- digital state ---------------------------------------------------- #
    # The single hardest fact about how to open: is there anything there at all?
    if classification == "NO_PRESENCE":
        ev.append("no website on the record")
    elif classification == "DEAD_SITE":
        ev.append("listed site is dead, parked, or serving another business")
    elif classification == "SOCIAL_ONLY":
        ev.append("a social page is the whole online presence")
    elif classification == "MARKETPLACE":
        ev.append("a directory listing rather than a site they own")
    elif classification == "NEEDS_REHAB":
        ev.append("live site that measures as underpowered")

    # ---- how they talk about themselves ----------------------------------- #
    if URGENCY.search(voice):
        ev.append("their site leads on urgency")
    if CREDENTIAL.search(voice):
        ev.append("their site leads on credentials")
    if PRICING.search(voice):
        ev.append("their site advertises price")
    if DISCOUNTING.search(voice):
        ev.append("their site is running a discount")
    if HYPE.search(voice):
        ev.append("their site shouts in caps")
    if voice and SOLE_TRADER.search(voice) and not WE_VOICE.search(voice):
        ev.append("writes as a one-person business")
    elif voice and WE_VOICE.search(voice):
        ev.append("writes as a crew")

    confidence = "good"
    if lead.low_confidence or not voice:
        confidence = "thin"

    # ---- the read --------------------------------------------------------- #
    archetype, angle, trap = _archetype(
        established=established, thin=thin, classification=classification,
        voice=voice, rating=rating, reviews=reviews, audit=audit,
    )

    return Persona(
        archetype=archetype, angle=angle, trap=trap,
        vocabulary=_vocabulary(voice, lead.industry), evidence=ev, confidence=confidence,
    )


def _archetype(*, established, thin, classification, voice, rating, reviews, audit):
    """Pick the read, and state the opening move that goes with it.

    The angle is deliberately *not* the most obvious pitch for the archetype. A
    sceptical established roofer does not want to be told their site is
    embarrassing -- they know, they have made peace with it, and being told is
    an accusation. What they want is to be shown that the person raising it has
    looked at something specific. That inversion is the whole point of the
    angle field, and it is why this is not a lookup table.
    """
    has_site = classification in ("HAS_SITE", "NEEDS_REHAB", "MARKETPLACE")

    # 1. Nothing there at all. The pitch is not a website, it is presence.
    if classification in ("NO_PRESENCE", "SOCIAL_ONLY"):
        return (
            "Unclaimed online -- nobody is looking at them yet",
            "Do not open with the website. Open with the one customer in the "
            "last week who searched for their trade and did not find them. The "
            "site is the symptom; being unfindable is the problem.",
            "Do not imply they had a site and lost it. If the record came "
            "from a free extract a missing website may just mean the field "
            "was blank -- and they will correct you.",
        )

    # 2. Their domain is broken. The pitch is the strongest thing you have.
    if classification == "DEAD_SITE":
        return (
            "Broken in a way they probably do not know about",
            "Lead with the specific evidence -- the redirect, the parked page, "
            "the other business's blog on their address. This is the only case "
            "where you open with the defect, because the defect is the whole "
            "reason to call and they cannot have already been told.",
            "Do not soften it into 'could be improved'. A domain serving another "
            "company is not a preference, and vagueness reads as a sales call.",
        )

    # 3. Established, well-reviewed, and has a site. Hardest to move.
    if established and has_site:
        return (
            "Established and protective of a reputation they earned",
            "Do not tell them their site is bad -- they are 4.8 stars and they "
            "know exactly how good they are, and being told their web presence "
            "is a problem reads as an insult. Open with what you measured that "
            "is costing them enquiries, and ask which of their customers found "
            "them last. Make them the expert.",
            "No jargon, no 'optimisation', no upsell. They have been sold a "
            "website before and can tell. A flat price and 'you own it' is the "
            "only thing that reads as honest here.",
        )

    # 4. Barely reviewed. Cheapest to win, and most price-sensitive.
    if thin:
        return (
            "Thin on reputation, which cuts both ways",
            "Ask what happened when the last customer tried to look them up. "
            "With almost no reviews there is usually no site either, and no "
            "word of mouth beyond a few blocks -- so the honest pitch is the "
            "cheapest possible first step, not a full build.",
            "Do not imply they are struggling. 'Only from people who already "
            "know me' is a strategy, not a failing, and a new business is a "
            "faster yes than an established one.",
        )

    # 5. Live site, middling everything. The ordinary case.
    if classification in ("NEEDS_REHAB", "MARKETPLACE", "HAS_SITE"):
        return (
            "Working, and quietly leaving enquiries on the table",
            "Their site is not the problem and saying so is what buys you the "
            "rest of the conversation. Ask what they would like the site to do "
            "that it does not do now, then quote the gap.",
            "Do not list defects they did not ask about. Nobody wants a "
            "performance review of a site they were fine with, and a long list "
            "reads as an upsell attempt.",
        )

    # 6. Nothing measured.
    return (
        "Not enough data to read",
        "Go and open the site in a browser before you write a word. Every "
        "other archetype here is a prior, and this one is genuinely unknown.",
        "Anything templated. A generic pitch to a business you have not looked "
        "at is the one that gets you deleted.",
    )


# --------------------------------------------------------------------------- #
# Their word for a job
# --------------------------------------------------------------------------- #
# The old pain_word table hardcoded it: "jobs", "roof jobs", "service bays". The
# better version is to read it off their own site, because that is the word
# they use in conversation, and falling back to a guess is better than nothing.
JOB_WORDS = [
    (re.compile(r"\b(plumbing|plumber|plumbers|drain|pipe|rooter|water heater)\b", re.I), "plumbing job"),
    (re.compile(r"\b(roof|roofing|roofer|shingle|gutter|siding)\b", re.I), "roof job"),
    (re.compile(r"\b(hvac|furnace|boiler|heat(?:ing|er)?|cool(?:ing|er)?|air cond)\b", re.I), "HVAC call"),
    (re.compile(r"\b(electric|electrical|electrician|panel|rewire|outlet)\b", re.I), "electrical job"),
    (re.compile(r"\b(paint|painting|painter|decor|plaster)\b", re.I), "painting job"),
    (re.compile(r"\b(tree|lawn|landscap|garden|irrigation|hedge|mulch)\b", re.I), "landscaping job"),
    (re.compile(r"\b(concrete|driveway|slab|foundation|patio|patio)\b", re.I), "concrete job"),
    (re.compile(r"\b(auto|mechanic|brake|tire|transmission|oil change)\b", re.I), "service appointment"),
    (re.compile(r"\b(photo|photograph|portrait|wedding|shoot)\b", re.I), "shoot"),
]


def _vocabulary(voice: str, declared: str = "") -> str:
    """The word this business uses for the work, or '' when we could not tell.

    First match wins is the wrong rule here, and it was the first rule. The
    patterns are scanned in a fixed order over a concatenated title + body, so
    the answer was decided by the order of this list rather than by the evidence
    -- a plumber whose site mentioned "gutter" once came back as a roofer,
    because the roofing pattern is listed second and something earlier matched
    their name.

    So count them instead. The winner has to be the clear one, and a tie or a
    near-tie returns nothing, because "we could not tell which trade this is"
    is a more useful answer to hand a salesperson than a confident wrong one.
    """
    voice = voice or ""
    if not voice:
        return ""

    counts = {
        word: len(pattern.findall(voice))
        for pattern, word in JOB_WORDS
        if pattern.search(voice)
    }
    if not counts:
        return ""

    ranked = sorted(counts.items(), key=lambda kv: kv[1], reverse=True)
    top_word, top_count = ranked[0]

    if len(ranked) > 1 and ranked[1][1] >= top_count:
        return ""  # genuinely ambiguous -- two trades at equal strength

    # The provider's own industry label is corroboration, not proof. It only
    # breaks a near-tie, because parse_leads.py already distrusts that field:
    # OpenStreetMap tagged a portrait photography studio as craft=painter, and
    # the record is a free extract either way.
    if declared and len(ranked) > 1 and ranked[1][1] == top_count - 1:
        for word, count in ranked:
            if count == top_count:
                top_word = word
                break
    return top_word
