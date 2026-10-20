# SMP Plumbing Company — mock-up specification

Status: **built 2026-10-19, pending owner verification and Jake's review of the
direction.** `node sites/check-mockup.mjs` and `node sites/build-all.mjs` pass.
Prepared: 2026-10-19.
Target source: `leads.csv` (overpass node `node/11397613341`), re-audited live.

---

## 1. Why this target

SMP Plumbing is the clearest "most in need" lead in the current list: the web
address on its record does not serve the business at all.

Measured with `scraper/audit.py` on 2026-10-19:

| Field | Value |
|---|---|
| Name | SMP Plumbing Company |
| Trade | Plumbing |
| Phone | (314) 677-4763 |
| Address | 3275 Lake Ave, Bridgeton, MO 63044 |
| Listed domain | `smpplumbingcompany.com` |
| DNS | resolves |
| HTTP | 301 redirect |
| Final page | no title, no body text |
| Redirect chain (auditor stopped at 6 hops) | `firstsafetysunshinedrivingschool.com` → `andysonwell.com` → `wellschristmasparade.com` → `lmaseconference.com` → `noraswarriors.com` → `kirastoreparis.com` |
| Stored need / value / opportunity | 97 / 58 / 82 |

**The one fact the pitch rests on:** typing `smpplumbingcompany.com` sends a
visitor through a chain of unrelated sites and lands on a page that is not SMP
Plumbing. That is checkable in a browser in ten seconds.

**Business existence check:** several directories (Fyple, CGMIMM, ExactSeek,
BizHWY, Ailoq) repeat the same address and phone; one lists "Year Established
2001". Those are directory claims, not the business's own words. Confirm before
delivery.

**Known weakness, stated up front:** there is no rating or review count in the
record, and the source is OpenStreetMap, so `Low Confidence = yes`. This target
wins on need, not on proven ability to pay. If the phone is disconnected or the
shop has closed, drop it and take the next name from the queue.

**Channel:** phone only. There is no site to mine an email from, and no email is
published in the directories checked. Do not invent one.

---

## 2. What we will not claim

These are prohibited in the page copy and in the delivery message:

- That SMP has no website. They have a domain; it redirects. The accurate claim
  is that the address does not reach their business.
- That they are paying for the domain. Registration status was not checked.
- Any review count, star rating, years-in-business number, licence number,
  response time, price, guarantee, or same-day rate. None are verified.
- Any named service beyond "plumbing". No water heaters, drains, sewer cameras,
  remodels, or emergency service unless the owner confirms them.
- 24/7 or after-hours availability. Directory hours contradict each other
  (9am–9pm in one, "open 24 hours" in another).

Anything invented for layout lives under `sample:` in `site.config.js` and is
rendered with the existing sample marker. That is the boundary the kit already
enforces; this page does not get an exception.

---

## 3. The page

One page. No nav bar full of fake sections. The reader is on a phone, possibly
in a driveway, and needs three answers: who is this, what do they do, how do I
reach them.

### Section order

1. **Header** — wordmark left, phone number right. No pill button, no nav links
   that scroll to invented content. Sticky with a single hairline rule.
2. **Hero** — asymmetric 7/5 grid.
   - Left: small mono location line `BRIDGETON, MO · PLUMBING`; H1 (one idea,
     two lines maximum); one-sentence subhead; the phone number set large in
     mono; a secondary text link to the request section.
   - Right: a photo frame with a plain caption: "Your crew and van go here."
     No stock photo, no emoji, no illustration of a wrench.
3. **What we do** — three to six rows, separated by rules, numbered `01`–`06`.
   Service names are `sample:` pending owner confirmation. No cards, no icons in
   rounded squares, no hover lift.
4. **How it works** — three steps: call, quote, work. Marked `sample:`.
5. **Where we work** — a plain list of municipalities. `Bridgeton` is a fact
   (it is in the address). The rest are `sample:` until confirmed.
