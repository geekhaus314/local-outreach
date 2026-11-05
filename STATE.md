# State — webrehabstl.com

Updated: 2026-11-05
Machine-readable copy: `state.json`

## Live
- Site: https://webrehabstl.com (Cloudflare Pages, project `stlouiswebmaster`)
- Database: D1 `local-outreach`
- Checkup: `POST /api/checkup` persists to D1; email secrets are set, but sending is blocked until `webrehabstl.com` is verified in Resend
- Last deployed commit: `82eddd9`

## Built / shipping
- Agency overhaul on master (`8a3725e`): `/work`, `/designs`, `/services`, chrome + palettes, quote + persist-first checkup
- Densify pass (pending push): form-in-hero, cut sparse sections, contractor-plain copy, named typed work exports
- SEO: title/meta/OG/Twitter/geo, ProfessionalService + FAQ + Service JSON-LD, expanded sitemap, robots, security.txt
- Tests for agency content consistency and rate-limiter behavior; `slag verify` + `slag gate` green

## Pages secrets (production)
- `RESEND_API_KEY` — set 2026-11-05
- `BOOKING_FROM_EMAIL` — set to `Web Rehab STL <hello@webrehabstl.com>`

## What I handle
- Site design, copy, components
- Checkup and quote funnels: validation, persistence, notification email
- SEO and trust surfaces for the agency host
- Admin outreach tooling: import, scoring, pitch generation
- Build, tests, `slag verify`, `slag gate`, git commits and pushes

## What only you can do
1. Add the four Resend DNS records for `webrehabstl.com` in Cloudflare (the Resend domain status is currently `failed`)
2. Trigger Resend domain verification once the records propagate
3. Turn on Email Routing for `hello@` and `info@` → `Geekhaus314@proton.me`
4. Rotate the Resend API key after verification (it was pasted in chat), then update the `RESEND_API_KEY` secret
5. Review the local build, both palettes, OG image, and copy; approve commit/push

## Blocked on facts
- Production email delivery: `webrehabstl.com` is not verified in Resend (missing DNS records).
- Deployment: waiting for Jake's review and go-ahead.

## Next
1. Add Resend DNS records and verify the domain
2. Smoke-test checkup + quote after densify deploy
3. Port the Python pitch and urgency logic into the admin portal
