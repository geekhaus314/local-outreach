# local-outreach

Finds local St. Louis County businesses that need a website, proves *why* they
need one, and drafts the outreach.

The differentiator is not the lead list. Anyone can pull business names off a
map. This tool fetches each business's actual website and measures it, so every
sentence of a pitch is a fact you can defend: their domain is parked, their page
has no mobile layout, they have no way to book online, their newest copyright
year is 2018. If a prospect replies *"which client told you that?"* you have the
answer.

---

## Quick start

```bash
pip install -r requirements.txt

# Free, no signup, works immediately (thin data -- see caveat below)
python3 run_scraper.py --provider osm

# Real volume: add a Google Places key first (see Data sources)
cp .env.example .env    # then paste your key
python3 run_scraper.py

# Turn leads into an outreach queue
python3 parse_leads.py            # re-checks every site, then writes the queue
python3 parse_leads.py --no-check  # use the stored CSV facts, no network
```

---

## How the pipeline works

```
providers  ->  dedupe  ->  audit  ->  score  ->  leads.csv  ->  parse_leads.py
(harvest)     (merge)    (fetch    (rank)      (CSV)          (queue)
                          + measure)
```

1. **Harvest** - `scraper/providers/` pulls businesses from Google Places (New)
   and/or OpenStreetMap's Overpass API.
2. **Dedupe** - the same shop appears once per market and once per trade query.
   `scraper/dedupe.py` merges on domain, then phone, then name+street.
3. **Audit** - every distinct website is fetched once and measured.
   `scraper/audit.py` runs ~20 checks and returns a 0-100 health score.
4. **Score** - `scraper/scoring.py` combines *need* (how broken things are) with
   *value* (can they afford this) into a 0-100 opportunity score.
5. **Queue** - `parse_leads.py` re-checks each site and sorts the leads into
   `send` / `verify` / `expand` / `hold` / `drop`, with copy for the ones worth
   contacting. A lead is only `send` when it has a reachable channel, one
   verified fact, and a message that survives being checked. It re-fetches sites
   by default, because a redirect that pointed somewhere else last week points
   somewhere else again this week.

---

## Classification buckets

The first thing the pipeline decides is *what kind* of problem they have,
because "you have no website" and "your website is a 2011 blog" are completely
different pitches.

| Bucket | Meaning | Pitch angle |
|---|---|---|
| `NO_PRESENCE` | No website on their listing at all | "You deserve to show up in search" |
| `DEAD_SITE` | Domain parked, broken, or redirecting to another business | "You're paying for a domain you don't use" |
| `SOCIAL_ONLY` | A Facebook/Instagram page is the only presence | "You can't rank or track anything" |
| `MARKETPLACE_ONLY` | Yelp/Nextdoor/GoDaddy-site listing, not an owned site | "That listing isn't yours" |
| `NEEDS_REHAB` | Live site, measurably broken | Specific, itemised problems |
| `HAS_DECENT_SITE` | Site is fine | **Skipped** - no pitch |

---

## What the auditor checks

Concrete and checkable, in rough order of how much they cost a business:

- domain resolves, HTTP status, cross-domain redirects
- parked / for-sale / "coming soon" placeholder detection
- HTTPS, and whether a secure connection ends up back on `http://`
- mobile viewport tag
- contact paths: `tel:`, `mailto:`, `<form>`, and published email addresses
- online booking / scheduling (and the absence of it)
- page title, meta description, Open Graph
- CMS and version age (WordPress EOL detection)
- legacy stack markers (old jQuery, etc.) vs modern frameworks
- server response time
- thin content, leftover `lorem ipsum`
- mixed content and forms posting over plain HTTP
- analytics presence
- stale copyright years
- reviews / trust widgets
- insecure asset references

Each finding carries a penalty, a human-readable detail string, and a `quote` --
a sentence already phrased for a prospect, which is what keeps outreach honest.

---

## Scoring

`opportunity = need * 0.62 + value * 0.38`

**Need** starts from the bucket and folds in the audit's health score. A domain
redirecting to someone else's business scores higher than a merely ugly site,
because the pitch is unarguable.

