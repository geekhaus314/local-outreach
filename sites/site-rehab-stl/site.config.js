/* Web Rehab STL -- Jake's site, for local trades.
 *
 * Not a client mock-up, and that distinction is enforced rather than assumed.
 * Two of the rules in this kit are inverted here:
 *
 *   * this page is indexable. A mock-up carries noindex because it must never
 *     surface in a search for a real business. This one is the destination every
 *     cold message links to, so suppressing it would suppress the only part of
 *     the pitch that is actually live.
 *   * there is no demo bar and no `sample:` block. Everything below is a fact
 *     about the business or an omission, never a placeholder.
 *
 * Which means the two things this project is most careful about apply with more
 * force, not less. `sites/core/sample.css` exists to keep invented stats off
 * mock-ups; here there is no sample channel to hide an invention in, so anything
 * unverified simply does not appear.
 *
 * ---- who this page is written for -------------------------------------
 *
 * The reader is an owner-operator. He is 45, he is on a roof or under a sink,
 * he has been texted by four agencies this month, and he has never once
 * thought of himself as a customer of "digital infrastructure". The previous
 * version of this page was written for a different reader and said so out loud:
 * "you own the code", "digital infrastructure", a monogram reading SR / 001, and
 * a portfolio link to a personal site. Every one of those is a signal that says
 * *developer*, and to a plumber they collectively say "this person will explain
 * things to me that I already know I do not understand".
 *
 * So the register is the whole job here. Concretely, the things that changed:
 *
 *   code            -> "it's yours, and there's no monthly fee"
 *   infrastructure  -> "take bookings and payments"
 *   scope, band     -> "what it costs"
 *   a technical case-study write-up -> a sentence about what happened
 *   the portfolio   -> gone. It pointed at a personal site that reads as a
 *                      security portfolio, which is the last thing to send a
 *                      roofer who wants his website fixed.
 *
 * The underlying claims are unchanged and still have to be true. Plain language
 * is not permission to say more than you can defend.
 *
 * `kind: 'studio'` is what check-mockup.mjs branches on. Without it this
 * directory would be failed for having no demo bar and no noindex, which is the
 * correct behaviour for a mock-up and exactly backwards here.
 */
