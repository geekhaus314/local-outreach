export const AGENCY_CONTACT = {
	name: 'Web Rehab STL',
	url: 'https://webrehabstl.com',
	email: 'hello@webrehabstl.com',
	phone: '+16364483574',
	phoneDisplay: '(636) 448-3574',
	city: 'St. Louis',
	region: 'MO',
	country: 'US',
	founder: 'Jake Viefhaus',
	sameAs: ['https://github.com/geekhaus314']
} as const;

export interface AgencyService {
	slug: string;
	name: string;
	shortName: string;
	summary: string;
	description: string;
	audience: string;
	deliverables: string[];
	outcomes: string[];
}

export const agencyServices: AgencyService[] = [
	{
		slug: 'website-audit',
		name: 'Website audit and checkup',
		shortName: 'Website audit',
		summary: 'A measured, plain-language report on what is broken and what to fix first.',
		description:
			'The free checkup runs the same automated checks used on every project. You get the findings in plain language, ordered by what is costing you customers, with no obligation to hire anyone.',
		audience: 'Owners who suspect the site is quiet but do not know why.',
		deliverables: [
			'38 automated checks on the live site',
			'Findings written in plain language, not jargon',
			'A priority order: fix this first, then this',
			'A clear answer on whether repair or rebuild makes sense'
		],
		outcomes: ['You know what is wrong before spending money on a fix.']
	},
	{
		slug: 'website-repair',
		name: 'Website repair and rescue',
		shortName: 'Repair and rescue',
		summary: 'Keep the site you have, fix the parts that lose customers, and stop the bleeding.',
		description:
			'Not every site needs to be rebuilt. Broken forms, dead links, expired domains, insecure pages, missing mobile layouts, and stale content can be repaired in place. If the foundation is the problem, I will say so rather than sell a patch.',
		audience: 'Businesses with a real site that has stopped working properly.',
		deliverables: [
			'Repair of the highest-priority failures from the checkup',
			'Mobile and contact-path fixes',
			'Search and social metadata cleanup',
			'A written summary of what changed'
		],
		outcomes: ['A working site again, without paying for a full rebuild you did not need.']
	},
	{
		slug: 'website-design',
		name: 'Website design and rebuild',
		shortName: 'Design and rebuild',
		summary: 'A fast, mobile-first site built around the way your business actually gets customers.',
		description:
			'For businesses with no site, a template that cannot be fixed, or a page that has not kept up. The build starts from your services, your service area, and the action you want visitors to take, then stays small enough to load quickly on a phone.',
		audience: 'Owner-run businesses that need a credible web presence from scratch.',
		deliverables: [
			'Mobile-first page structure and design',
			'Service pages written around your real offerings',
			'Contact, quote, or booking path that reaches you',
			'Search metadata, sitemap, and analytics setup'
		],
		outcomes: ['One clear place for customers to find you, understand you, and contact you.']
	},
	{
		slug: 'local-search',
		name: 'Local search setup',
		shortName: 'Local search',
		summary: 'Make it possible for nearby customers to find the business, not just the website.',
		description:
			'Local search is more than a meta description. It is consistent business details, a complete Google Business Profile, service pages that name the work, structured data, and a sitemap that search engines can actually read.',
		audience: 'Businesses that rely on nearby customers searching for a service.',
		deliverables: [
			'Google Business Profile review and setup',
			'Title, description, and structured-data cleanup',
			'Service and service-area pages',
			'Robots.txt, sitemap.xml, and indexing checks'
		],
		outcomes: ['A site and profile that can show up when someone nearby searches for the service.']
	},
	{
		slug: 'booking-and-payments',
		name: 'Booking, quotes, and payments',
		shortName: 'Booking and payments',
		summary: 'Let customers book, request a quote, or pay without a phone tag loop.',
		description:
			'An online path that works after hours: a booking request, a quote form, or a checkout. Requests are validated, stored, and sent to the business so nothing depends on a visitor remembering to call.',
		audience: 'Service businesses that lose work when the phone is not answered.',
		deliverables: [
			'Booking or quote-request flow',
			'Spam protection and validation',
			'Email notification to the business',
			'Card payments where the business needs them'
		],
		outcomes: ['Customers can act at 9pm without waiting for a callback.']
	},
	{
		slug: 'web-apps',
		name: 'Custom web apps and tools',
		shortName: 'Custom web apps',
		summary: 'Internal tools, dashboards, and portals built around how the business already works.',
		description:
			'When a spreadsheet or a stack of tabs has become the workflow, a small purpose-built app can replace it. Logins, roles, records, exports, and integrations are scoped to the actual job rather than a generic template.',
		audience: 'Businesses that have outgrown spreadsheets and disconnected tools.',
		deliverables: [
			'Scoped data model and screens',
			'Authentication and role-based access',
			'Import and export paths for existing data',
			'Deployment, backups, and handoff documentation'
		],
		outcomes: ['One tool that matches the work, with the data still yours.']
	}
];

export function findAgencyService(slug: string): AgencyService | undefined {
	return agencyServices.find((service) => service.slug === slug);
}

