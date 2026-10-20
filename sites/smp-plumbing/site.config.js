/* Client configuration: SMP Plumbing Company.
 *
 * The split that matters:
 *   facts   measured or published. Safe to state as true.
 *   sample  invented because the page needs a slot filled. Rendered marked.
 *
 * The domain observation is the only thing this pitch asserts. Everything
 * below it is either the published listing or an admitted placeholder.
 */
window.SITE_CONFIG = {
  industry: 'plumbing-paper',

  facts: {
    name: 'SMP Plumbing Company',
    phone: '(314) 677-4763',
    phoneHref: 'tel:+13146774763',
    address: '3275 Lake Ave, Bridgeton, MO 63044',
    locality: 'Bridgeton, MO',
    title: 'SMP Plumbing Company — Bridgeton, MO',
    description:
      'Plumbing in Bridgeton, Missouri. Call SMP Plumbing Company at ' +
      '(314) 677-4763.',
    lang: 'en',

    // Measured with scraper/audit.py on 2026-10-19. The domain resolves and
    // 301s through a chain of unrelated sites; the page the auditor stopped on
    // had no title and no body text. Re-check before delivery.
    observedDomain: 'smpplumbingcompany.com',
    observedTitle: '',
    observedDetail:
      'The address redirects through a chain of unrelated sites. The page the ' +
      'auditor stopped on had no title and no body text.',
  },

  sample: {
    headline: 'Plumbing that',
    headlineAccent: 'answers the phone.',
    subhead:
      'A Bridgeton plumber for repairs, replacements, and the work that needs ' +
      'doing right the first time.',

    // All invented for layout. The owner replaces these with the jobs he
    // actually wants; nothing here is a claim about the business.
    services: [
      { title: 'Repairs', blurb: 'Leaks, running toilets, and the small jobs that keep getting put off.' },
      { title: 'Fixtures & faucets', blurb: 'Replaced or repaired, with the water shut off first.' },
      { title: 'Drains & backups', blurb: 'Cleared, and the reason it backed up looked at.' },
      { title: 'Water heaters', blurb: 'Repair or replacement, with the old unit hauled away.' },
    ],

    steps: [
      { title: 'Call', body: 'Tell us what is happening and where. If it is urgent, say so.' },
      { title: 'Get a time', body: 'A real window, not a promise to call you back later.' },
      { title: 'Get it fixed', body: 'The work is explained before it starts, and the area is left clean.' },
    ],

    serviceArea: [
      'Bridgeton', 'St. Ann', 'Hazelwood', 'Maryland Heights',
      'Overland', 'St. Louis County',
    ],

    // Unknown stays visibly blank. See the straight-answers section.
    yearsInBusiness: null,
    hours: null,
    licence: null,
  },

  mockup: true,
  showTradeSwitcher: false,
};
