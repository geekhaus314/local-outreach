/* Client configuration.
 *
 * This file is the whole per-client delta, and it is split by how much we
 * actually know. That split is the important part:
 *
 *   facts   measured or published. Safe to state as true.
 *   sample  invented because a page needs something in the slot. Rendered
 *           marked. See core/sample.css for why this is not optional.
 *
 * MOCK-UP NOTICE: real public details for a real business, used to show what a
 * redesign would look like. Nothing on the page submits, sends, stores or
 * measures anything. See ../README.md before showing this to anyone.
 *
 * The measured facts below were taken on 30 September 2026 with `dig`, `whois`
 * (RDAP) and `ping`. They are the whole pitch: the domain is registered and
 * paid for and it serves nothing. Re-run them before sending — a zone that is
 * empty today can have a record added tomorrow, and a pitch whose one hard
 * fact has gone stale is worse than one with no facts at all.
 */
window.SITE_CONFIG = {
  kind: 'mockup',
  industry: 'automotive',

  /* ---- network: the one call this page is allowed to make --------------- *
   * Declared here rather than left implicit in reviews.js, because
   * check-mockup.mjs reads this list to decide what is permissible. The first
   * version of the live-reviews work put a fetch() in reviews.js, and the
   * guard still reported "no network or storage APIs" -- because it only ever
   * scanned index.html. A check that can be passed by moving code one file to
   * the right is not a check, so the guard now scans the page's own scripts
   * and this list is what it compares them against.
   *
   * Same-origin, GET only, read-only, and it may only fetch a path listed
   * here. Anything else fails the build. There is one entry because there is
   * one call. */
  network: [
    { path: '/api/reviews', via: 'reviews.js', method: 'GET', readOnly: true },
  ],

  /* ---- facts: verified or published, safe to assert --------------------- */
  facts: {
    name: 'A+ Auto Repair',
    phone: '+1 314 291-2886',
    phoneHref: 'tel:+13142912886',
    // Published on their Google/Facebook listings and on three directories.
    // The shop also appears at 11717 St. Charles Rock Rd on MapQuest, which is
    // why this one is worth confirming with them rather than asserting twice.
    address: '3659 N Lindbergh Blvd, St. Ann, MO 63074',
    locality: 'St. Ann, MO',
    // Mon-Fri 8-5, Saturday and Sunday closed. Published identically on
    // autorepairscore.com and iBegin. Confirm before it goes on a live site.
    hours: 'Mon–Fri, 8:00 AM – 5:00 PM',
    title: 'A+ Auto Repair — independent auto repair in St. Ann, MO',
    description:
      'Independent auto repair at 3659 N Lindbergh Blvd, St. Ann, MO. ' +
      'Diagnostics, brakes, suspension and scheduled maintenance. ' +
      'Call (314) 291-2886.',
    lang: 'en',

    // Where their name already lives, all of it on ground they do not own.
    channels: [
      'Google Business Profile',
      'Facebook — bridgetonaplusauto',
      'Carfax shop listing',
    ],

    /* The one measured observation this whole pitch rests on. Every line of
       it is checkable, and it is stronger than any claim about a design. */
    observedDomain: 'aplusauto.org',
    observedTitle: 'ping: aplusauto.org: No address associated with hostname',
    observedDetail:
      'Registered 10 May 2012 through eNom, good until 10 May 2027. ' +
      'Nameservers still point at Dreamhost and mail still answers — but there ' +
      'is no A record and no AAAA record, so http, https and www all fail to ' +
      'resolve. The domain is alive. The website on it is not.',
  },

  /* ---- sample: invented for layout, shown as such ----------------------- */
  // Nothing below is a claim about this business. It is here so the page has
  // the right shape, and it is what Jake fills in once the client agrees.
  sample: {
    // An H1 is one idea. Everything after it is a subtitle.
    headline: 'That light on the dash?',
    headlineAccent: 'We’ll tell you what it is.',
    subhead:
      'Independent repair on N Lindbergh. Diagnose first, price before ' +
      'anything comes apart, and a person who answers the phone.',

    /* Unknown, and left unknown on purpose. The first draft of this page had
       "14 years", "4.7 stars" and "12-month warranty" in these three slots.
       None of them were verified, and a prospect who catches one invented
       number stops believing the three real ones — which are the only reason
       this page is worth sending. They render as blanks so they can be
       filled in with the client watching. */
    yearsInBusiness: null,
    reviewCount: null,
    warrantyMonths: null,

    services: [
      { title: 'Check-engine & diagnostics', blurb: 'OBD-II scan, live data and the actual fault — not just the code the light throws at you.' },
      { title: 'Brakes', blurb: 'Pads, rotors, calipers and fluid. The grind, the pull, and the pedal that went soft last week.' },
      { title: 'Oil & scheduled maintenance', blurb: 'The factory schedule for your car, not the number on the sticker somebody else put in the window.' },
      { title: 'Suspension & steering', blurb: 'Ball joints, struts, tie rods and bushings — the clunk over the railroad tracks on Lindbergh.' },
      { title: 'Cooling system', blurb: 'Radiators, water pumps, hoses and a pressure test that finds the leak instead of topping it up again.' },
      { title: 'No-start electrical', blurb: 'Batteries, starters and alternators, diagnosed rather than parts-swapped until something works.' },
      { title: 'Tires, rotation & alignment', blurb: 'Mounting, balancing and the four-wheel alignment that stops the car eating its own inside edge.' },
      { title: 'Pre-purchase inspection', blurb: 'Buying used? An hour on the lift before you buy is cheaper than a year of somebody else’s maintenance.' },
    ],

    serviceArea: [
      'St. Ann', 'Florissant', 'Bridgeton', 'Overland', 'Hazelwood',
      'Maryland Heights', 'Normandy', 'Charlack', 'Vinita Park',
      'St. Louis County',
    ],

    trustBadges: [
      'Price before we start',
      'Diagnosis before parts',
      'You keep the old parts',
      'Text updates while it is in the bay',
    ],
  },

  // Shown in the demo bar. Kept honest on purpose: the recipient should be told
  // what this is in the first second, not discover it after filling in a form.
  mockup: true,

  // The trade switcher, for live walkthroughs. Off for the emailed link. See
  // st-charles-plumbing/site.config.js for why it is behind a flag.
  showTradeSwitcher: false,
};
