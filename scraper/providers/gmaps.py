"""Gosom google-maps-scraper provider -- Google data without a Places API key.

Wraps the open-source ``google-maps-scraper`` binary (MIT, Go). Same coverage
as the paid Places API for our purposes -- name, phone, address, website,
rating, review count -- but with no billing setup. That makes it the only
full-fidelity source available to accounts that cannot enable a credit card.

Tradeoffs to be honest about:

* It scrapes Google Maps' public pages, which violates Google's ToS and can
  get the egress IP rate-limited or blocked. Run it politely (sequential,
  depth-limited) and cache the output, which this provider does.
* The Google Places API provider remains the sanctioned path when a key is
  available.
"""

from __future__ import annotations

import json
import shutil
import subprocess
from pathlib import Path

from .base import RawLead
from ..config import CONFIG, CACHE_DIR

NAME = "gmaps"

BINARY_CANDIDATES = (
    "google-maps-scraper",
    str(Path.home() / "go" / "bin" / "google-maps-scraper"),
)


def _binary() -> str | None:
    for candidate in BINARY_CANDIDATES:
        found = shutil.which(candidate) or (candidate if Path(candidate).exists() else None)
        if found:
            return found
    return None


def available() -> bool:
    return _binary() is not None


def _industry_queries(trades) -> list[tuple[str, str]]:
    """One Google query per industry: the first (fullest) fragment per industry."""
    seen: dict[str, str] = {}
    for query, industry, _osm_tag in trades:
        seen.setdefault(industry, query)
    return [(q, ind) for ind, q in sorted(seen.items(), key=lambda kv: kv[0])]


def fetch(market, trades) -> list[RawLead]:
    binary = _binary()
    if binary is None:
        return []

    queries = _industry_queries(trades)
    if not queries:
        return []

    cache_file = CACHE_DIR / f"gmaps_{market.name.lower().replace(' ', '_')}.jsonl"
    if CONFIG.use_cache and cache_file.exists():
        return _load(cache_file, market)

    center = _bbox_center(market.bbox)
    input_path = CACHE_DIR / f"gmaps_{market.name.lower().replace(' ', '_')}_queries.txt"
    input_path.write_text(
        "".join(f"{q} in {market.region}\n" for q, _ in queries), encoding="utf-8"
    )
    # Scrape into a temp file and only promote it on success, otherwise a
    # timeout/rate-limit leaves a partial file that the cache path then treats
    # as valid data on the next run.
    result_path = cache_file
    tmp_path = cache_file.with_suffix(".tmp.jsonl")

    cmd = [
        binary, "-input", str(input_path),
        "-json", "-depth", "2", "-geo", center,
        "-results", str(tmp_path),
    ]
    ok = False
    try:
        proc = subprocess.run(cmd, check=False, timeout=3600)
        ok = proc.returncode == 0 and tmp_path.exists() and tmp_path.stat().st_size > 0
    except subprocess.TimeoutExpired:
        ok = False
    if not ok:
        tmp_path.unlink(missing_ok=True)
        return []
    tmp_path.replace(result_path)
    return _load(result_path, market)


def _load(path: Path, market) -> list[RawLead]:
    leads: list[RawLead] = []
    for line in path.read_text(encoding="utf-8", errors="replace").splitlines():
        line = line.strip()
        if not line.startswith("{") or '"component"' in line:
            continue
        try:
            row = json.loads(line)
        except json.JSONDecodeError:
            continue
        if not row.get("title"):
            continue
        leads.append(
            RawLead(
                name=row.get("title", ""),
                industry=_guess_industry(row),
                address=row.get("address") or row.get("complete_address", {}).get("address", "") or "",
                phone=row.get("phone") or "",
                website=row.get("web_site") or "",
                rating=row.get("review_rating"),
                review_count=row.get("review_count"),
                source=NAME,
                source_id=str(row.get("place_id") or row.get("data_id") or row.get("cid") or ""),
                lat=row.get("latitude"),
                lon=row.get("longitude"),
                raw={"category": row.get("category", ""), "link": row.get("link", "")},
            )
        )
    return leads


def _guess_industry(row: dict) -> str:
    cat = (row.get("category") or "").lower()
    if "plumb" in cat:
        return "Plumbing"
    if "roof" in cat:
        return "Roofing"
    if any(k in cat for k in ("auto repair", "auto body", "car", "tire", "towing")):
        return "Automotive"
    if "hvac" in cat or "air conditioning" in cat or "heating" in cat:
        return "HVAC"
    if "electric" in cat:
        return "Electrical"
    if any(k in cat for k in ("landscap", "lawn", "tree")):
        return "Landscaping"
    if "dent" in cat:
        return "Dental"
    if "restaurant" in cat or "cafe" in cat or "bakery" in cat or "bar" in cat:
        return "Restaurant"
    if "real estate" in cat:
        return "Real Estate"
    if "lawyer" in cat or "law" in cat or "attorney" in cat:
        return "Professional Services"
    if cat:
        return cat.title()[:40]
    return "General"


def _bbox_center(bbox: tuple[float, float, float, float]) -> str:
    south, west, north, east = bbox
    return f"{(south + north) / 2:.4f},{(west + east) / 2:.4f}"
