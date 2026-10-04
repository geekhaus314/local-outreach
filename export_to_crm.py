#!/usr/bin/env python3
"""Explicitly import one reviewed lead into the private pwn4g3 lead desk."""

from __future__ import annotations

import argparse
import csv
import json
import os
import sys
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from scraper.config import load_dotenv

ROOT = Path(__file__).resolve().parent
CSV_PATH = ROOT / "leads.csv"
IMPORT_URL = "https://pwn4g3.geekhaus314.workers.dev/admin/api/leads/import"

load_dotenv()


def _text(row: dict[str, str], key: str) -> str:
    return (row.get(key) or "").strip()


def _integer(row: dict[str, str], key: str, *, optional: bool = False) -> int | None:
    value = _text(row, key)
    if optional and not value:
        return None
    try:
        return int(value)
    except ValueError as exc:
        raise ValueError(f"{key} must be an integer; got {value!r}") from exc


def _rating(row: dict[str, str]) -> float | None:
    value = _text(row, "Rating")
    if not value:
        return None
    try:
        return float(value)
    except ValueError as exc:
        raise ValueError(f"Rating must be numeric; got {value!r}") from exc


def _split(row: dict[str, str], key: str, separator: str) -> list[str]:
    return [part.strip() for part in _text(row, key).split(separator) if part.strip()]


def payload_for(row: dict[str, str]) -> dict[str, object]:
    """Build the narrow, versioned API payload; never include draft copy or persona."""
    low_confidence = _text(row, "Low Confidence").lower()
    if low_confidence not in {"yes", "no"}:
        raise ValueError("Low Confidence must be yes or no")

    name = _text(row, "Business Name")
    industry = _text(row, "Industry")
    classification = _text(row, "Classification")
    if not name or not industry or not classification:
        raise ValueError("Business Name, Industry, and Classification are required")

    sources = _split(row, "Sources", ",")
    if "gmaps" in sources:
        raise ValueError("Google Maps-scraped records are not eligible for CRM import; use Places API or OSM data")

    return {
        "schema_version": 1,
        "name": name,
        "website": _text(row, "Website"),
        "phone": _text(row, "Phone"),
        "address": _text(row, "Address"),
        "city": "St. Louis",
        "industry": industry,
        "classification": classification,
        "opportunity_score": _integer(row, "Opportunity Score"),
        "need_score": _integer(row, "Need Score"),
        "value_score": _integer(row, "Value Score"),
        "site_health": _integer(row, "Site Health", optional=True),
        "rating": _rating(row),
        "review_count": _integer(row, "Review Count", optional=True),
        "audit_summary": _text(row, "Audit Summary"),
        "pitch_facts": _split(row, "Pitch Facts", "|"),
        "sources": sources,
        "low_confidence": low_confidence == "yes",
        "last_audited": _text(row, "Last Audited") or None,
    }


def read_leads(path: Path) -> list[dict[str, str]]:
    with path.open(newline="", encoding="utf-8-sig") as stream:
        return list(csv.DictReader(stream))


def display_rows(rows: list[dict[str, str]], limit: int) -> None:
    for index, row in enumerate(rows[:limit], start=1):
        name = _text(row, "Business Name") or "(unnamed)"
        website = _text(row, "Website") or "(no website)"
        classification = _text(row, "Classification") or "?"
        score = _text(row, "Opportunity Score") or "?"
        print(f"{index:>4}. {name} | {website} | {classification} | score {score}")
    if len(rows) > limit:
        print(f"... {len(rows) - limit} more; increase --limit to list them")


def preview(payload: dict[str, object]) -> None:
    print("One lead will be sent to the pwn4g3 private CRM:")
    for key in ("name", "website", "phone", "address", "industry", "classification"):
        print(f"  {key}: {payload[key] or '(none)'}")
    for key in ("opportunity_score", "need_score", "value_score", "site_health", "rating", "review_count"):
        print(f"  {key}: {payload[key] if payload[key] is not None else '(unknown)'}")
    print(f"  low_confidence: {payload['low_confidence']}")
    print(f"  pitch_facts: {' | '.join(payload['pitch_facts']) or '(none)'}")
    print("No outreach message is sent.")


def import_one(payload: dict[str, object], token: str) -> tuple[int, str]:
    request = Request(
        IMPORT_URL,
        data=json.dumps(payload, ensure_ascii=False).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
            "Accept": "application/json",
        },
        method="POST",
    )
    with urlopen(request, timeout=15) as response:
        body = response.read(64 * 1024 + 1)
        if len(body) > 64 * 1024:
            raise RuntimeError("CRM response exceeded the 64 KiB limit")
        return response.status, body.decode("utf-8", errors="replace")


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--csv", type=Path, default=CSV_PATH, help="lead CSV (default: leads.csv)")
    parser.add_argument("--list", action="store_true", help="list lead indexes without sending any data")
    parser.add_argument("--limit", type=int, default=100, help="maximum rows shown by --list")
    parser.add_argument("--index", type=int, help="one-based CSV row number to review and import")
    parser.add_argument("--yes", action="store_true", help="confirm the reviewed single-lead import without prompting")
    args = parser.parse_args(argv)

    if args.list == (args.index is not None):
        parser.error("choose exactly one of --list or --index")
    if args.limit < 1:
        parser.error("--limit must be positive")
    if args.index is not None and args.index < 1:
        parser.error("--index is one-based and must be positive")

    try:
        rows = read_leads(args.csv)
        if args.list:
            display_rows(rows, args.limit)
            return 0
        if args.index > len(rows):
            raise ValueError(f"--index {args.index} is outside the CSV (contains {len(rows)} leads)")

        payload = payload_for(rows[args.index - 1])
        preview(payload)
        if not args.yes:
            if not sys.stdin.isatty():
                raise ValueError("non-interactive import requires --yes after reviewing the selected row")
            if input("Import exactly this lead? [y/N] ").strip().lower() != "y":
                print("Cancelled; nothing was sent.")
                return 0

        token = os.environ.get("PWN4G3_ADMIN_TOKEN", "").strip()
        if not token:
            raise ValueError("set PWN4G3_ADMIN_TOKEN in your local environment before importing")
        status, response = import_one(payload, token)
        print(f"CRM response ({status}): {response}")
        return 0
    except HTTPError as exc:
        detail = exc.read(2048).decode("utf-8", errors="replace")
        print(f"CRM rejected the import ({exc.code}): {detail}", file=sys.stderr)
    except (OSError, URLError, TimeoutError, RuntimeError, ValueError) as exc:
        print(f"Import failed: {exc}", file=sys.stderr)
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
