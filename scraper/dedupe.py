"""Deduplication across sources and markets.

The same business shows up once per market it operates in and once per trade
query, and OSM/Google disagree about the phone number format. Merging on
domain, then phone, then name+street is what keeps the pipeline from
hammering the same shop with three emails.
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field

from .http_client import registrable_domain
from .providers.base import RawLead

SUFFIXES = {
    "inc", "llc", "ltd", "co", "corp", "company", "llp", "lp", "pllc", "pc",
    "the", "and", "of", "a", "an",
}
NON_ALNUM = re.compile(r"[^a-z0-9 ]+")
WS = re.compile(r"\s+")


def normalize_name(name: str) -> str:
    s = name.lower()
    s = s.replace("&", " and ")
    s = NON_ALNUM.sub(" ", s)
    tokens = [t for t in WS.sub(" ", s).split() if t and t not in SUFFIXES]
    return " ".join(tokens)


def normalize_phone(phone: str) -> str:
    if not phone:
        return ""
    digits = re.sub(r"\D", "", phone)
    if len(digits) == 11 and digits.startswith("1"):
        digits = digits[1:]
    if len(digits) == 10:
        return f"{digits[:3]}{digits[3:6]}{digits[6:]}"
    return digits if len(digits) >= 7 else ""


def normalize_street(address: str) -> str:
    if not address:
        return ""
    s = address.lower().split(",")[0]
    s = NON_ALNUM.sub(" ", s)
    return WS.sub(" ", s).strip()


@dataclass
class MergeBucket:
    leads: list[RawLead] = field(default_factory=list)

    def best(self, attr: str, default=""):
        """Prefer a non-empty value; among values prefer the Google one."""
        vals = [getattr(x, attr) for x in self.leads if getattr(x, attr, None)]
        if not vals:
            return default
        for x in self.leads:
            if x.source == "google_places" and getattr(x, attr, None):
                return getattr(x, attr)
        return vals[0]


def _keys(lead: RawLead) -> list[str]:
    keys: list[str] = []
    if lead.website:
        dom = registrable_domain(lead.website)
        if dom:
            keys.append(f"dom:{dom}")
    if lead.phone:
        keys.append(f"tel:{normalize_phone(lead.phone)}")
    nm, st = normalize_name(lead.name), normalize_street(lead.address)
    if nm:
        # Name+street is specific enough not to over-merge chains.
        keys.append(f"ns:{nm}|{st}" if st else f"nm:{nm}")
    return keys


def dedupe(leads: list[RawLead]) -> list[RawLead]:
    """Merge duplicates, preferring the richest record for each field."""
    buckets: dict[str, MergeBucket] = {}
    order: list[str] = []
    for lead in leads:
        keys = _keys(lead)
        if not keys:
            continue
        primary = keys[0]
        target = None
        for k in keys:
            if k in buckets:
                target = buckets[k]
                break
        if target is None:
            target = MergeBucket()
            order.append(primary)
        target.leads.append(lead)
        for k in keys:
            buckets.setdefault(k, target)

    merged: list[RawLead] = []
    for primary in order:
        bucket = buckets[primary]
        if len(bucket.leads) == 1:
            merged.append(bucket.leads[0])
            continue

        base = next(
            (x for x in bucket.leads if x.source == "google_places"),
            bucket.leads[0],
        )
        winner = RawLead(
            name=base.name,
            industry=base.industry,
            address=bucket.best("address") or base.address,
            phone=bucket.best("phone") or base.phone,
            website=bucket.best("website") or base.website,
            rating=next((x.rating for x in bucket.leads if x.rating is not None), None),
            review_count=next(
                (x.review_count for x in bucket.leads if x.review_count), None
            ),
            source="+".join(sorted({x.source for x in bucket.leads})),
            source_id="|".join(sorted({x.source_id for x in bucket.leads if x.source_id})),
            lat=next((x.lat for x in bucket.leads if x.lat is not None), None),
            lon=next((x.lon for x in bucket.leads if x.lon is not None), None),
            raw={
                "merged_from": [x.source for x in bucket.leads],
                "googleMapsUri": next(
                    (x.raw.get("googleMapsUri") for x in bucket.leads
                     if x.raw.get("googleMapsUri")), ""
                ),
                "query": next(
                    (x.raw.get("query") for x in bucket.leads if x.raw.get("query")), ""
                ),
                # Still low confidence unless a real source contributed.
                "low_confidence": not any(
                    x.raw.get("low_confidence") is False for x in bucket.leads
                ),
            },
        )
        merged.append(winner)
    return merged
