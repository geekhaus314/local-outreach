#!/usr/bin/env python3
"""Convert real harvested leads from leads.csv into prospect JSON records.

Reads leads.csv (produced by the Python scraper pipeline), picks one
representative per distinct industry, and writes a web/prospects/<slug>.json
envelope for each. These are real business records - not mock data - so they
are legitimate seed content for the white-label preview engine.
"""

from __future__ import annotations

import csv
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
CSV_PATH = ROOT / "leads.csv"
OUT_DIR = ROOT / "web" / "prospects"

INDUSTRY_TO_VERTICAL = {
    "HVAC": "hvac",
    "Roofing": "roofing",
    "Restaurant": "restaurant",
    "Automotive": "automotive",
    "Plumbing": "plumbing",
    "Dental": "dental",
    "Veterinarian": "veterinary",
    "Retail": "retail",
    "Electrical": "electrical",
    "Landscaping": "landscaping",
    "Pest Control Service": "pest",
    "Mover": "moving",
    "Painter": "painting",
    "Window Installation Service": "windows",
    "Locksmith": "locksmith",
    "Fitness": "fitness",
    "Pool": "pool",
    "Cleaning": "cleaning",
    "Medical": "medical",
    "Appliance": "appliance",
    "General Contractor": "remodeling",
    "Construction Company": "remodeling",
}

THEME_FOR_VERTICAL = {
    "hvac": "clinical-trust",
    "roofing": "clinical-trust",
    "restaurant": "premium-luxury",
    "automotive": "clinical-trust",
    "plumbing": "clinical-trust",
    "dental": "clinical-trust",
    "veterinary": "modern-wellness",
    "retail": "premium-luxury",
    "electrical": "clinical-trust",
    "landscaping": "modern-wellness",
    "pest": "clinical-trust",
    "moving": "clinical-trust",
    "painting": "modern-wellness",
    "windows": "clinical-trust",
    "locksmith": "clinical-trust",
    "fitness": "modern-wellness",
    "pool": "modern-wellness",
    "cleaning": "modern-wellness",
    "medical": "clinical-trust",
    "appliance": "clinical-trust",
    "remodeling": "premium-luxury",
}

TEMPLATE_FOR_VERTICAL = {
    "hvac": "service",
    "roofing": "project",
    "restaurant": "menu",
    "automotive": "service",
    "plumbing": "service",
    "dental": "clinic",
    "veterinary": "clinic",
    "retail": "general",
    "electrical": "service",
    "landscaping": "project",
    "pest": "service",
    "moving": "service",
    "painting": "project",
    "windows": "service",
    "locksmith": "service",
    "fitness": "editorial",
    "pool": "service",
    "cleaning": "service",
    "medical": "clinic",
    "appliance": "service",
    "remodeling": "project",
}


def slugify(name: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")
    return slug or "prospect"


def classify(classification_raw: str) -> str:
    mapping = {
        "DEAD_SITE": "DEAD_SITE",
        "HAS_SITE": "HAS_DECENT_SITE",
        "NO_PRESENCE": "NO_PRESENCE",
        "SOCIAL_ONLY": "SOCIAL_ONLY",
        "MARKETPLACE": "MARKETPLACE_ONLY",
        "NEEDS_REHAB": "NEEDS_REHAB",
    }
    return mapping.get(classification_raw.strip(), "NEEDS_REHAB")


def main() -> int:
    if not CSV_PATH.exists():
        print(f"CSV not found: {CSV_PATH}", file=sys.stderr)
        return 1

    OUT_DIR.mkdir(parents=True, exist_ok=True)

    seen_industries: set[str] = set()
    written: list[str] = []

    with CSV_PATH.open(newline="", encoding="utf-8") as fh:
        reader = csv.DictReader(fh)
        for row in reader:
            industry = (row.get("Industry") or "").strip()
            if not industry or industry in seen_industries:
                continue
            if industry not in INDUSTRY_TO_VERTICAL:
                continue

            seen_industries.add(industry)
            vertical = INDUSTRY_TO_VERTICAL[industry]
            name = (row.get("Business Name") or "").strip() or "Unnamed Business"
            slug = slugify(name)

            prospect = {
                "name": name,
                "industry": industry,
                "phone": (row.get("Phone") or "").strip(),
                "address": (row.get("Address") or "").strip(),
                "website": (row.get("Website") or "").strip(),
                "email": "",
                "traffic_tier": (row.get("Traffic Tier") or "Dead").strip(),
                "decision_maker": (row.get("Decision Maker") or "Owner/Operator").strip(),
                "classification": classify(row.get("Classification") or "NEEDS_REHAB"),
                "opportunity": int(row.get("Opportunity Score") or 90),
                "need_score": int(row.get("Need Score") or 90),
                "value_score": int(row.get("Value Score") or 80),
                "site_health": int(row.get("Site Health") or 0) if (row.get("Site Health") or "").strip() else None,
                "rating": float(row.get("Rating") or 0) if (row.get("Rating") or "").strip() else None,
                "review_count": int(row.get("Review Count") or 0) if (row.get("Review Count") or "").strip() else None,
                "audit_summary": (row.get("Audit Summary") or "").strip() or "Not yet audited.",
                "pitch_facts": [f for f in (row.get("Pitch Facts") or "").split(" | ") if f.strip()],
                "sources": [s for s in (row.get("Sources") or "gmaps").split(",") if s.strip()],
                "source_ids": (row.get("Source IDs") or "").strip(),
                "low_confidence": (row.get("Low Confidence") or "no").strip().lower() in ("yes", "1", "true"),
                "maps_url": (row.get("Maps URL") or "").strip(),
                "last_audited": "",
                "persona": (row.get("Persona Read") or "").strip(),
            }

            # Derive hostname candidates from the website URL.
            website = prospect["website"]
            hostnames = []
            if website:
                host = re.sub(r"^https?://", "", website).split("/")[0].strip()
                if host:
                    hostnames = [host, f"{slug}.preview.localhost", f"{slug}.localhost"]
            else:
                hostnames = [f"{slug}.preview.localhost", f"{slug}.localhost"]

            record = {
                "hostnames": hostnames,
                "previewBaseDomain": "preview.localhost",
                "indexable": False,
                "template": TEMPLATE_FOR_VERTICAL[vertical],
                "theme": THEME_FOR_VERTICAL[vertical],
                "prospect": prospect,
            }

            out_path = OUT_DIR / f"{slug}.json"
            out_path.write_text(json.dumps(record, indent=2) + "\n", encoding="utf-8")
            written.append(slug)
            print(f"wrote {out_path.name}  ({industry} -> {vertical})")

    print(f"\nWrote {len(written)} prospect records to {OUT_DIR}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