**Value** is about whether they'll actually pay:

- industry ticket size (roofing and HVAC outrank retail)
- rating and review count -- a 4.8-star shop with 400 reviews has both money and
  a reason to care, while a new listing with 3 reviews cannot buy anything
- whether a phone number is listed

The target profile is a **strong reputation with a weak web presence**: proven
they can pay, currently losing jobs to competitors who rank.

---

## Data sources

### Google Places API (New) -- primary

```bash
cp .env.example .env
# set GOOGLE_PLACES_API_KEY
```

1. [Cloud Console](https://console.cloud.google.com/) -> new project
2. Enable **Places API (New)**
3. Create a key, restricted to that API

New projects get monthly credit that covers local prospecting comfortably. Set
`MAX_QUERIES` to cap spend; each query costs one page request.

This is the sanctioned route. Scraping `google.com/maps` HTML violates Google's
ToS, gets IP-blocked quickly, and breaks without warning. The API is also the
only source that gives you `websiteUri` *and* `rating`/`userRatingCount`
together -- the combination the scoring model is built on.

### OpenStreetMap / Overpass -- free fallback

No key, no cost, runs today. **Two real caveats:**

1. **Coverage is thin.** Testing found 9 named commercial records in all of
   Florissant, and ~1,300 across the whole St. Louis region.
2. **A missing `website` tag means "nobody added it", not "they have no
   website."** OSM leads are marked `low_confidence` in the CSV and the report
   says so. Verify before contacting.

Useful as a free seed and as a sanity check on the Google key. Not a lead list.

---

## Usage

```bash
# Everything configured
python3 run_scraper.py

# One market
python3 run_scraper.py --market Florissant --market Bridgeton

# Focus on trades instead of restaurants
python3 run_scraper.py --industries Plumbing,Roofing,Automotive,HVAC

# One trade, one market, no API key
python3 run_scraper.py --provider osm --trade plumber --market Florissant

# Cap Places API spend
python3 run_scraper.py --max-queries 5 --max-pages 2

# Fast triage, skip the live audits
python3 run_scraper.py --no-audit

# Force a fresh harvest, ignoring the cache
python3 run_scraper.py --no-cache

# See what is configured
python3 run_scraper.py --list-markets
```

### Config

Everything lives in `scraper/config.py`; secrets come from `.env` (gitignored).
See `.env.example`. Useful knobs:

| Env var | Default | Notes |
|---|---|---|
| `GOOGLE_PLACES_API_KEY` | - | Without it, OSM only |
| `MAX_QUERIES` | `0` | Hard cap on Places queries per run |
| `PLACES_MAX_PAGES` | `3` | Google caps this at 3 |
| `AUDIT_CONCURRENCY` | `6` | Parallel site fetches |
| `AUDIT_TIMEOUT` | `12` | Seconds per site |
| `SCRAPER_CACHE_TTL_HOURS` | `24` | Disk cache lifetime |
| `SCRAPER_USE_CACHE` | `1` | `0` disables |
| `AUDIT_ENABLED` | `1` | `0` skips live audits |

Add markets with `Market(name, bbox, region)` in `config.py`. Add trades with
`(query, industry, osm_tag)` in `TRADES`.

---

## Output

`leads.csv` (gitignored -- it is regenerated and contains business contact
details):

| Column | Meaning |
|---|---|
| `Classification` | Which bucket |
| `Email` | Address the business published on its own site; blank if none |
| `Opportunity Score` | 0-100, primary sort key |
| `Need Score` / `Value Score` | The two components |
| `Site Health` | 0-100 from the audit, blank if no site |
| `Rating` / `Review Count` | Reputation |
| `Audit Summary` | One-line human summary |
| `Pitch Facts` | Pre-verified evidence, `|`-separated |
| `Low Confidence` | `yes` for OSM-only leads -- verify first |

`leads_dashboard.md` -- the outreach queue. Every lead is in one of five states,
carrying the measured fact the message hangs on, the channel, the copy, what to
say if they reply, and an explicit list of what not to say. Email is preferred
over text when the site published an address, because a cold email does not
interrupt the way a cold call does; the address is only ever one the business
put on its own site (`mailto:`, visible text, or a spelled-out
`info [at] domain [dot] com`), never guessed or bought. A costed time budget
sits at the top, and a drop list exists so nobody re-derives the same conclusion
next week.

### Optional: import one lead into the private pwn4g3 CRM

Lead harvesting and the outreach queue remain local. To copy a single reviewed
CSV record into the pwn4g3 D1 lead desk, first list the row numbers, then select
one. The importer previews the exact business and evidence, prompts for
confirmation, and does not send outreach:

```bash
python3 export_to_crm.py --list
python3 export_to_crm.py --index 3
```

Set `PWN4G3_ADMIN_TOKEN` in `.env` or the shell before confirming an import.
The pwn4g3 admin API additionally requires the request's source IP to be on
its private allowlist; an unauthorized network receives 403. Use `--yes` only
when the selected CSV row has already been reviewed:

```bash
python3 export_to_crm.py --index 3 --yes
```

Each invocation sends exactly one lead and its measured evidence. There is no
automatic sync, bulk-import operation, or message-sending path. Use the CRM
status workflow to manage the imported record; local CSV and generated queue
files remain gitignored. Records marked as sourced from Google Maps HTML
scraping are refused; use the sanctioned Places API or OpenStreetMap source.

The message is generated from harvested data only. Three earlier drafts were
unsendable — one told an OpenStreetMap lead "no website is attached to your
Google Business Profile", which has no such thing; two told a prospect their site
had no analytics and a short meta description, both of which were false; and one
was written for a business with no phone and no email. Hence the `verify` and
`hold` states: a lead that cannot be checked is not ready to text.

---

## Notes on the outreach copy

Pitches are generated from harvested data only. Earlier versions of this project
opened plumbing leads with an invented line about a customer complaining they
couldn't get a callback. Fabricated evidence is not a sales tactic, it is a
liability: a prospect will ask you to prove it and the deal dies. The generator
here will not emit a claim that isn't backed by a field in the CSV.

`scraper/providers/google_places.py` exposes `reviews_summary()`, which pulls real
recent review text. If you want "a customer said they couldn't find you"
evidence, that is the legitimate way to get it.

---

## Legal and etiquette

- Only public business information is collected (name, address, published phone,
  rating, whether a website exists).
- Google Places is used via its official API under its ToS. The Google Maps HTML
  endpoints are not scraped.
- Overpass is queried politely: chunked, retried with backoff, disk-cached, and
  sequential rather than concurrent.
- Outbound fetches are SSRF-guarded (`scraper/http_client.py` rejects private,
  loopback and link-local targets, caps redirects and body size) because the URLs
  being audited come from third-party data.
- Cold email and SMS carry legal weight: CAN-SPAM applies to B2B email in the
  US, and some states restrict SMS. Identify yourself, include a real opt-out,
  and honour it immediately. This tool does not send anything -- that part is
  your call and your compliance responsibility.
- Local business contact details are personal-ish data in some jurisdictions.
  Keep `leads.csv` local; it is gitignored for a reason.

---

## Archived design kit (`sites/`)

The legacy static design kit and its checks are documented in `sites/README.md`.
It is kept for migration reference only; nothing in `sites/` is built or deployed, and the
production app is in `web/`.

---

## Layout

```
scraper/
  config.py              markets, trades, blocklists, env config
  http_client.py         retries, caching, SSRF guards, page fetch
  audit.py               site auditor -> health + findings
  surfaces.py            robots/sitemap/ads.txt/... improvements, zero penalty
  scoring.py             need/value/opportunity, classification
  dedupe.py              cross-source, cross-market merging
  pipeline.py            orchestration + CSV/JSON output
  providers/
    base.py              RawLead model
    google_places.py     primary source
    overpass.py          free fallback
sites/                   archived design kit (see sites/README.md)
run_scraper.py           CLI
parse_leads.py           leads.csv -> leads_dashboard.md
tests/test_scraper.py    81 tests, no network
```
