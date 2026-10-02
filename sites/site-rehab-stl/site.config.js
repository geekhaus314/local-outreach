/* Web Rehab STL -- Jake's site, for local businesses that need a developer.
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
 * thought of himself as a customer of "digital infrastructure". He also has a
 * browser, and he will open whatever you send him.
 *
 * Two earlier versions missed in opposite directions, and both are worth
 * naming so this one does not drift back to either:
 *
 *   v1 read as a *developer* to a plumber -- "you own the code", "digital
 *      infrastructure", a monogram reading SR / 001. Correct that he is
 *      technical; wrong that saying so out loud helps. To a tradesman it
 *      reads "this person will explain things to me that I already know I
 *      do not understand".
 *
 *   v2 over-corrected into something so plain it undersold him. 633 words,
 *      no images, a portfolio of one, and a headline that led with what he
 *      does to a file rather than what the business gets out of it. A page
 *      selling web work has to itself look like work.
 *
 * So the register is now: a working software developer, professionally
 * presented, selling an outcome. Not a hacker portfolio, and not a text
 * file either. Concretely:
 *
 *   outcome first      -> the reader learns what changes for him before he
 *                         learns any implementation detail
 *   no terminal chrome -> this is not the pwn4g3 aesthetic re-skinned. The
 *                         proof is real screenshots of shipped work, not
 *                         monospace and green-on-black
 *   honest limits       -> no ranking guarantees, no invented numbers, no
 *                         "we grew their revenue 300%". Plain language is
 *                         not permission to say more than you can defend.
 *
 * The underlying claims still have to be true. `kind: 'studio'` is what
 * check-mockup.mjs branches on; without it this directory would be failed for
 * having no demo bar and no noindex, which is the correct behaviour for a
 * mock-up and exactly backwards here.
 *
 * ---------------------------------------------------------------------------
 * NOTE: this file once carried TWO `work:` keys. In an object literal the last
 * one wins, so the three real projects below were dead code and the page
 * rendered the old single "clinic went dark" entry -- which is also why the
 * heading said "One, so far." Duplicate keys are silent in JS. One `work:`.
 * ---------------------------------------------------------------------------
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
    // Outcome, not activity. "Websites for plumbers" tells him the category;
    // it does not tell him what changes. These three verbs are the whole
    // promise, and they are the three things he already knows he is missing.
    title: 'Web Rehab STL — get found, get chosen, get booked in St. Louis',
    description:
      'Websites for St. Louis trades that get you found when people search, ' +
      'chosen over the other quotes, and booked while you work. From $1,200, ' +
      'days not months, no monthly fee.',
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

  /* ---- what he gets -----------------------------------------------------
   * Every title is the outcome, not the task. "A site that works" describes a
   * file; "Found when they search for you" describes his business on a
   * Tuesday. `label` stays short because it is the overline.
   *
   * The same taxonomy estimator.js scores against is kept in step by hand --
   * estimator.js carries its own copy of the four labels (see its taxonomy
   * block), so renaming here does not break scoring, but it does mean a fifth
   * service added here has to be added there too or the estimate will never
   * quote it.
   *
   * No ranking guarantees. "Found" is a claim about setup -- pages, titles,
   * listings, structure -- not a promise to be number one, which nobody can
   * make and which a prospect who has been burned will discount on sight. */
  services: [
    {
      label: 'Found',
      title: 'Found when they search for you',
      body:
        'Someone types your trade into a phone three miles from your house. ' +
        'The pages, titles and listings that decide whether you come up are ' +
        'set up properly, so you are one of the names they see.',
      outcome: 'You are on the list instead of the other way around.',
    },
    {
      label: 'Chosen',
      title: 'Chosen before they call the other three',
      body:
        'Most people get three quotes. They look at all three, and they pick ' +
        'the one that looks like it knows what it is doing. That is a design ' +
        'problem, and it is the part I am best at.',
      outcome: 'They pick you on the website, not on price alone.',
    },
    {
      label: 'Booked',
      title: 'Booked while your hands are full',
      body:
        'Enquiries that arrive in your phone the second they are sent, ' +
        'appointments in a calendar, cards taken. It works the hours you ' +
        'do not.',
      outcome: 'Work comes in without you chasing it.',
    },
    {
      label: 'Yours',
      title: 'Yours, with room to grow into it',
      body:
        'No monthly fee, no hostage hosting, no permission needed to change ' +
        'anything. Start with one page and add the rest when you are ready ' +
        'for it.',
      outcome: 'Start small, scale up, and never rent your own site back.',
    },
  ],

  /* ---- work --------------------------------------------------------------
   * Real projects, real screenshots, live links verified before this line was
   * written. The screenshots come from the same asset store that serves the
   * pwn4g3 portfolio, so they are shots of the actual sites rather than
   * mockups -- which is the difference between a portfolio and an illustration.
   *
   * KananOS moved. kanan-e.vercel.app answers 402 DEPLOYMENT_DISABLED; the
   * build now lives at kananenterprises.vercel.app/united. Rechecked 2026-09-28:
   * /united, /united/products, /united/cart, /united/auth/signin and
   * /united/product/35 all return 200, so it is linked again. A dead link in a
   * portfolio is the one thing a prospect can check himself, checking and
   * finding nothing.
   *
   * Honest caveat: two of these are family work, and none is in the reader's
   * own trade. A paying client in his industry is worth more than all three,
   * and when he lands one it goes first on this list. */
  work: [
    {
      title: 'Hair and extensions clinic — live on its own domain',
      body:
        'A working clinic site with service pages, a shop section and admin ' +
        'tooling, on myhairloss.com with the www and admin subdomains live. ' +
        'Built it, and I still look after it — which is the part worth ' +
        'saying out loud, because a site that needs an outsider to babysit it ' +
        'is not really fixed.',
      href: 'https://myhairloss.com',
      linkText: 'myhairloss.com',
      images: [
        { src: 'brian-home', alt: 'Brian Ivie Hair homepage' },
        { src: 'myhairloss', alt: 'myhairloss.com site' },
        { src: 'brian-services', alt: 'Service pages' },
        { src: 'brian-shop', alt: 'Shop section' },
      ],
    },
    {
      title: 'Wildlife photographer — rebuilt so the work is the first thing you see',
      body:
        'My mother photographs wildlife. This is her site — rebuilt, faster, ' +
        'and rearranged so the photographs land before the words do. Editorial ' +
        'type, dark gallery presentation, full-screen lightbox.',
      href: 'https://angie-viefhaus.pages.dev',
      linkText: 'angie-viefhaus.pages.dev',
      images: [
        { src: 'angie-pages', alt: 'Angie Viefhaus photography portfolio' },
      ],
    },
    {
      title: 'Wholesale distributor — store, accounts and checkout',
      body:
        'A real store rather than a brochure: product catalogue, brand browse, ' +
        'accounts, card payments and email — for a distributor here in ' +
        'Florissant. The parts that break are accounts, money and ' +
        'notifications, and this one handles all three.',
      href: 'https://kananenterprises.vercel.app/united',
      linkText: 'kananenterprises.vercel.app/united',
      images: [
        { src: 'kananos-home', alt: 'United Distribution storefront' },
        { src: 'kanan-e-checkout', alt: 'Checkout flow' },
      ],
    },
  ],

  /* No `sample:` key. Its absence is the point -- there is nothing invented on
   * this page to mark, and the checker will fail the build if that changes. */
  mockup: false,
};
