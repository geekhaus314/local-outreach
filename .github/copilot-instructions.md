# Copilot instructions

## Commands

Run from the repository root:

```bash
python3 -m pip install -r requirements.txt
python3 run_scraper.py --provider osm
python3 parse_leads.py --no-check
python3 export_to_crm.py --list
python3 export_to_crm.py --index 3
python3 -m pytest tests/ -q
python3 -m pytest tests/test_scraper.py::test_normalize_url -q
python3 -m pytest tests/test_crm_export.py -q
node sites/check-mockup.mjs
```

The pytest selector at the end runs one test. Scraping and the default
`parse_leads.py` flow make network requests; use `--no-audit` or `--no-check`
when you need an offline path. Google Places requires `GOOGLE_PLACES_API_KEY`
in a local `.env`; never put credentials or generated lead data in source
control. `export_to_crm.py` transfers only one explicitly selected CSV row
after confirmation; it requires `PWN4G3_ADMIN_TOKEN` and the pwn4g3 admin
source-IP allowlist. It refuses rows sourced from Google Maps HTML scraping.

## Architecture

The lead pipeline is split into harvest, merge, measure, rank, and outreach
queue stages:

1. `scraper/providers/` adapts data sources into the shared `RawLead` model
   from `scraper/providers/base.py`.
2. `scraper/dedupe.py` merges duplicate businesses across sources.
3. `scraper/audit.py` fetches and measures business websites using the guarded
   HTTP client in `scraper/http_client.py`. It also records contact addresses
   the page itself publishes via `scraper/contact.py`; a missing address is
   left blank rather than guessed.
4. `scraper/scoring.py` classifies and scores the measured leads;
   `scraper/pipeline.py` coordinates the stages and writes `leads.csv`.
5. `parse_leads.py` revalidates available site evidence and renders the
   outreach queue in `leads_dashboard.md`.

`scraper/config.py` owns markets, trade searches, runtime limits, and
environment configuration. Provider requests are intentionally sequential;
website audits are concurrent. `data/cache/` is local cache state.

`sites/` is a separate kit for generated business-site previews. Shared layout
and tokens live under `sites/core/`; themes are reusable styles; each site
directory contains its own configuration and page. The mock-up checker
enforces distinct rules for client `mockup` pages and the public `studio`
site.

## Project-specific conventions

- Outreach copy must be supported by collected or freshly measured fields.
  Do not infer website defects, lost revenue, customer complaints, or contact
  channels that the data does not establish. The `send`, `verify`, `expand`,
  `hold`, and `drop` queue states represent distinct evidence/readiness levels.
- Preserve lead provenance and confidence fields when adding a provider or
  changing deduplication. Missing OpenStreetMap fields mean unknown, not proof
  that a business lacks that attribute.
- Keep outbound website checks behind `scraper/http_client.py`; its SSRF
  protections, redirect limits, retries, and body limits are intentional.
- Keep metered provider calls sequential and website auditing bounded by the
  configured concurrency and timeout.
- Keep site preview facts separate from placeholder `sample` content. Mock-ups
  are nonfunctional demonstrations; do not add form submission, analytics, or
  persistence to them. Maintain the `kind`-specific guarantees in
  `sites/check-mockup.mjs`.
- Treat `leads.csv`, the lead ledger, `.env`, and cache files as local data, not
  committed fixtures.
