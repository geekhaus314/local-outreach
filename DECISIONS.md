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