export interface AgencyWork {
	slug: string;
	name: string;
	url: string;
	sector: string;
	summary: string;
	detail: string[];
	stack: string[];
	image: string;
	imageAlt: string;
}

export const agencyWork: AgencyWork[] = [
	{
		slug: 'brian-ivie-hair',
		name: 'Brian Ivie Hair',
		url: 'https://www.myhairloss.com',
		sector: 'Hair restoration clinic',
		summary:
			'Production Next.js site for a St. Louis clinic, live on a custom domain with service pages, a shop, and admin tooling.',
		detail: [
			'Service pages and a shop section built around the clinic’s real offerings.',
			'Admin tooling so the site can be maintained without a developer for every copy change.',
			'Custom domains and a GitHub-connected deploy pipeline on Cloudflare Pages.'
		],
		stack: ['Next.js', 'MDX', 'Cloudflare Pages'],
		image: '/work/myhairloss.webp',
		imageAlt: 'Screenshot of the Brian Ivie Hair website home page'
	},
	{
		slug: 'angie-viefhaus',
		name: 'Angie Viefhaus',
		url: 'https://angie-viefhaus.pages.dev',
		sector: 'Wildlife photography',
		summary:
			'Editorial photography portfolio with a gallery, lightbox, and a serif-forward design that keeps the images in charge.',
		detail: [
			'Gallery and lightbox built for large wildlife photographs.',
			'Editorial type and a dark, gallery-grade presentation.',
			'Deployed to Cloudflare Pages with a static-first build.'
		],
		stack: ['React', 'TypeScript', 'Tailwind', 'Cloudflare Pages'],
		image: '/work/angie.webp',
		imageAlt: 'Screenshot of the Angie Viefhaus wildlife photography portfolio'
	},
	{
		slug: 'united-distribution',
		name: 'Kanan Enterprises / United Distribution',
		url: 'https://kanan-e.vercel.app',
		sector: 'Wholesale distribution',
		summary:
			'Multi-tenant B2B e-commerce platform with branded storefronts, product catalogs, and a checkout flow.',
		detail: [
			'Multi-tenant Next.js architecture serving more than one branded storefront.',
			'Product catalogs, brand pages, and browse routes for a wholesale distributor.',
			'Production deployment on Vercel with a working checkout flow.'
		],
		stack: ['Next.js', 'TypeScript', 'Vercel'],
		image: '/work/kanan.webp',
		imageAlt: 'Screenshot of the United Distribution wholesale storefront'
	}
];

export interface AgencyDesign {
	id: string;
	name: string;
	summary: string;
	traits: string[];
	swatches: string[];
}

export const agencyDesigns: AgencyDesign[] = [
	{
		id: 'clinical',
		name: 'Clinical and precise',
		summary: 'Calm, high-contrast, and rule-driven. Good for clinics and professional services.',
		traits: ['Hairline rules', 'Serif headlines', 'One accent colour', 'Room to breathe'],
		swatches: ['#0b1320', '#7c3aed', '#f4f6f8']
	},
	{
		id: 'editorial',
		name: 'Editorial and warm',
		summary: 'Photography-first and magazine-like. Good for portfolios and owner-led brands.',
		traits: ['Large imagery', 'Serif display type', 'Warm paper tones', 'Generous margins'],
		swatches: ['#faf7f2', '#7f1d1d', '#1a1a1a']
	},
	{
		id: 'industrial',
		name: 'Industrial and direct',
		summary: 'Dense, high-contrast, and service-first. Good for trades and emergency work.',
		traits: ['Strong headers', 'Phone-first actions', 'Service grids', 'No decoration'],
		swatches: ['#0f172a', '#0ea5e9', '#e2e8f0']
	},
	{
		id: 'local',
		name: 'Local and honest',
		summary: 'Plain, fast, and friendly. Good for shops and neighbourhood businesses.',
		traits: ['Readable type', 'Clear hours and location', 'Simple forms', 'Fast on a phone'],
		swatches: ['#2f4f4f', '#b45309', '#f8fafc']
	}
];

export interface AgencyPackage {
	id: string;
	name: string;
	bestFor: string;
	includes: string[];
}

export const agencyPackages: AgencyPackage[] = [
	{
		id: 'repair',
		name: 'Checkup and repair',
		bestFor: 'A site that exists but is broken, slow, or missing a contact path.',
		includes: [
			'38-point audit and plain-language findings',
			'Repair of the highest-priority failures',
			'Mobile, contact, and metadata cleanup',
			'A written summary of what changed'
		]
	},
	{
		id: 'new-site',
		name: 'New site',
		bestFor: 'A business with no site, or one that cannot be repaired economically.',
		includes: [
			'Mobile-first design and build',
			'Service pages written around your work',
			'Contact or quote path that reaches you',
			'Search metadata, sitemap, and analytics'
		]
	},
	{
		id: 'booking',
		name: 'Booking or online store',
		bestFor: 'A business that needs customers to book, request, or buy without calling.',
		includes: [
			'Booking or quote-request flow',
			'Product or service catalog where needed',
			'Spam protection and validation',
			'Email notifications and card payments where required'
		]
	},
	{
		id: 'app',
		name: 'Custom app',
		bestFor: 'A business that has outgrown spreadsheets or disconnected tools.',
		includes: [
			'Scoped data model and screens',
			'Logins and role-based access',
			'Import and export paths',
			'Deployment, backups, and handoff'
		]
	}
];