window.SITE_CONFIG = {
  kind: 'studio',
  industry: 'studio',

  /* ---- facts: true, or absent ------------------------------------------- */
  facts: {
    name: 'Web Rehab STL',
    who: 'Jake',
    city: 'Florissant',
    email: 'geekhaus314@proton.me',
    emailHref: 'mailto:geekhaus314@proton.me',
    // The one name that has to change if a real domain gets bought. Every URL on
    // this page and every URL in the outreach copy resolves from here or from
    // the two constants at the top of parse_leads.py -- there is no third place.
    site: 'webrehabstl.pages.dev',
    siteHref: 'https://webrehabstl.pages.dev',
    launchPrice: 1200,
    title: 'Web Rehab STL — websites for plumbers, roofers and HVAC in St. Louis County',
    description:
      'I fix and build websites for local trades around St. Louis County. ' +
      'From $1,200, done in a few days, no monthly fee.',
    lang: 'en',

    // Unpublished on purpose. Cold SMS is the outreach channel and the number is
    // not for the web; a published mobile invites the wrong kind of call.
    phone: null,

    // The one-line geography, used above the fold. It lives here rather than in
    // the markup because the first version of this page hardcoded it, and the
    // hardcoded version said "Flower Mound" -- which is a suburb of Dallas, and
    // which is the single most damaging thing a St. Louis trade could read
    // before scrolling. A place name typed into HTML is a claim with no owner;
    // a place name typed into this file is a claim Jake can see and change.
    area: 'St. Louis metro — both sides of the river',
    areaShort: 'St. Louis metro',

    // Grouped, not a flat list, because the range is the selling point and a
    // flat alphabetical list hides it. Metro East Illinois and western Missouri
    // are not "nearby" to most people, so saying so explicitly is what makes
    // claiming them credible rather than sloppy.
    //
    // The Illinois group used to be headed "Metro East Illinois", which is the
    // correct local name -- eight counties, Madison and St. Clair being the two
    // that hug the river, and the second-most populous metro in the state. It is
    // also a name that reads as *the eastern part of Illinois*, which is
    // Springfield and Champaign, sixty miles the wrong way. It only means
    // anything to someone who already lives there, and most of the people this
    // page is for are on the Missouri side.
    //
    // "Illinois side of the river" cannot be misread, and everybody within
    // twenty miles of the Arch knows exactly what it means. Same reach, no
    // decoding.
    //
    // Every duplicate town name in Greater St. Louis is disambiguated with its
    // state. There are two O'Fallons (St. Charles County MO, St. Clair County
    // IL) and two Troys (Lincoln County MO, Madison County IL), both about 30
    // miles apart, and a prospect in the wrong one is not impressed that you
    // listed the right name. There is also a second Chesterfield in Macoupin
    // County IL.
    //
    // Trim this to what you would actually drive to. Every town here is real
    // and in range; whether you want them all is a business decision, and an
    // over-broad list is the first thing a local operator notices.
    serviceArea: {
      'St. Louis County': [
        'Florissant', 'St. Louis', 'Chesterfield', 'Kirkwood', 'Ballwin',
        'Bridgeton', 'Hazelwood', 'Maryland Heights', 'Overland',
      ],
      'St. Charles County': [
        'St. Charles', "O'Fallon, MO", 'St. Peters', 'Wentzville',
      ],
      'West of St. Louis': [
        'Troy, MO', 'Winfield', 'Warrenton',
      ],
      'Illinois side of the river': [
        "O'Fallon, IL", 'Belleville', 'Edwardsville', 'East St. Louis',
        'Alton', 'Grafton', 'Troy, IL',
      ],
    },
  },

  /* ---- the four things I do ---------------------------------------------
   * Named for what the owner gets rather than for what I do to the file. "Get
   * found on Google" is a thing he has a problem with; "local search
   * infrastructure" is a thing he has never heard of.
   *
   * The same taxonomy estimator.js scores against, kept here so the two cannot
   * describe different work. */
  services: [
    {
      label: 'Fix',
      title: 'A site that works',
      body:
        'The site is slow, out of date, or the sort of thing you would rather ' +
        'nobody saw. I rebuild it so it does its job on a phone, and keep ' +
        'whatever on it was still worth keeping.',
      outcome: 'A site you are not embarrassed to text a customer.',
    },
    {
      label: 'New',
      title: 'A site from scratch',
      body:
        'Nothing yet, or nothing worth having. I build one page that says what ' +
        'you do, where you work, and how to reach you -- and nothing else.',
      outcome: 'A first impression that gets you the call.',
    },
    {
      label: 'Found',
      title: 'Showing up when people search',
      body:
        'A nice site nobody finds is an expensive bookmark. I set up the pages, ' +
        'titles and listings that make you come up for your trade nearby.',
      outcome: 'People searching your trade find you.',
    },
    {
      label: 'Work',
      title: 'Bookings, quotes and payments',
      body:
        'If the site should be taking work while you are under a sink, it can. ' +
        'Enquiries to your phone, bookings in a calendar, card payments taken.',
      outcome: 'Work comes in without you chasing it.',
    },
  ],

  /* ---- work --------------------------------------------------------------
   * Real projects, linked, and two of them verified live before this line was
   * written. The third -- kanan-e.vercel.app -- currently answers HTTP 402
   * DEPLOYMENT_DISABLED, so it is described and deliberately not linked. A dead
   * link in a portfolio is the whole failure this project is built to avoid:
   * the one thing a prospect can check himself, checking and finding nothing.
   *
   * Replacing the single clinic anecdote with these is the right call. "A clinic
   * site went dark" was a story with nothing behind it -- no link, nothing to
   * look at, and a reader with a browser had no way to tell it from invention.
   * These are three sites he can open right now and judge in ten seconds, which
   * is a better argument than anything written.
   *
   * Honest caveat, because it cuts against the whole section: all three are
   * family and personal work, in trades that are not the one being pitched. A
   * paying client in the reader's own industry is worth more than all three, and
   * if he ever lands one it should go first on this list. */
  work: [
    {
      title: 'Wildlife photographer, site rebuilt',
      body:
        'My mother photographs wildlife. This is her site — rebuilt, faster, and ' +
        'arranged so the photographs are the first thing you see rather than the ' +
        'third.',
      href: 'https://angie-viefhaus.pages.dev',
      linkText: 'angie-viefhaus.pages.dev',
    },
    {
      title: 'Hair and extensions salon, built and still maintained',
      body:
        'My father-in-law’s business. Built it and I still look after it — which ' +
        'is the part worth saying out loud, because a site that needs an ' +
        'outsider to babysit it is not really fixed.',
      href: 'https://myhairloss.com',
      linkText: 'myhairloss.com',
    },
    {
      title: 'Online shop, built end to end',
      body:
        'A JavaScript and TypeScript store with payments, accounts, a cart, ' +
        'email and a handful of APIs written for it. The point of listing it is ' +
        'that it is a real system, not a brochure — accounts, money and ' +
        'notifications are the parts that break.',
      // No href. kanon-e.vercel.app answers 402 DEPLOYMENT_DISABLED as of the
      // last check. Add the link back the moment the deployment is live; do not
      // add it before, and do not mention the reason a prospect could not
      // discover anyway.
      linkText: 'Not online at the moment',
    },
  ],
  work: [
    {
      title: 'A clinic site that went dark, back up the same day',
      body:
        'Their site stopped loading and they were taking bookings through it. It ' +
        'was back on their own address that evening, taking bookings again.',
      // No href. There is nothing to link to that a trade would open, and a dead
      // or off-brand link is worse than a sentence.
      linkText: 'Happy to talk you through it if you want to know more',
    },
  ],

  /* No `sample:` key. Its absence is the point -- there is nothing invented on
   * this page to mark, and the checker will fail the build if that changes. */
  mockup: false,
};
