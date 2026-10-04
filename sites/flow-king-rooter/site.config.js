/* Client configuration.
 *
 * This file is the whole per-client delta, and it is split by how much we
 * actually know. That split is the important part:
 *
 *   facts   measured or published. Safe to state as true.
 *   sample  invented because a page needs something in the slot. Rendered
 *           marked. See core/sample.css for why this is not optional.
 *
 * MOCK-UP NOTICE: these are real public details for a real business, used to
 * show what a redesign would look like. Nothing on the page submits, sends,
 * stores or measures anything. See ../README.md before showing this to anyone.
 */
window.SITE_CONFIG = {
  // Which preset to load. The demo bar swaps this live to show that the same
  // build can be a different company.
  industry: 'plumbing',

  /* ---- facts: verified or published, safe to assert --------------------- */
  facts: {
    name: 'Flow King Rooter',
    phone: '(314) 274-1019',
    phoneHref: 'tel:+13142741019',
    address: '111 W Port Plaza Dr Suite 600, St. Louis, MO 63146',
    title: 'Flow King Rooter — plumbing in St. Louis, MO',
    description:
      'Plumbing services for drains, pipes, water heaters and sewer lines in St. Louis. 24/7 emergency calls.',
    lang: 'en',
    // Measured, not claimed: the locality is in the published address.
    locality: 'St. Louis, MO',

    // The one measured, checkable observation this whole pitch rests on.
    observedDomain: 'flowkingstl.com',
    observedTitle: 'Plumbers | St. Louis, MO | Flow King Rooter Plumbing',
    observedDetail:
      'No mobile layout in the record (phones see a shrunken desktop page). A contact form but no way to book a slot. 5 resources load over unencrypted http.',
  },

  /* ---- sample: invented for layout, shown as such ----------------------- */
  // Nothing below is a claim about this business. It is here so the page has
  // the right shape, and it is what Jake fills in once the client agrees.
  sample: {
    // An H1 is one idea. The earlier draft ran a whole sentence into it and it
    // broke to six lines at desktop width, which is how you lose someone in the
    // first two seconds.
    headline: 'Drains slow?',
    headlineAccent: 'Get someone out there fast.',
    subhead:
      'Drain, pipe, water heater and sewer work across St. Louis. One call, a real price, someone actually on the way.',
    // All unknown. An earlier draft put "15", "24" and "98%" here because a
    // hero needs three numbers to look finished. It does not need them more than
    // it needs them to be true, so they render as blanks for the client to fill.
    yearsInBusiness: null,
    sameDayRate: null,
    dispatchHours: null,     // we do not know they are 24/7, so we do not say so
    services: [
      { title: 'Emergency leaks & bursts', blurb: 'Shut off, damage stopped, someone out tonight.' },
      { title: 'Water heaters', blurb: 'No hot water, leaking tank, or a unit to replace.' },
      { title: 'Drains & blockages', blurb: 'Slow drains, backed-up lines, and the ones that come back.' },
      { title: 'Fixtures & installs', blurb: 'Faucets, disposals, toilets — fitted properly first time.' },
      { title: 'Remodels & rough-ins', blurb: 'Bathroom and kitchen work, coordinated and left clean.' },
      { title: 'Camera inspection', blurb: 'Find the actual problem before anyone cuts pipe.' },
    ],
    serviceArea: [
      'St. Louis', 'St. Louis County', 'Bridgeton', 'Florissant', 'Normandy',
      'Overland', 'Berkeley', 'Ferguson', 'Dellwood', 'Moline',
    ],
    trustBadges: ['Licensed & insured', 'No call-out fee', 'Price before we start'],
  },

  // Shown in the demo bar. Kept honest on purpose: the recipient should be told
  // what this is in the first second, not discover it after filling in a form.
  mockup: true,

  // The trade switcher, for live walkthroughs. Off for the emailed link.
  //
  // I argued for this being the strongest thing on the page, and I was wrong
  // about who it is for. It answers "would you actually make it look like my
  // trade?", and the person reading their own mock-up in their own trade has
  // that answered already -- they are looking at it. What is left is four
  // buttons that change nothing about their business, in a row across the top,
  // which is a distraction at best and reads as "these are other people's
  // sites" at worst.
  //
  // So it lives behind a flag. Turn it on in a copy of this file when you are
  // sitting next to somebody, because in person the objection it answers is the
  // first one you get.
  showTradeSwitcher: false,
};