6. **Straight answers** — a definition list with blanks the owner fills in:
   hours, licence, years, service area, guarantee. Rendered as `—`, not invented.
   This section exists so the page can be honest and still look finished.
7. **Request** — phone first, address second, then the demo form. The form is a
   performance of a form: no endpoint, no `fetch`, no storage. On submit it says
   plainly that nothing was sent and gives the phone number.
8. **Footer** — name, address, phone, "Design mock-up by Jake Viefhaus — not a
   live website."

### Copy rules

- Second person, short sentences, no exclamation marks.
- H1 states a job, not a slogan. Draft: `Plumbing that answers the phone.`
  (sample; the owner can replace it).
- The page does not mention the redirect. The redirect is the delivery message's
  job. A mock-up that argues with the owner before showing him the work is a
  pitch deck, not a site.
- No "trusted by", no "since 2001" until confirmed, no review quotes.

---

## 4. Visual system (the anti-AI pass)

The current `sites/core` kit contains the exact tells to remove: pill buttons,
hover sheen, glow-pulse dots, gradient cards, gradient brand marks, a radial hero
wash, backdrop blur, and reveal-on-scroll. This mock-up uses a revised kit.

### Direction

A light, print-like page for an established trade: warm paper, dark ink, one
oxide-red accent, one deep slate-green secondary. Editorial serif for display,
system sans for body, monospace for numbers and labels. Flat surfaces, hairline
rules, square corners. It should look like a page a local newspaper would run,
not a SaaS landing page.

### Tokens

```css
--c-bg:        #f3eee4;  /* warm paper, not white */
--c-bg-2:      #eae2d4;
--c-surface:   #f3eee4;
--c-line:      #c9bfae;
--c-text:      #17130f;
--c-muted:     #5f574c;
--c-accent:    #b23a1f;  /* oxide red; phone + rule marks only */
--c-accent-ink:#f3eee4;
--c-accent-2:  #224a46;  /* deep slate green, used once */

--r-sm: 0px;
--r-md: 0px;
--r-lg: 0px;
--r-pill: 0px;

--font-display: "Iowan Old Style", "Palatino Linotype", Palatino,
                "Book Antiqua", Georgia, serif;
--font-sans: "Helvetica Neue", Helvetica, Arial, system-ui, sans-serif;
--font-mono: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;

--t-3xl: clamp(2.8rem, 1.4rem + 6vw, 6.4rem);
--t-2xl: clamp(1.9rem, 1.4rem + 2.2vw, 3.2rem);
--t-base: clamp(1rem, 0.96rem + 0.2vw, 1.12rem);
```

### Hard bans

| Banned | Replace with |
|---|---|
| `border-radius: 999px` / `9999px` / `100vmax` | `0` on buttons, chips, cards |
| `linear-gradient` / `radial-gradient` anywhere | flat colour |
| `box-shadow` with colour or blur | `border: 1px solid` or `0 1px 0` hairline |
| `filter: drop-shadow`, glow rings | nothing |
| `backdrop-filter` | opaque header |
| pulsing/status dots | static rule or label |
| emoji as image/icon/placeholder | empty photo frame or typographic mark |
| reveal-on-scroll on body copy | none; content is visible at load |
| uppercase eyebrow + accent gradient | one mono label, sentence case |
| rounded-square icon cards | numbered rows |
| fake stats / review quotes | blanks (`—`) or `sample:` |

Motion is limited to a 120ms colour change on links and buttons. No transforms,
no hover lift. `prefers-reduced-motion` gets the same page with zero transitions.

### Layout

- Max width `1180px`; gutter `clamp(20px, 4vw, 48px)`.
- 12-column grid; hero `7 / 5`; services single column with a right-aligned
  number; contact `5 / 7`.
- Breakpoints: `640px`, `900px`, `1180px`. Hero stacks below `900px`, and the
  phone number becomes full-width and thumb-sized.
- Vertical rhythm from `--s-1` … `--s-8` only; no arbitrary margins.
- Photo frames have a fixed aspect ratio (`4/3`) so CLS is zero.

