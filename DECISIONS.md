# Decisions

## 2026-10-19 — De-AI the shared kit and build the first paper mock-up

**What:** Removed the generated-page fingerprint from `sites/core` (pill radii,
gradient sheen, hover lift, glow shadows, hero wash, backdrop blur, pulsing
dots, reveal-on-scroll, striped placeholders), added the `plumbing-paper` token
preset, and built `sites/smp-plumbing` on it. `check-mockup.mjs` now fails the
shared kit on gradients/shadows/pill radii and warns on page stylesheets.
**Why:** The core stylesheet was where the tells lived, so fixing one page would
have left them on every future one. Paper + serif was chosen over another dark
palette because the existing dark plumbing preset already owns "emergency at
9pm"; the pitch needs a direction that does not look like a SaaS landing page.
A page-local `page.css` was added because the theme contract is tokens only.
**Watch:** `aplus-auto/shop.css` still triggers the three kit warnings and needs
migrating. The SMP target is unverified: call the number before delivery. Also
fixed while building: the shared `.ruled-row` mobile grid put the title in a
2rem track and overlapped every service on a phone.

## 2026-10-19 — Published email becomes a first-class outreach channel

**What:** `scraper/audit.py` now runs `scraper/contact.extract` over the page it
already fetched; the address lands in `AuditResult.evidence["email"]`, a new
`Email` CSV column, and the queue's `Lead`. `parse_leads.py` treats that address
as a channel and prefers email copy (with a reply-to-unsubscribe line) over cold
text.
**Why:** The lead list was phone-only on 985 of 1,165 rows, but a cold call
interrupts where a CAN-SPAM email does not. The address is taken only from the
business's own published markup, so nothing is guessed. Considered scraping a
second `/contact` page, but that multiplies live fetches across the whole queue
for a marginal yield; homepage extraction was the honest, cheap first step.
**Watch:** Three false-positive classes were found while wiring this and are now
pinned by tests: "at" inside `dataLayer`/`urgentcarelocations`, a payment
processor's address on the prospect's page (off-site corporate mailboxes are
dropped, free mailboxes kept), and a viewport tag without `width=device-width`
being called a missing tag. `export_to_crm.py` does not yet carry the new column.

## 2026-10-20 — Replace hardcoded mockups with a prospect-driven engine

**What:** Added `web/`, a SvelteKit 5 app that reads `LocalOutreachProspect`
records, generates clinic content, classifies a theme from the industry, and
routes tenants by hostname. Booking posts through a server proxy.
**Why:** Hardcoding one client in product code does not scale and hid myhairloss
details in every future preview. A pure generator keeps the scraped record as
the only source and lets the same routes serve every prospect; SvelteKit was
chosen over a static template because host routing and the booking proxy need a
server. Theme classification uses industry keywords rather than a manual field
so new prospects do not need hand-tuning.
**Watch:** Booking returns 503 until `BOOKING_WEBHOOK_URL` and `BOOKING_API_KEY`
are bound; that is intentional, not a placeholder. `web/prospects/*.json` are
real business records. Preview pages are noindex by default and only the
`?prospect=` selector can switch tenants locally. Add a new prospect as JSON,
then run check/test/build.

## 2026-10-20 — Adopt Slag guardrails as the completion gate
**What:** Installed the local `slag` CLI, exposed `/slag-*` globally, added the Slag MCP server, wired `typecheck`/`test`/`build` into `slag.config.json`, and ignored the retired `sites/` kit. Moved the archived kit docs to `sites/README.md`.
**Why:** The guardrail is only real if the audit sees the app and fails on evidence, not vibes. `sites/` is explicitly not built or deployed, so auditing it created noise instead of protecting product code.
**Watch:** Audit is down from 27 errors to 4. The remaining `fact-drift` errors are structural: the deployable app is nested in `web/`, D1 is used via Worker bindings with no driver dependency, Cloudflare Access lives at the edge rather than in app auth code, and the schema exists only as SQL migrations. `slag gate` will fail until those are either implemented or the facts are revised with Jake.

