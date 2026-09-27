#!/usr/bin/env python3
"""CLI for the local lead scraper.

Examples
--------
    python3 run_scraper.py                          # everything configured
    python3 run_scraper.py --provider osm           # free, no API key needed
    python3 run_scraper.py --market "Florissant"    # one market
    python3 run_scraper.py --dry-run                # no files written
    python3 run_scraper.py --trade plumber --trade roofing
    python3 run_scraper.py --max-queries 5          # cap Places API spend
    python3 run_scraper.py --no-cache               # force a fresh harvest
"""

from __future__ import annotations

import argparse
import sys
import time

from scraper.config import CONFIG, MARKETS, TRADES


def parse_args(argv=None):
    p = argparse.ArgumentParser(
        description="Harvest St. Louis County businesses that need a website.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__,
    )
    p.add_argument(
        "--market", action="append", default=[], metavar="NAME",
        help="limit to a market (repeatable). Default: all configured markets.",
    )
    p.add_argument(
        "--trade", action="append", default=[], metavar="QUERY",
        help="limit to trades whose query contains this text (repeatable).",
    )
    p.add_argument(
        "--industries", default="", metavar="A,B,C",
        help="limit to these normalized industries, e.g. Plumbing,Roofing,Automotive. "
             "Use this to focus on trades rather than restaurants.",
    )
    p.add_argument(
        "--provider", choices=["google", "osm", "both", "auto"], default="auto",
        help="data source. 'auto' = google when a key is present, else osm.",
    )
    p.add_argument("--max-queries", type=int, default=0,
                   help="cap the number of Places API queries (0 = no cap).")
    p.add_argument("--max-pages", type=int, default=0,
                   help="pages per Places query (max 3, 0 = configured default).")
    p.add_argument("--no-cache", action="store_true",
                   help="ignore the local response cache and refetch everything.")
    p.add_argument("--no-audit", action="store_true",
                   help="skip live website audits (much faster, much dumber).")
    p.add_argument("--audit-concurrency", type=int, default=0,
                   help="parallel site audits (default 6).")
    p.add_argument("--timeout", type=int, default=0,
                   help="per-request timeout in seconds.")
    p.add_argument("-v", "--verbose", action="store_true")
    p.add_argument("--dry-run", action="store_true",
                   help="harvest and report without writing any files.")
    p.add_argument("--list-markets", action="store_true",
                   help="print configured markets and exit.")
    return p.parse_args(argv)


def main(argv=None) -> int:
    args = parse_args(argv)

    if args.list_markets:
        print("Configured markets:")
        for m in MARKETS:
            print(f"  {m.name:22} {m.region:24} bbox={m.bbox}")
        print(f"\nConfigured trades: {len(TRADES)}")
        return 0

    # Env overrides so the CLI can flip config without a reload dance.
    if args.no_cache:
        CONFIG.use_cache = False
        CONFIG.cache_ttl_hours = 0
    if args.no_audit:
        CONFIG.audit_enabled = False
    if args.audit_concurrency:
        CONFIG.audit_concurrency = max(1, args.audit_concurrency)
    if args.timeout:
        CONFIG.request_timeout = args.timeout
        CONFIG.audit_timeout = args.timeout
    if args.max_queries:
        CONFIG.max_queries = args.max_queries
    if args.max_pages:
        CONFIG.places_max_pages = min(3, max(1, args.max_pages))
    if args.verbose:
        CONFIG.verbose = True

    markets = MARKETS
    if args.market:
        wanted = {m.lower() for m in args.market}
        markets = [m for m in MARKETS if m.name.lower() in wanted]
        if not markets:
            print(f"No configured market matched {args.market!r}.", file=sys.stderr)
            print("Run with --list-markets to see options.", file=sys.stderr)
            return 2

    trades = TRADES
    if args.trade:
        wanted = [t.lower() for t in args.trade]
        trades = [t for t in TRADES if any(w in t[0].lower() for w in wanted)]
        if not trades:
            print(f"No configured trade matched {args.trade!r}.", file=sys.stderr)
            return 2

    if args.industries:
        allowed = {i.strip().lower() for i in args.industries.split(",") if i.strip()}
        trades = [t for t in trades if t[1].lower() in allowed]
        if not trades:
            print(f"No trade matches industries {sorted(allowed)}.", file=sys.stderr)
            print("Known industries: " + ", ".join(
                sorted({t[1] for t in TRADES})
            ), file=sys.stderr)
            return 2
        print(f"Industry filter active: {', '.join(sorted({t[1] for t in trades}))}")

    use_google = args.provider in ("google", "both", "auto") and CONFIG.has_google()
    use_overpass = args.provider in ("osm", "both", "auto")

    if args.provider == "google" and not CONFIG.has_google():
        print(
            "GOOGLE_PLACES_API_KEY is not set. Add it to .env (see .env.example)\n"
            "or use --provider osm for the free fallback.",
            file=sys.stderr,
        )
        return 2
    if args.provider == "auto" and not CONFIG.has_google():
        use_google = False
        use_overpass = True
        print("No GOOGLE_PLACES_API_KEY found - using free OpenStreetMap data only.\n")

    print(f"Markets: {len(markets)} | Trades: {len(trades)} | "
          f"Google: {'on' if use_google else 'off'} | "
          f"OSM: {'on' if use_overpass else 'off'} | "
          f"Audit: {'on' if CONFIG.audit_enabled else 'off'}")
    print("-" * 68)

    from scraper import pipeline  # imported late so --list-markets stays instant

    started = time.monotonic()
    try:
        pipeline.run(
            markets=markets,
            trades=trades,
            use_google=use_google,
            use_overpass=use_overpass,
            write=not args.dry_run,
        )
    except KeyboardInterrupt:
        print("\nInterrupted.", file=sys.stderr)
        return 130
    except Exception as exc:
        print(f"\nFatal: {type(exc).__name__}: {exc}", file=sys.stderr)
        return 1

    print(f"\nElapsed: {time.monotonic() - started:.1f}s")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
