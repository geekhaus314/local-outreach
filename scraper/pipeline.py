"""Orchestration: harvest -> dedupe -> audit -> score -> write.

Concurrency is used for the site audits only. Provider calls stay sequential on
purpose: they hit metered public APIs that rate-limit aggressively, and
hammering them is how you get your key throttled.
"""

from __future__ import annotations

import csv
import json
import sys
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import date

from .audit import AuditResult, audit_url
from .config import (
    CONFIG,
    LEADS_CSV,
    MARKETS,
    TRADES,
    DATA_DIR,
)
from .dedupe import dedupe
from .providers import google_places, overpass
from .providers.base import RawLead
from .scoring import (
    CSV_HEADER,
    DEAD_SITE,
    HAS_SITE,
    MARKETPLACE,
    NEEDS_REHAB,
    NO_PRESENCE,
    SOCIAL_ONLY,
    ScoredLead,
    score_lead,
)

BUCKET_ORDER = {
    NO_PRESENCE: 0,
    DEAD_SITE: 1,
    SOCIAL_ONLY: 2,
    MARKETPLACE: 3,
    NEEDS_REHAB: 4,
    HAS_SITE: 5,
}


def log(msg: str) -> None:
    print(msg, flush=True)


def collect(
    markets=MARKETS,
    trades=TRADES,
    use_google: bool = True,
    use_overpass: bool = True,
) -> list[RawLead]:
    CONFIG.ensure_dirs()
    raw: list[RawLead] = []

    if use_google and google_places.available():
        log(f"[1/2] Google Places enabled ({len(markets)} markets x {len(trades)} trades)")
        for m in markets:
            got = google_places.fetch(m, trades)
            log(f"  {m.name:20} {len(got):4} raw results")
            raw.extend(got)
    elif use_google:
        log("[1/2] Google Places SKIPPED - no GOOGLE_PLACES_API_KEY set")

    if use_overpass and overpass.available():
        log("[2/2] OpenStreetMap (free fallback - thin US coverage)")
        for m in markets:
            got = overpass.fetch(m, trades)
            log(f"  {m.name:20} {len(got):4} raw results")
            raw.extend(got)

    return raw


def audit_all(leads: list[RawLead]) -> dict[str, AuditResult]:
    """Audit every distinct website once, concurrently."""
    targets = sorted({l.website for l in leads if l.website})
    # Social/marketplace pages are classified without a fetch.
    targets = [t for t in targets if t]
    if not targets:
        return {}
    if not CONFIG.audit_enabled:
        log(f"Audit disabled by config; {len(targets)} sites skipped")
        return {}

    log(f"Auditing {len(targets)} distinct websites "
        f"({CONFIG.audit_concurrency} workers, {CONFIG.audit_timeout}s timeout)...")

    results: dict[str, AuditResult] = {}
    done = 0
    with ThreadPoolExecutor(max_workers=CONFIG.audit_concurrency) as pool:
        futures = {pool.submit(audit_url, url): url for url in targets}
        for fut in as_completed(futures):
            url = futures[fut]
            try:
                results[url] = fut.result()
            except Exception as exc:  # audit_url should not raise, but be safe
                results[url] = AuditResult(
                    url=url, error=f"audit crashed: {type(exc).__name__}: {exc}"
                )
            done += 1
            if done % 25 == 0 or done == len(targets):
                log(f"  audited {done}/{len(targets)}")
    return results


def build(raw: list[RawLead], audits: dict[str, AuditResult]) -> list[ScoredLead]:
    today = date.today().isoformat()
    scored = [score_lead(r, audits.get(r.website), today) for r in raw]

    # A lead with no website has nothing to audit; say so plainly instead of
    # leaving "not audited" sitting in a column labelled Audit Summary.
    for s in scored:
        if s.site_health is None and not s.website:
            s.audit_summary = "no website to audit"
        elif s.site_health is None:
            s.audit_summary = "audit skipped"

    scored.sort(key=lambda s: (BUCKET_ORDER.get(s.classification, 9), -s.opportunity))
    return scored


def write_csv(leads: list[ScoredLead], path=LEADS_CSV) -> None:
    with open(path, "w", newline="", encoding="utf-8") as fh:
        writer = csv.writer(fh)
        writer.writerow(CSV_HEADER)
        for lead in leads:
            writer.writerow(lead.to_csv_row())
    log(f"Wrote {len(leads)} leads -> {path}")


def write_json(leads: list[ScoredLead], path=None) -> None:
    path = path or (DATA_DIR / "leads_snapshot.json")
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(
        json.dumps([x.to_dict() for x in leads], indent=2, ensure_ascii=False),
        encoding="utf-8",
    )
    log(f"Wrote snapshot -> {path}")


def summarize(leads: list[ScoredLead]) -> None:
    counts: dict[str, int] = {}
    for x in leads:
        counts[x.classification] = counts.get(x.classification, 0) + 1

    log("")
    log("=" * 68)
    log("PIPELINE SUMMARY")
    log("=" * 68)
    for bucket in sorted(counts, key=lambda b: BUCKET_ORDER.get(b, 9)):
        log(f"  {bucket:20} {counts[bucket]:5}")

    targets = [
        x for x in leads
        if x.classification in (NO_PRESENCE, DEAD_SITE, SOCIAL_ONLY, MARKETPLACE, NEEDS_REHAB)
    ]
    log(f"\n  Actionable (no site / dead / social-only / needs rehab): {len(targets)}")
    log(f"  Healthy enough to skip: {len(leads) - len(targets)}")

    if targets:
        log("\n  TOP 15 BY OPPORTUNITY")
        log("  " + "-" * 66)
        for x in targets[:15]:
            rating = f"{x.rating:.1f}({x.review_count})" if x.rating else "  -  "
            log(f"  {x.opportunity:3}  {x.classification:15} {rating:11} {x.name[:34]}")
            if x.audit_summary:
                log(f"       {x.audit_summary[:64]}")
    log("=" * 68)

    if not CONFIG.has_google():
        log("")
        log("NOTE: only free OpenStreetMap data was used. Coverage of US local")
        log("      businesses there is thin and its 'website' tag is unreliable,")
        log("      so expect a small list and false 'no site' positives.")
        log("      Set GOOGLE_PLACES_API_KEY in .env for real volume.")


def run(
    markets=MARKETS,
    trades=TRADES,
    use_google: bool = True,
    use_overpass: bool = True,
    write: bool = True,
) -> list[ScoredLead]:
    raw = collect(markets, trades, use_google, use_overpass)
    log(f"\nRaw leads collected: {len(raw)}")

    deduped = dedupe(raw)
    log(f"After dedupe:        {len(deduped)}")

    audits = audit_all(deduped)
    leads = build(deduped, audits)
    summarize(leads)

    if write:
        write_csv(leads)
        write_json(leads)

    return leads