## 2026-10-22 — White-label freelance machine: multi-vertical prospects + navigable admin + scraper wiring
**What:** Seeded 19 real prospect records from `leads.csv` into `web/prospects/` spanning HVAC, roofing, restaurant, automotive, plumbing, dental, veterinary, retail, pest, pool, fitness, electrical, locksmith, landscaping, moving, painting, construction, window, and salon verticals. Rewrote `web/src/routes/admin/+page.svelte` as a tabbed dashboard with Pipeline, Prospects, Audits, Pitches, Previews, Bookings, and Job Runs tabs — full CRUD over every entity from the `admin.console` fact. Added `web/src/routes/api/admin/import-leads/` (POST imports all 1,165 CSV leads into D1) and `web/src/routes/api/admin/scrape/` (POST triggers `run_scraper.py`). Added `web/wrangler.toml` binding D1 as `DB` and applied migrations locally. Imported all 1,165 leads into local D1 with zero errors.
**Why:** The engine was running on a single prospect (`royal-kutz`) and the admin only showed prospects + bookings. To serve "any business" and "expand ALOT," every vertical needs a navigable record, pitch, and mockup — all reachable from one admin portal. The scraper must be triggerable from the same UI so the pipeline is scraper → D1 → admin → pitch → mockup, not disconnected tools.
**Watch:** `web/` is untracked in git — nothing under it appears in `git log`/`git diff`. The dev server runs on port 5175 (5173/5174 were in use). Booking returns 503 until `BOOKING_WEBHOOK_URL`/`BOOKING_API_KEY` are bound. `slag gate` still fails on structural fact-drift (nested app root, D1 binding without driver dep, edge-only Access auth, migrations-only schema) — revise facts or implement before claiming done.

## 2026-10-22 — Per-vertical theme system: every category gets its own design language
**What:** Replaced the 3 shared generic themes (`clinical-trust`, `premium-luxury`, `modern-wellness`) with 13 vertical-specific themes, each a complete design system with distinct typography, color, geometry, shadow, and chrome. Built `web/src/lib/data/vertical-themes.ts` (theme token definitions per vertical), rewrote `web/src/app.css` with vanilla CSS `[data-theme]` blocks (zero dependencies, zero shared startup tropes), rewrote `web/src/lib/data/themes.ts` to expose vertical themes, updated `web/src/lib/content/engine.ts` to resolve theme via `verticalThemeForKind(kind)`, updated `web/src/lib/verticals/meta.ts` to map each vertical to its theme ID, updated `web/src/hooks.server.ts` to set `data-theme` on the HTML element per tenant, and updated `web/src/app.html` JS bootstrap for the new theme names. Hair restoration → `hair-restoration-clinical`, SMP → `smp-ink`, laser → `laser-precision`, salon → `salon-wellness`, restaurant → `restaurant-luxury`, automotive → `automotive-industrial`, roofing → `roofing-storm`, hvac → `hvac-service`, plumbing → `plumbing-emergency`, electrical → `electrical-circuit`, dental → `dental-clinical`, veterinary → `veterinary-warm`, retail → `retail-boutique`, unmatched → `general-honest`.
**Why:** Three shared themes read as AI-slop cookie-cutter. Business owners buying a $1,200 site need their category to look distinct — a hair transplant clinic should not look like a roofing company or a restaurant. Each vertical theme is a complete design system, not just a color swap. Vanilla CSS is a hard requirement; no Tailwind, no shared component library, no gradient sheens, no pill radii, no hover lift.
**Watch:** Old theme names (`clinical-trust`, `premium-luxury`, `modern-wellness`) no longer exist — any prospect record or DB row storing them will fall back to `classifyProspectTheme` which assigns the correct vertical theme automatically. Tests updated to reference new theme names.

## 2026-10-30 — Swap raw fetch for the official Resend SDK; quiet slag audit
**What:** Replaced hand-rolled `fetch('https://api.resend.com/emails')` in `/api/checkup` with the official `resend` npm SDK (added to `web/package.json`), and cleaned up README wording ("bigint" typo → "preview site") plus three slag suppressions.
**Why:** slag flagged the README's Resend claim as claim-without-implementation because it audits dependency declarations against the root directory only (the app is nested in `web/`); shipping the SDK rather than suppressing the claim makes the doc claims verifiable. Two suppressions remain (SDK location note + the auditor's own "coming soon" detection phrase in audit.ts) — both non-security rules with on-line reasons.
**Watch:** Nothing functional changed, but note `npm warn install-scripts` on install ( normale for this setup). Re-run `npx slag verify` + `npx slag gate` before any future claim of done.
