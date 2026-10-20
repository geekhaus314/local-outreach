"""Turn raw leads + site audits into a ranked outreach pipeline.

The core thesis: the best prospect is a business with a *strong reputation and a
weak web presence*. High ratings and lots of reviews prove two things at once --
they can afford a website, and they are currently losing jobs to competitors who
show up in search. A brand new listing with four reviews cannot pay you. A
business with a healthy site does not need you.
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field, asdict

from .audit import AuditResult, is_social_or_marketplace
from .config import DECISION_MAKER_BY_INDUSTRY
from .http_client import normalize_url, registrable_domain
from .providers.base import RawLead

# Classification buckets
NO_PRESENCE = "NO_PRESENCE"
SOCIAL_ONLY = "SOCIAL_ONLY"
DEAD_SITE = "DEAD_SITE"
NEEDS_REHAB = "NEEDS_REHAB"
MARKETPLACE = "MARKETPLACE_ONLY"
HAS_SITE = "HAS_DECENT_SITE"

# Rough annual-ticket ordering, used to weight how much a website matters.
INDUSTRY_TICKET = {
    "Roofing": 100, "HVAC": 95, "Solar": 95, "Concrete": 92, "Plumbing": 90,
    "Electrical": 88, "Windows": 85, "Restoration": 85, "Flooring": 82,
    "Automotive": 78, "Pool": 78, "Real Estate": 80, "Moving": 70,
    "Landscaping": 68, "Pest Control": 68, "Painting": 70, "Locksmith": 65,
    "Cleaning": 60, "Appliance": 60, "Storage": 60, "Professional Services": 72,
    "Veterinary": 75, "Dental": 78, "Chiropractic": 70, "Healthcare": 70,
    "Restaurant": 60, "Fitness": 62, "Personal Care": 58, "Retail": 55,
    "General": 55, "Emergency Services": 68,
}

MARKETPLACE_NOTE = "listed on a directory, not their own domain"

# Online presence urgency rank (lower = customers search for them online more).
# A plumber's phone rings off "plumber near me"; a walk-in boutique less so.
INDUSTRY_ONLINE_URGENCY = {
    "Plumbing": 0, "HVAC": 0, "Automotive": 0, "Roofing": 1, "Electrical": 1,
    "Locksmith": 1, "Appliance": 1, "Pest Control": 2, "Dental": 2,
    "Veterinary": 2, "Chiropractic": 2, "Healthcare": 2, "Landscaping": 2,
    "Concrete": 2, "Windows": 3, "Flooring": 3, "Painting": 3, "Moving": 3,
    "Pool": 3, "Cleaning": 3, "Solar": 3, "Real Estate": 3, "Storage": 4,
    "Fitness": 4, "Professional Services": 4, "Personal Care": 4, "Retail": 5,
    "Restaurant": 5, "General": 6,
}


def lead_sort_key(classification: str, industry: str, opportunity: float):
    """Crappy site first within dire industries; no-site leads after those."""
    urgency = INDUSTRY_ONLINE_URGENCY.get(industry, 6)
    has_site_buckets = {DEAD_SITE, SOCIAL_ONLY, MARKETPLACE, NEEDS_REHAB}
    bucket_rank = 0 if classification in has_site_buckets else (1 if classification == NO_PRESENCE else 2)
    return (urgency, bucket_rank, -opportunity)


@dataclass
class ScoredLead:
    name: str
    industry: str
    phone: str
    address: str
    website: str
    email: str
    traffic_tier: str
    decision_maker: str
    classification: str
    opportunity: int
    need_score: int
    value_score: int
    site_health: int | None
    rating: float | None
    review_count: int | None
    audit_summary: str
    pitch_facts: list[str] = field(default_factory=list)
    sources: list[str] = field(default_factory=list)
    source_ids: str = ""
    low_confidence: bool = False
    maps_url: str = ""
    last_audited: str = ""
    # Internal-only. A read on who this business is and how to open with them,
    # derived in scraper/persona.py. Never rendered into prospect-facing copy --
    # see parse_leads.py, which prints it under an explicit "not the prospect"
    # heading and keeps it out of message() by construction.
    persona: str = ""

    def to_dict(self) -> dict:
        return asdict(self)

    def to_csv_row(self) -> list:
        return [
            self.name, self.industry, self.phone, self.email, self.address,
            self.website, self.traffic_tier, self.decision_maker,
            self.classification,
            self.opportunity, self.need_score, self.value_score,
            "" if self.site_health is None else self.site_health,
            "" if self.rating is None else f"{self.rating:.1f}",
            "" if self.review_count is None else self.review_count,
            self.audit_summary, " | ".join(self.pitch_facts),
            ",".join(self.sources), self.source_ids,
            "yes" if self.low_confidence else "no", self.maps_url,
            self.persona,
        ]


CSV_HEADER = [
    "Business Name", "Industry", "Phone", "Email", "Address", "Website",
    "Traffic Tier",
    "Decision Maker", "Classification", "Opportunity Score", "Need Score",
    "Value Score", "Site Health", "Rating", "Review Count", "Audit Summary",
    "Pitch Facts", "Sources", "Source IDs", "Low Confidence", "Maps URL",
    "Persona Read",
]

# Marketplaces/directories: a listing exists, a website does not.
MARKETPLACE_HOSTS = (
    "yelp.com", "nextdoor.com", "angi.com", "houzz.com", "bbb.org",
    "thumbtack.com", "yellowpages.com", "mapquest.com", "superpages.com",
    "bbb.org", "patch.com", "expertise.com", "manta.com", "chamberofcommerce.com",
    "bizapedia.com", "dnb.com", "porch.com", "homeadvisor.com", "care.com",
    "wellnessliving.com", "classpass.com", "styleseat.com", "booksy.com",
    "vagaro.com", "mindbodyonline.com", "square.site", "wixsite.com",
    "godaddysites.com", "weebly.com", "business.site", "mylocal.business",
    "sites.google.com", "blogspot.com", "wordpress.com", "jimdosite.com",
    "webnode.page", "webs.com", "jimdofree.com", "tripod.com",
    "angieslist.com", "redfin.com", "zillow.com", "realtor.com", "trulia.com",
    "facebook.com", "instagram.com", "twitter.com", "x.com", "linktr.ee",
    "linkedin.com", "tiktok.com", "youtube.com", "wa.me", "whatsapp.com",
    "thumbtack.com", "wikipedia.org", "indeed.com", "yelp.co.uk",
)


def classify(raw: RawLead, audit: AuditResult | None) -> str:
    site = (raw.website or "").strip()

    if not site:
        return NO_PRESENCE

    host = (re.sub(r"^https?://", "", site).split("/")[0]).lower()

    if is_social_or_marketplace(site):
        if any(host == h or host.endswith("." + h)
               for h in ("facebook.com", "instagram.com", "tiktok.com",
                         "twitter.com", "x.com", "linktr.ee", "linkedin.com",
                         "youtube.com", "wa.me", "whatsapp.com")):
            return SOCIAL_ONLY
        return MARKETPLACE

    if audit is None:
        return NEEDS_REHAB

    if not audit.reachable:
        return DEAD_SITE
    if audit.is_parked:
        return DEAD_SITE
    # Their domain does not even point at their business any more. For outreach
    # this is the strongest possible version of "you have no site": they are
    # actively paying for a domain they do not use.
    if audit.redirected_domain:
        return DEAD_SITE
    # Same problem, harder to see: the domain still answers, still looks like a
    # real site, and belongs to a different company. Classifying it as a healthy
    # site was how a plumber with a hijacked web address ended up on the skip
    # list.
    if audit.serves_other_business:
        return DEAD_SITE
    if audit.needs_rehab:
        return NEEDS_REHAB
    return HAS_SITE


def need_score(raw: RawLead, audit: AuditResult | None, cls: str) -> int:
    """0-100. How badly does this business need a website?"""
    base = {
        NO_PRESENCE: 100,
        SOCIAL_ONLY: 82,
        MARKETPLACE: 74,
        DEAD_SITE: 95,
        NEEDS_REHAB: 60,
        HAS_SITE: 10,
    }.get(cls, 50)

    if audit is not None and cls in (NEEDS_REHAB, DEAD_SITE):
        # Fold in the concrete, checkable problems.
        base = int(base * 0.5 + (100 - audit.health) * 0.5)

    if audit is not None and audit.reachable and cls == HAS_SITE:
        base = max(0, 100 - audit.health)

    return max(0, min(100, base))


def value_score(raw: RawLead, cls: str) -> int:
    """0-100. How likely are they to actually pay for this?"""
    score = 30.0

    ticket = INDUSTRY_TICKET.get(raw.industry, 55)
    score = score * 0.4 + ticket * 0.6

    rating = raw.rating
    reviews = raw.review_count or 0

    if rating is not None and reviews:
        if rating >= 4.5 and reviews >= 100:
            score += 28          # proven, busy, has money
        elif rating >= 4.0 and reviews >= 50:
            score += 20
        elif rating >= 4.0 and reviews >= 15:
            score += 12
        elif rating >= 3.5 and reviews >= 30:
            score += 6
        if rating < 3.5 and reviews >= 20:
            # Lots of bad reviews: they need leads *and* reputation repair.
            score += 8

    # A business with no reviews at all is a bad bet regardless of category.
    if not reviews:
        score -= 14

    # Reachability of a human.
    if raw.phone:
        score += 6

    return max(0, min(100, int(score)))


def opportunity_score(need: int, value: int) -> int:
    return int(round(need * 0.62 + value * 0.38))


def build_pitch_facts(raw: RawLead, audit: AuditResult | None, cls: str) -> list[str]:
    """Only verifiable statements. Nothing here may be embellished in a pitch."""
    facts: list[str] = []

    if cls == NO_PRESENCE:
        if raw.source == "overpass":
            facts.append("No website listed in OpenStreetMap (weak signal -- verify first).")
        else:
            facts.append("No website is attached to their Google listing.")
    elif cls == SOCIAL_ONLY:
        host = (re.sub(r"^https?://", "", raw.website).split("/")[0]).lower()
        facts.append(f"Their only web presence is a {host} page.")
    elif cls == MARKETPLACE:
        host = (re.sub(r"^https?://", "", raw.website).split("/")[0]).lower()
        facts.append(f"Their 'website' is a {host} listing, not a site they own.")
    elif cls == DEAD_SITE:
        if audit and audit.serves_other_business:
            facts.append(
                f"{audit.domain} loads a page for a different business, titled "
                f"\"{audit.serves_other_business}\"."
            )
        elif audit and audit.redirected_domain:
            facts.append(
                f"{audit.domain} redirects to {audit.redirected_domain}, which is "
                "not their business."
            )
        elif audit and audit.is_parked:
            facts.append(f"{audit.domain} is a parked placeholder page.")
        elif audit and audit.status is None:
            facts.append(f"{audit.domain} does not load at all.")
        elif audit and audit.status:
            facts.append(f"{audit.domain} returns HTTP {audit.status}.")
    elif cls == NEEDS_REHAB and audit is not None:
        facts.extend(audit.quotes(3))

    if raw.rating is not None and raw.review_count:
        facts.append(
            f"{raw.rating:.1f}-star rating across {raw.review_count} Google reviews."
        )
    return facts


def score_lead(
    raw: RawLead, audit: AuditResult | None, today: str = ""
) -> ScoredLead:
    cls = classify(raw, audit)
    need = need_score(raw, audit, cls)
    value = value_score(raw, cls)
    opp = opportunity_score(need, value)

    site = normalize_url(raw.website)
    summary = audit.summary_line() if audit else "not audited"

    return ScoredLead(
        name=raw.name,
        industry=raw.industry,
        phone=raw.phone,
        email=(audit.evidence.get("email", "") if audit else ""),
        address=raw.address,
        website=site,
        traffic_tier={
            NO_PRESENCE: "None",
            SOCIAL_ONLY: "None",
            MARKETPLACE: "None",
            DEAD_SITE: "Dead",
            NEEDS_REHAB: "Minimal",
            HAS_SITE: "Active",
        }.get(cls, "Unknown"),
        decision_maker=DECISION_MAKER_BY_INDUSTRY.get(raw.industry, "Owner/Operator"),
        classification=cls,
        opportunity=opp,
        need_score=need,
        value_score=value,
        site_health=audit.health if audit else None,
        rating=raw.rating,
        review_count=raw.review_count,
        audit_summary=summary,
        pitch_facts=build_pitch_facts(raw, audit, cls),
        sources=[raw.source] if raw.source else [],
        source_ids=raw.source_id or "",
        low_confidence=bool(raw.raw.get("low_confidence")),
        maps_url=raw.raw.get("googleMapsUri", ""),
        last_audited=today,
    )
