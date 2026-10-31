# State — webrehabstl.com

Updated: 2026-10-31
Machine-readable copy: `state.json`

## Live
- Site: https://webrehabstl.com (Cloudflare Pages, project `stlouiswebmaster`)
- Database: D1 `local-outreach`
- Checkup: `POST /api/checkup` → D1 booking + email to hello@webrehabstl.com
- Last deployed commit: `82eddd9`

## In progress (not deployed yet)
- Landing rebuild: sticky header, hero reveal, real-check ticker, interactive audit demo, stat band, problem cards, process steps
- Agency dark OKLCH palette and "What gets replaced" comparison table
- Agency-host `robots.txt`, `sitemap.xml`, `/.well-known/security.txt`, `ProfessionalService` JSON-LD
- Checkup form: honeypot field, 5-per-hour IP rate limit, bait-accepted bot response

## What I handle
- Site design, copy, components
- Checkup funnel: validation, persistence, notification email
- SEO and trust surfaces for the agency host
- Admin outreach tooling: import, scoring, pitch generation
- Build, tests, `slag verify`, `slag gate`, git commits and pushes

## What only you can do
1. Publish the four Resend DNS records in Cloudflare (DKIM TXT, send MX, send SPF TXT, `rsend` CNAME)
2. Turn on Email Routing for `hello@` and `info@` → `Geekhaus314@proton.me`
3. Rotate the Resend API key that was pasted in chat
4. Send the `/work` client URL list
5. Send `/designs` package names, prices, and buy flow (Stripe or request form)
6. Confirm dark edge palette vs the lighter current look

## Blocked on facts
- `/work` — needs real client URLs and permission to name them
- `/designs` — needs real package names and prices
- Any pricing UI — no invented prices

## Next
1. Finish, verify, and push Phase 1
2. Smoke-test the live checkup endpoint once DNS/email are set
3. Build `/work` and `/designs` when the facts arrive
4. Port the Python pitch and urgency logic into the admin portal
