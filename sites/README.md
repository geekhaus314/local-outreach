# Archived design kit (`sites/`)

> Archived reference only. Nothing in this folder is built, deployed or used by the production app.

## What this is

A lead is only worth something once the prospect can see what you mean. `sites/`
is the design kit for showing them: one token system, five presets, and a page
per business built from a config rather than hand-edited.

```
sites/
  core/
    tokens.css        design tokens: colour, fluid type, space, motion
    site.css          layout + components, every value a token
    sample.css        the invented-content guard (see below)
    site.js           runtime: config, theme, motion, reveal, mock-up seal
    estimator.js      the project estimator (studio pages only)
  themes/
    plumbing.css  roofing.css  hvac.css  photography.css  studio.css
  st-charles-plumbing/   a client mock-up
  site-rehab-stl/        historical migration reference; not deployed
  check-mockup.mjs       the guard
```

Check every page with:

```
node sites/check-mockup.mjs
```

### Mock-up notice

**These are design mock-ups, not live websites.** Everything below the demo bar
performs, and none of it works. Nothing on a mock-up sends, saves, stores or
measures anything, and the contact form is a performance of a form rather than a
form — there is no endpoint, no `fetch` and no storage anywhere in `sites/`.

Anything marked `sample` is placeholder copy chosen to show the layout. It is not
a claim about the business in question. Before showing one to anyone, read
`core/sample.css`: the reason the distinction is enforced rather than trusted is
that a prospect cannot tell which numbers are real and which were filler, and
will not ask, because asking means admitting he does not know his own service
area.

`st-charles-plumbing` uses real public details for a real business. The
observation in its hero — that the domain serves a different company's blog — is
measured, not staged. Everything in its `sample:` block is invented.

### Two kinds of page

`check-mockup.mjs` holds the two kinds to opposite rules, and a page declares
which it is with `kind:` in its config.

**`kind: 'mockup'`** — a pitch artifact for someone else's business. Carries
`noindex` so it can never surface in a search for a real business, a fixed demo
bar, a `facts`/`sample` split, and no external origins.

**`kind: 'studio'`** — the old static public-site snapshot. The canonical
public site is now the Next.js application in the separate `site-rehab-stl`
repository. This snapshot remains for migration reference only and is no longer
built or deployed from this repository.

`node sites/build-all.mjs` builds only the mock-up host into `dist/mockups/`.
The studio Pages project is built and deployed separately; see the README in
the `site-rehab-stl` repository. The standalone builder refuses to build the
historical studio snapshot so it cannot accidentally replace the canonical
site with stale content.

### The estimator

`core/estimator.js` is the estimator from the historical static studio site.
Four questions produce a scope, a price band and a duration; the canonical
Next.js studio site maintains its own client-side version.

It is allowed to quote a price, because a price can be defended. It is not
allowed to quote the visitor's revenue, traffic or conversions, because those
cannot be measured from the outside and every version of them is invented — the
same refusal `parse_leads.py` makes about estimating lost calls. `check-mockup.mjs`
pins that: it strips the comments and string literals out of the estimator and
fails the build if a revenue-shaped identifier ever holds a value.