export interface AgencyFaq {
	question: string;
	answer: string;
}

export const agencyFaqs: AgencyFaq[] = [
	{
		question: 'What do I get from the free checkup?',
		answer:
			'Your live site goes through 38 automated checks. You get the findings in plain language, ordered by what is costing you customers, plus a clear recommendation on repair versus rebuild. There is no obligation to hire anyone.'
	},
	{
		question: 'How long does the checkup take?',
		answer:
			'Most checkups are reviewed within two business days. If your site needs a deeper manual look, I will tell you before doing it.'
	},
	{
		question: 'Do I need to understand the technical side?',
		answer:
			'No. The report is written for the person running the business. If a finding needs a decision, it comes with the practical trade-off, not a stack trace.'
	},
	{
		question: 'What does a repair or rebuild cost?',
		answer:
			'You get a fixed quote after the checkup. I do not publish a price list because a five-page brochure site and a booking system are not the same job. The quote names the scope and the number before work starts.'
	},
	{
		question: 'Can you work with my current site?',
		answer:
			'Yes. Repair is the first option when the foundation is sound. If the site is too far gone, I will explain why a rebuild is the cheaper path over the next year.'
	},
	{
		question: 'Do you only work in St. Louis?',
		answer:
			'The studio is based in St. Louis. Most work is done remotely, so nearby counties and the Metro East are fine.'
	},
	{
		question: 'Who owns the website and the domain?',
		answer:
			'You do. The domain stays in your name, and the content and code are exportable. You are not locked into a builder account you do not control.'
	}
];

export const AUDIT_HIGHLIGHTS: Array<{ label: string; note: string }> = [
	{ label: 'Domain parked or sold out from under you', note: 'the address customers type no longer reaches you' },
	{ label: 'HTTPS broken', note: 'the secure connection does not hold' },
	{ label: 'No way to make contact', note: 'no phone link, email link, or form' },
	{ label: 'No mobile viewport', note: 'phones render a shrunken desktop page' },
	{ label: 'Phone-only, cannot book online', note: 'nothing to click after hours' },
	{ label: 'Slow load time', note: 'measured response over budget' },
	{ label: 'Unsupported CMS version', note: 'security updates have stopped' },
	{ label: 'Outdated web technology', note: 'legacy stack markers in the page' },
	{ label: 'Stale copyright year', note: 'the page has been untouched for years' },
	{ label: 'No analytics installed', note: 'visitor numbers are unmeasured' }
];

export const FAQ_JSON_LD = {
	'@context': 'https://schema.org',
	'@type': 'FAQPage',
	mainEntity: agencyFaqs.map((faq) => ({
		'@type': 'Question',
		name: faq.question,
		acceptedAnswer: { '@type': 'Answer', text: faq.answer }
	}))
};

export function agencyJsonLd() {
	return {
		'@context': 'https://schema.org',
		'@type': 'ProfessionalService',
		'@id': `${AGENCY_CONTACT.url}/#business`,
		name: AGENCY_CONTACT.name,
		url: `${AGENCY_CONTACT.url}/`,
		email: AGENCY_CONTACT.email,
		telephone: AGENCY_CONTACT.phone,
		description:
			'Website audits, repairs, rebuilds, and local-search setup for St. Louis small businesses.',
		address: {
			'@type': 'PostalAddress',
			addressLocality: AGENCY_CONTACT.city,
			addressRegion: AGENCY_CONTACT.region,
			addressCountry: AGENCY_CONTACT.country
		},
		areaServed: [
			{ '@type': 'City', name: 'St. Louis' },
			{ '@type': 'AdministrativeArea', name: 'St. Louis County' }
		],
		founder: { '@type': 'Person', name: AGENCY_CONTACT.founder },
		sameAs: AGENCY_CONTACT.sameAs,
		knowsAbout: [
			'website audit',
			'website repair',
			'web performance',
			'local search',
			'small business websites'
		],
		makesOffer: agencyServices.map((service) => ({
			'@type': 'Offer',
			itemOffered: {
				'@type': 'Service',
				name: service.name,
				description: service.summary,
				url: `${AGENCY_CONTACT.url}/services/${service.slug}`
			}
		}))
	};
}

export function serviceJsonLd(service: AgencyService) {
	return {
		'@context': 'https://schema.org',
		'@type': 'Service',
		name: service.name,
		serviceType: service.shortName,
		description: service.summary,
		url: `${AGENCY_CONTACT.url}/services/${service.slug}`,
		provider: {
			'@type': 'ProfessionalService',
			name: AGENCY_CONTACT.name,
			url: `${AGENCY_CONTACT.url}/`,
			telephone: AGENCY_CONTACT.phone,
			email: AGENCY_CONTACT.email
		},
		areaServed: { '@type': 'City', name: 'St. Louis' }
	};
}