---

## 5. Technical build

```
sites/smp-plumbing/
  SPEC.md            this file
  site.config.js     facts / sample split, observedDomain + observedDetail
  index.html         the page
  page.css           page-local layout (the theme only carries tokens)
sites/themes/
  plumbing-paper.css the token overrides above
sites/core/
  site.css           de-AI pass: removed sheen, lift, gradients, glow, blur,
                     reveal motion, and the mobile ruled-row overlap bug
  site.js            registered plumbing-paper; added the steps list builder
sites/check-mockup.mjs
                     banned-pattern scan of the shared kit and page styles
```

- **No framework, no build step, no external origin.** The delivered page is
  static HTML/CSS plus the existing `site.js` for config binding and the demo
  form. If a component abstraction is wanted later, Astro is acceptable; it is
  not needed for one page.
- `site.config.js` must contain:
  - `facts`: name, phone, phoneHref, address, locality, title, description,
    `observedDomain`, `observedTitle`, `observedDetail`.
  - `sample`: headline, headlineAccent, subhead, services, serviceArea, steps,
    `yearsInBusiness: null`, `hours: null`, `licence: null`.
  - `mockup: true`, `showTradeSwitcher: false`.
- All variable content binds via `data-fact` / `data-sample`; no name or phone
  literal in markup except the one `tel:` href rule already enforced.
- The form has `action=""` and `method="post"` is not used. `site.js` intercepts
  submit, prevents default, and swaps in the "nothing was sent" message.
- No analytics, no cookies, no storage, no network calls.

### `check-mockup.mjs` additions

Fail a mock-up when any of these appear in its HTML or linked theme:

```js
/border-radius:\s*(999|9999|100vmax)/i
/linear-gradient|radial-gradient/i
/box-shadow:\s*(?!0\s+1px\s+0)/i
/filter:\s*drop-shadow|backdrop-filter/i
/dot-pulse|sheen|data-reveal/i        // warning, not failure, for existing pages
/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u   // emoji
```

The rule is enforced for `kind: 'mockup'` pages; existing mock-ups get a warning
until they are migrated, so this spec does not break the current host.

---

## 6. Acceptance criteria

- [ ] `node sites/check-mockup.mjs` passes for `smp-plumbing`.
- [ ] `node sites/build-all.mjs` builds it into `dist/mockups/smp-plumbing/`.
- [ ] No banned pattern from §4 appears in the page or its theme.
- [ ] No `fetch`, `XMLHttpRequest`, storage, cookie, or analytics in the page.
- [ ] The form cannot send; the submit state says so and shows the phone number.
- [ ] Page is readable at 320px, 390px, 768px, 1280px.
- [ ] All text meets WCAG AA contrast; focus rings visible; form fields labelled.
- [ ] Phone link works; address matches the record.
- [ ] No invented number, review, service, hour, or guarantee is presented as
      fact. Every `sample:` string renders with the sample marker.
- [ ] HTML under 40KB, CSS under 30KB, no external requests.
- [ ] Screenshot at 390px and 1280px reviewed before delivery.

---

## 7. Delivery

1. **Verify the owner first.** Call (314) 677-4763. Confirm it is SMP Plumbing,
   that they still operate, and who answers. If not, stop; do not send.
2. Send the mock-up link with one sentence: `smpplumbingcompany.com` currently
   redirects through unrelated sites, and here is what a site on that domain
   could look like. Do not attach a price until they reply.
3. If they answer, ask for hours, services, service area, licence, and photos.
   Those replace the `sample:` block; the layout does not change.
4. Do not put the mock-up on the public studio host. It ships under
   `dist/mockups/` with `noindex` and the demo bar, like every other pitch.

---

## 8. Open questions for Jake

1. Confirm the business is active before any build time is spent.
2. Is the `plumbing-paper` direction right, or do you want this to be the
   template that replaces the current dark plumbing preset everywhere?
3. Do you want the straight-answers blanks, or should the page ship without
   that section until the owner provides the details?
