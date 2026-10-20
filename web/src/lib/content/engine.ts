import type {
  BookingConfig,
  BookingField,
  Business,
  ClinicContent,
  ContentOptions,
  FaqItem,
  IndustryKind,
  LocalOutreachProspect,
  Location,
  Offering,
  PhoneRoute,
  ProcessStep,
  ReputationProof,
  SiteContent,
  TemplateId
} from './types.ts';
import { CONTENT_SCHEMA_VERSION, TEMPLATE_IDS } from './types.ts';
import type { ThemeName } from '../data/themes.ts';
import { getVerticalContentBuilder } from '../verticals/registry.ts';
import { matchVertical } from '../verticals/taxonomy.ts';
import type { VerticalContent } from '../verticals/types.ts';

interface Place {
  streetAddress: string;
  city: string;
  region: string;
  postalCode: string;
  addressLine: string;
}

type ContentProfile = VerticalContent;

const HAIR_OWNED_DOMAIN_KINDS = new Set<IndustryKind>(['restoration', 'medical-hair', 'smp', 'salon']);

const DIRECTORY_HOSTS = [
  'zenoti.com',
  'booksy.com',
  'vagaro.com',
  'squareup.com',
  'squarespace.com',
  'wix.com',
  'wordpress.com',
  'godaddy.com',
  'facebook.com',
  'instagram.com',
  'yelp.com',
  'yellowpages.com',
  'google.com',
  'business.site',
  'webflow.io',
  'shopify.com',
  'toasttab.com',
  'opentable.com',
  'doordash.com',
  'grubhub.com',
  'seamless.com',
  'ubereats.com'
];

function isDirectoryHost(hostname: string): boolean {
  return DIRECTORY_HOSTS.some((domain) => hostname === domain || hostname.endsWith(`.${domain}`));
}

const IMAGES = {
  editorial: {
    hero: '/media/mockup-hero.svg',
    heroAlt: 'Abstract layered forms in charcoal, cream, and gold',
    systems: '/media/treatment-systems.svg',
    laser: '/media/treatment-laser.svg',
    extensions: '/media/treatment-extensions.svg',
    transplant: '/media/treatment-transplant.svg',
    smp: '/media/treatment-smp.svg'
  },
  service: {
    hero: '/media/treatment-systems.svg',
    heroAlt: 'Layered geometric forms suggesting structure and repair',
    systems: '/media/treatment-systems.svg',
    laser: '/media/treatment-laser.svg',
    extensions: '/media/treatment-extensions.svg',
    transplant: '/media/treatment-transplant.svg',
    smp: '/media/treatment-smp.svg'
  },
  menu: {
    hero: '/media/treatment-extensions.svg',
    heroAlt: 'Warm flowing forms suggesting a table setting',
    systems: '/media/treatment-systems.svg',
    laser: '/media/treatment-laser.svg',
    extensions: '/media/treatment-extensions.svg',
    transplant: '/media/treatment-transplant.svg',
    smp: '/media/treatment-smp.svg'
  },
  clinic: {
    hero: '/media/treatment-laser.svg',
    heroAlt: 'Soft concentric rings suggesting clinical care',
    systems: '/media/treatment-systems.svg',
    laser: '/media/treatment-laser.svg',
    extensions: '/media/treatment-extensions.svg',
    transplant: '/media/treatment-transplant.svg',
    smp: '/media/treatment-smp.svg'
  },
  project: {
    hero: '/media/treatment-transplant.svg',
    heroAlt: 'Geometric arch and line work suggesting an outdoor plan',
    systems: '/media/treatment-systems.svg',
    laser: '/media/treatment-laser.svg',
    extensions: '/media/treatment-extensions.svg',
    transplant: '/media/treatment-transplant.svg',
    smp: '/media/treatment-smp.svg'
  },
  general: {
    hero: '/media/mockup-hero.svg',
    heroAlt: 'Abstract layered forms in charcoal, cream, and gold',
    systems: '/media/treatment-systems.svg',
    laser: '/media/treatment-laser.svg',
    extensions: '/media/treatment-extensions.svg',
    transplant: '/media/treatment-transplant.svg',
    smp: '/media/treatment-smp.svg'
  }
} as const;

const CTA = {
  editorial: { primary: 'Request an appointment', secondary: 'Explore services' },
  service: { primary: 'Request a quote', secondary: 'See services' },
  menu: { primary: 'Reserve a table', secondary: 'View the menu' },
  clinic: { primary: 'Book a visit', secondary: 'See treatments' },
  project: { primary: 'Request an estimate', secondary: 'See services' },
  general: { primary: 'Get in touch', secondary: 'See services' }
} as const;

export function isTemplateId(value: unknown): value is TemplateId {
  return typeof value === 'string' && (TEMPLATE_IDS as readonly string[]).includes(value);
}

export function recommendTemplate(kind: IndustryKind): TemplateId {
  switch (kind) {
    case 'restoration':
    case 'smp':
    case 'salon':
      return 'editorial';
    case 'medical-hair':
    case 'dental':
    case 'medical':
      return 'clinic';
    case 'restaurant':
      return 'menu';
    case 'automotive':
    case 'home-services':
      return 'service';
    case 'landscaping':
      return 'project';
    default:
      return 'general';
  }
}

export function resolveTemplate(value: TemplateId | string | null | undefined, kind: IndustryKind): TemplateId {
  return isTemplateId(value) ? value : recommendTemplate(kind);
}

export function normalizeHostname(hostname: string): string {
  return hostname.toLowerCase().split(':')[0].replace(/^www\./, '');
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
}

function shortHash(value: string): string {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36).padStart(6, '0').slice(0, 6);
}

export function prospectSlug(lead: LocalOutreachProspect): string {
  const base = slugify(lead.name) || 'prospect';
  return `${base}-${shortHash(lead.source_ids || lead.phone || lead.website || lead.name)}`;
}

function websiteHostname(website: string): string {
  if (!website?.trim()) return '';
  const candidate = website.includes('://') ? website : `https://${website}`;
  if (!URL.canParse(candidate)) return '';
  return normalizeHostname(new URL(candidate).hostname);
}

export function prospectHostnames(
  lead: LocalOutreachProspect,
  previewBaseDomain = 'preview.localhost'
): string[] {
  const slug = prospectSlug(lead);
  const hosts = new Set<string>([`${slug}.${previewBaseDomain}`, `${slug}.localhost`]);
  const kind = classifyIndustry(lead);
  if (HAIR_OWNED_DOMAIN_KINDS.has(kind)) {
    const ownedHost = websiteHostname(lead.website ?? '');
    if (ownedHost && !isDirectoryHost(ownedHost)) hosts.add(ownedHost);
  }
  return [...hosts];
}

export function classifyIndustry(lead: LocalOutreachProspect): IndustryKind {
  const text = `${lead.name ?? ''} ${lead.industry ?? ''}`.toLowerCase();

  if (/\bsmp\b|scalp micropigmentation|micropigmentation|cosmetic tattoo|tattooist/.test(text)) {
    return 'smp';
  }

  if (
    /hair (?:loss|restoration|replacement|transplant)|hair system|hairpiece|toupee|wig|alopecia|tricholog/.test(text)
  ) {
    return /surgeon|surgical|medical|clinic|transplant|dermatolog/.test(text) ? 'medical-hair' : 'restoration';
  }

  if (/dentist|dental|orthodont|endodont|periodont/.test(text)) return 'dental';

  if (/barber|barbershop|hair salon|salon|spa|beauty|nail|personal care|stylist/.test(text)) return 'salon';

  if (/restaurant|cafe|coffee|bakery|pizzeria|pizza|grill|diner|bistro|tavern|bar\b|food/.test(text)) {
    return 'restaurant';
  }

  if (/automotive|auto repair|auto body|car wash|car dealer|tire|oil change|transmission|truck repair|mechanic/.test(text)) {
    return 'automotive';
  }

  if (/landscap|lawn|garden|irrigation|tree service|arborist|hardscap/.test(text)) return 'landscaping';

  if (
    /roof|hvac|plumb|electric|contractor|handyman|painter|window|siding|solar|pest|locksmith|mover|moving|construction|pool/.test(
      text
    )
  ) {
    return 'home-services';
  }

  if (/clinic|medical|dermatolog|doctor|physician|veterinar|animal hospital|surgeon|health/.test(text)) {
    return 'medical';
  }

  return 'general';
}

export function classifyProspectTheme(lead: LocalOutreachProspect, kind = classifyIndustry(lead)): ThemeName {
  if (['medical-hair', 'dental', 'medical', 'home-services', 'automotive'].includes(kind)) {
    return 'clinical-trust';
  }
  if (['smp', 'salon', 'landscaping'].includes(kind)) return 'modern-wellness';
  return 'premium-luxury';
}

function placeFromProspect(lead: LocalOutreachProspect): Place {
  const parts = (lead.address ?? '')
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);

  const streetAddress = parts[0] ?? '';
  const city = parts[1] ?? '';
  const regionAndPostal = parts[2] ?? '';
  const [region = '', ...postalParts] = regionAndPostal.split(/\s+/).filter(Boolean);

  return {
    streetAddress,
    city,
    region,
    postalCode: postalParts.join(' '),
    addressLine:
      (lead.address ?? '').trim() ||
      [city, region].filter(Boolean).join(', ') ||
      'Contact for location details'
  };
}

function phoneRoute(phone: string): PhoneRoute | null {
  const display = (phone ?? '').trim();
  if (!display) return null;

  const digits = display.replace(/[^\d+]/g, '');
  if (!digits) return null;

  if (digits.startsWith('+')) {
    return { display, dial: `tel:${digits}`, source: 'scraped prospect record' };
  }

  const national = digits.replace(/^1/, '');
  if (national.length !== 10) {
    return { display, dial: `tel:${digits}`, source: 'scraped prospect record' };
  }

  return { display, dial: `tel:+1${national}`, source: 'scraped prospect record' };
}

function siteSearchUrl(lead: LocalOutreachProspect, place: Place): string {
  const mapsUrl = (lead.maps_url ?? '').trim();
  if (mapsUrl) return mapsUrl;
  const query = [lead.name, place.addressLine].filter(Boolean).join(' ');
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

function directionsUrl(lead: LocalOutreachProspect, place: Place): string {
  const destination = place.addressLine || lead.name;
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`;
}

function shortName(name: string): string {
  const cleaned = name
    .replace(/\b(?:llc|l\.l\.c\.|inc\.?|incorporated|corp\.?|corporation|co\.?|company|ltd\.?|limited)\b/gi, '')
    .replace(/\s{2,}/g, ' ')
    .replace(/[\s,.-]+$/g, '')
    .trim();
  return cleaned || name;
}

function proofFromProspect(lead: LocalOutreachProspect): ReputationProof | null {
  if (lead.rating === null) return null;
  const source = (lead.sources ?? []).some((item) => item.toLowerCase() === 'gmaps')
    ? 'Google reviews'
    : 'public reviews';
  return {
    rating: lead.rating,
    reviewCount: lead.review_count,
    source
  };
}

function offering(
  id: string,
  name: string,
  category: string,
  summary: string,
  description: string,
  features: string[],
  audience: string,
  duration: string,
  image: string,
  imageAlt: string
): Offering {
  return { id, name, category, summary, description, features, audience, duration, image, imageAlt };
}

function buildRestorationProfile(lead: LocalOutreachProspect, place: Place): ContentProfile {
  const where = place.city ? ` in ${place.city}` : '';
  const img = IMAGES.editorial;
  return {
    descriptor: 'Hair Restoration',
    headline: `Hair restoration${where}, without the runaround.`,
    subhead: `${lead.name} offers a consultation-first path through hair systems, laser therapy, extensions, and transplant support. Start with an assessment, then choose the option that fits your hair and your life.`,
    requestLabel: 'consultation request',
    offerings: [
      offering(
        'custom-hair-systems',
        'Custom Hair Systems',
        'Restoration',
        'A custom-fit system matched to your color, density, and hairline.',
        'A custom system is built around the shape of your head and the way you wear your hair. The consultation covers color and density matching, base construction, styling, and the maintenance schedule that keeps the result looking natural.',
        ['Color, density, and hairline matching', 'Cut and styled for your face and routine', 'Maintenance and repair planning'],
        'Clients dealing with thinning hair, medical hair loss, or transplant recovery.',
        'Consultation plus private fitting',
        img.systems,
        'Layered charcoal and gold forms suggesting a custom hairline'
      ),
      offering(
        'laser-hair-therapy',
        'Laser Hair Therapy',
        'Clinical care',
        'Non-invasive low-level laser therapy for follicle and scalp support.',
        'Low-level laser therapy is a non-surgical option used to support follicle health and the appearance of density. It can also be planned around transplant recovery, where consistency and timing matter.',
        ['Non-invasive, in-studio sessions', 'Pre- and post-transplant planning', 'Progress reviews at defined checkpoints'],
        'Clients looking for a non-surgical option or support around transplant care.',
        'Protocol set after assessment',
        img.laser,
        'Soft concentric light rings in blue and charcoal'
      ),
      offering(
        'hair-extensions',
        'Hair Extensions',
        'Length and volume',
        'Extensions selected for length, volume, and a natural color blend.',
        'Extensions should move with your own hair, not sit on top of it. The consultation covers length, density, color match, application method, and the care routine that protects both the extensions and your natural hair.',
        ['Length, volume, and color consultation', 'Natural blend and movement', 'Care and removal guidance'],
        'Clients who want added length or density without a custom system.',
        'Consultation plus application',
        img.extensions,
        'Flowing cream and gold ribbon forms'
      ),
      offering(
        'scalp-micropigmentation',
        'Scalp Micropigmentation (SMP)',
        'Education',
        'A closer look at follicle-style scalp pigmentation and who it suits.',
        'SMP uses micro-needles and custom-blended pigment to create the appearance of closely cropped hair follicles. It can add the look of density, define a hairline, or camouflage scars. It is cosmetic tattooing, not a transplant, and results fade over time.',
        ['Typically 2–4 sessions, spaced 2–4 weeks apart', 'Sessions usually run 2–4 hours', 'Final result settles 4–6 weeks after the last session', 'Touch-ups are commonly needed every 3–6 years'],
        'Adults considering a shaved-hair look, density shading, or scar camouflage, including transplant clients.',
        'Multiple sessions plus healing time',
        img.smp,
        'Fine gold dot pattern across a charcoal field'
      ),
      offering(
        'transplant-consultations',
        'Transplant Consultations',
        'Surgical coordination',
        'Planning and support before and after transplant surgery.',
        'A transplant is only one part of the process. The consultation covers realistic planning, coordination with the surgical team, temporary system fitting during donor recovery, and the styling and therapy support that follows.',
        ['Independent pre-surgery planning', 'System fitting during donor recovery', 'Post-transplant care coordination'],
        'Clients considering a transplant or already scheduled for one.',
        'Consultation and recovery plan',
        img.transplant,
        'Geometric arch and line work in charcoal and gold'
      )
    ],
    process: [
      { title: 'Assess', body: 'A private conversation about your hair loss pattern, donor area, budget, and the maintenance you want.' },
      { title: 'Plan', body: 'A written recommendation comparing the realistic outcome, timeline, and ongoing cost of each option.' },
      { title: 'Support', body: 'Fitting, therapy, styling, and follow-up so the result keeps working after the first appointment.' }
    ],
    faq: [
      {
        question: 'How do I choose between a hair system, laser therapy, and a transplant?',
        answer: 'Start with an assessment of your hair loss pattern, donor area, budget, and how much maintenance you want. The consultation should compare the realistic outcome and ongoing cost of each option before you commit.'
      },
      {
        question: 'How many SMP sessions does it usually take?',
        answer: 'SMP commonly takes two to four sessions spaced two to four weeks apart, with each session lasting about two to four hours. The final plan depends on the coverage area and how your skin accepts the pigment.'
      }
    ]
  };
}

function buildMedicalHairProfile(lead: LocalOutreachProspect, place: Place): ContentProfile {
  const where = place.city ? ` in ${place.city}` : '';
  const img = IMAGES.clinic;
  return {
    descriptor: 'Hair Restoration Medicine',
    headline: `Hair restoration${where}, planned with a medical eye.`,
    subhead: `${lead.name} starts with diagnosis and candidacy, not a one-size-fits-all package. Compare surgical and non-surgical options, understand the recovery timeline, and request a consultation.`,
    requestLabel: 'consultation request',
    offerings: [
      offering(
        'surgical-consultation',
        'Surgical Consultation',
        'Assessment',
        'A candidacy review before any surgical decision.',
        'A surgical consultation reviews your hair loss pattern, donor supply, medical history, and expected outcome. The goal is a realistic plan and a clear explanation of what surgery can and cannot achieve.',
        ['Hair loss and donor assessment', 'Realistic outcome planning', 'Risks, recovery, and follow-up review'],
        'Clients considering a surgical restoration procedure.',
        'Consultation',
        img.transplant,
        'Geometric arch and line work in charcoal and gold'
      ),
      offering(
        'non-surgical-options',
        'Non-Surgical Options',
        'Treatment planning',
        'Medical and topical options reviewed against your goals.',
        'Not every client needs surgery. The consultation compares non-surgical options, including laser therapy and topical or medical treatments, with the evidence, commitment, and likely timeline for each.',
        ['Evidence and expectation review', 'Treatment commitment and cost discussion', 'Progress checkpoints'],
        'Clients who want to explore non-surgical treatment first.',
        'Consultation',
        img.laser,
        'Soft concentric light rings in blue and charcoal'
      ),
      offering(
        'recovery-support',
        'Recovery Support',
        'Aftercare',
        'A plan for the weeks after a procedure.',
        'Recovery planning covers scalp care, activity limits, follow-up timing, and the styling or camouflage options available while the result matures.',
        ['Post-procedure care instructions', 'Follow-up scheduling', 'Interim styling and coverage options'],
        'Clients preparing for or recovering from a procedure.',
        'Set by the care plan',
        img.systems,
        'Layered charcoal and gold forms suggesting a custom hairline'
      )
    ],
    process: [
      { title: 'Diagnose', body: 'Review the hair loss pattern, donor supply, medical history, and previous treatments.' },
      { title: 'Plan', body: 'Compare surgical and non-surgical options with a realistic outcome and recovery timeline.' },
      { title: 'Follow up', body: 'Schedule the procedure or treatment plan and review progress at defined checkpoints.' }
    ],
    faq: [
      {
        question: 'Do I need a referral before booking?',
        answer: 'Requirements vary by service and insurance. Ask the practice directly when you request the appointment so you know what to bring and whether a referral is needed.'
      },
      {
        question: 'Will the consultation include a written plan?',
        answer: 'Ask for the recommended options, expected timeline, and full cost in writing before scheduling a procedure. A clear plan should separate what is known from what depends on the assessment.'
      }
    ]
  };
}

function buildSmpProfile(lead: LocalOutreachProspect, place: Place): ContentProfile {
  const where = place.city ? ` in ${place.city}` : '';
  const img = IMAGES.editorial;
  return {
    descriptor: 'Scalp Micropigmentation',
    headline: `Scalp micropigmentation${where}, designed for your hairline.`,
    subhead: `${lead.name} creates follicle-style pigment work for density, hairline definition, and scar camouflage. Request a consultation to compare coverage options and see what a healed result can realistically look like.`,
    requestLabel: 'consultation request',
    offerings: [
      offering(
        'smp',
        'Scalp Micropigmentation',
        'Core service',
        'Follicle-style pigment matched to your hair and skin tone.',
        'SMP deposits tiny pigment dots into the upper scalp to mimic cropped hair follicles. The consultation covers coverage area, hairline design, pigment matching, session count, and the healing process.',
        ['Custom hairline and density design', 'Pigment matched to skin and hair tone', 'Two to four sessions, usually two to four weeks apart'],
        'Clients considering a shaved-hair look or added density.',
        'Multiple sessions',
        img.smp,
        'Fine gold dot pattern across a charcoal field'
      ),
      offering(
        'density-shading',
        'Density Shading',
        'Coverage',
        'Pigment work that reduces the contrast of thinning areas.',
        'Density shading adds the appearance of fullness through thinning zones without creating a solid block of color. The plan is built around your natural growth pattern and the way you wear your hair.',
        ['Blends with existing hair', 'Coverage tuned to the thinning pattern', 'Designed for a natural transition'],
        'Clients with diffuse thinning who want a denser look.',
        'Set after assessment',
        img.systems,
        'Layered charcoal and gold forms suggesting a custom hairline'
      ),
      offering(
        'scar-camouflage',
        'Scar Camouflage',
        'Correction',
        'Pigment work to reduce the visibility of scalp scars.',
        'Scar camouflage uses pigment to soften the contrast of transplant, surgical, or accident scars. The consultation reviews scar age, texture, and healing before a plan is recommended.',
        ['Scar and skin assessment first', 'Color matched to surrounding tissue', 'Staged approach where needed'],
        'Clients with visible scalp scarring.',
        'Set after assessment',
        img.transplant,
        'Geometric arch and line work in charcoal and gold'
      ),
      offering(
        'touch-ups',
        'Touch-Ups',
        'Maintenance',
        'Refresh faded pigment and keep the result consistent.',
        'SMP pigment fades over time. Touch-up sessions refresh the color and density so the result stays consistent with the original plan.',
        ['Fade and color review', 'Density refresh', 'Long-term maintenance planning'],
        'Existing SMP clients.',
        'Maintenance session',
        img.laser,
        'Soft concentric light rings in blue and charcoal'
      )
    ],
    process: [
      { title: 'Consult', body: 'Review coverage, hairline design, pigment match, and the healed result you can expect.' },
      { title: 'Treat', body: 'Build the result over the number of sessions the coverage area actually needs.' },
      { title: 'Refresh', body: 'Plan a touch-up interval so the color and density stay consistent over time.' }
    ],
    faq: [
      {
        question: 'How many SMP sessions will I need?',
        answer: 'SMP usually takes two to four sessions spaced two to four weeks apart. The exact number depends on the coverage area, skin type, and how the pigment heals.'
      },
      {
        question: 'How long does SMP last?',
        answer: 'SMP is not permanent. Pigment fades over time, and most clients plan for a touch-up every three to six years. Sun exposure and skin type affect how quickly the color changes.'
      }
    ]
  };
}

function buildSalonProfile(lead: LocalOutreachProspect, place: Place): ContentProfile {
  const where = place.city ? ` in ${place.city}` : '';
  const text = `${lead.name} ${lead.industry}`.toLowerCase();
  const barber = /barber/.test(text);
  const spa = /spa|wellness/.test(text);
  const img = IMAGES.editorial;
  return {
    descriptor: barber ? 'Barber Shop' : spa ? 'Salon & Spa' : 'Hair Salon',
    headline: barber ? `A sharper cut${where}, without the wait.` : `Hair that fits your routine${where}.`,
    subhead: barber
      ? `${lead.name} keeps the appointment simple: a clear consultation, a precise cut, and a finish that works with your routine.`
      : `${lead.name} pairs a proper consultation with cuts, color, and styling that you can recreate at home.`,
    requestLabel: 'appointment request',
    offerings: [
      offering(
        'cut',
        barber ? 'Cut & Line-Up' : 'Haircut & Consultation',
        'Cutting',
        barber ? 'A clean cut with a defined line-up and a finish that suits your routine.' : 'A cut planned around your hair, face shape, and how much styling you want to do.',
        barber
          ? 'The appointment starts with a short consultation on length, fade, and line-up. The cut is finished with a style and a quick routine you can repeat at home.'
          : 'The consultation covers length, shape, and maintenance before the cut. The finish is styled for your hair type and the time you actually have in the morning.',
        barber
          ? ['Consultation on length and fade', 'Defined line-up', 'Finishing style and product guidance']
          : ['Shape and length consultation', 'Cut for your hair type', 'Styling guidance for home'],
        barber ? 'Clients who want a precise, low-maintenance cut.' : 'Clients who want a cut that works with their routine.',
        'One appointment',
        img.systems,
        'Layered charcoal and gold forms suggesting a clean silhouette'
      ),
      offering(
        'color',
        barber ? 'Beard & Grooming' : 'Color & Gloss',
        barber ? 'Grooming' : 'Color',
        barber ? 'Beard shaping and grooming finished with the cut.' : 'Color, gloss, or tonal work matched to your skin and maintenance plan.',
        barber
          ? 'Beard work is shaped around the jawline and the cut, then finished with a grooming plan that keeps the shape between visits.'
          : 'Color is planned around your starting shade, the amount of upkeep you want, and how your hair has handled color before. The consultation covers the realistic result and the maintenance interval.',
        barber
          ? ['Jawline and cheek line shaping', 'Beard length and texture review', 'Home grooming guidance']
          : ['Color and tone consultation', 'Patch or strand discussion where needed', 'Maintenance plan'],
        barber ? 'Clients who want the cut and beard shape maintained together.' : 'Clients considering a color change or gloss refresh.',
        barber ? 'Add-on to a cut' : 'Consultation plus service',
        img.extensions,
        'Flowing cream and gold ribbon forms'
      ),
      offering(
        'styling',
        'Styling & Occasion Hair',
        'Styling',
        'A finished look for a photo, event, or a night out.',
        'Occasion styling starts with the outfit, the venue, and how long the look needs to hold. The appointment covers the plan, the products, and the finish.',
        ['Look planned around the occasion', 'Products matched to your hair', 'Finish that holds through the event'],
        'Clients preparing for an event or a specific look.',
        'One appointment',
        img.transplant,
        'Geometric arch and line work in charcoal and gold'
      ),
      offering(
        'scalp-care',
        'Scalp & Conditioning Care',
        'Care',
        'A scalp and conditioning service focused on comfort and manageability.',
        'This is a care service, not a medical treatment. The consultation covers scalp comfort, product build-up, and the conditioning that suits your hair.',
        ['Scalp and product review', 'Conditioning suited to your hair', 'Home care guidance'],
        'Clients dealing with dryness, build-up, or ordinary scalp comfort.',
        'One appointment',
        img.laser,
        'Soft concentric light rings in blue and charcoal'
      )
    ],
    process: [
      { title: 'Consult', body: 'Talk through the shape, color, or finish you want and the maintenance you can keep up with.' },
      { title: 'Service', body: 'The appointment is carried out in the order that protects the hair and the finished result.' },
      { title: 'Aftercare', body: 'Leave with the products, timing, and routine needed to keep the result looking intentional.' }
    ],
    faq: [
      {
        question: 'Do you take walk-ins?',
        answer: 'Availability changes by day. Call the shop directly before walking in, or use the appointment form and wait for confirmation.'
      },
      {
        question: 'What should I bring to a color appointment?',
        answer: 'Bring a photo of the result you want and anything that shows your current color history. If you have had a reaction to color before, mention it before the appointment.'
      },
      {
        question: 'How often should I rebook?',
        answer: 'The right interval depends on the cut, color, and how fast your hair grows. Ask for a realistic rebooking window before you leave.'
      }
    ]
  };
}

function buildHomeServicesProfile(lead: LocalOutreachProspect, place: Place): ContentProfile {
  const where = place.city ? ` in ${place.city}` : '';
  const industry = (lead.industry ?? '').trim() || 'Home Services';
  const img = IMAGES.service;
  return {
    descriptor: industry,
    headline: `${industry}${where}, quoted before work starts.`,
    subhead: `${lead.name} handles repairs, installations, and maintenance with a written scope. Use the form to describe the job and request a quote.`,
    requestLabel: 'quote request',
    offerings: [
      offering(
        'repair',
        'Repair & Diagnosis',
        'Repair',
        'Find the cause before quoting the fix.',
        'The visit starts with the actual problem, not a guessed package. The scope, likely cause, and next step are explained before work begins.',
        ['Problem diagnosis first', 'Written scope before work', 'Clear next step if parts are needed'],
        'Property owners dealing with a fault or damage.',
        'Varies by job',
        img.systems,
        'Layered geometric forms suggesting structure and repair'
      ),
      offering(
        'installation',
        'Installation',
        'Installation',
        'A planned install with the site checked first.',
        'Installation work is planned around the site, access, and the condition of what is already there. Ask for the included materials, exclusions, and cleanup in writing.',
        ['Site and access review', 'Scope and materials listed', 'Cleanup included in the quote'],
        'Property owners planning a replacement or new installation.',
        'Varies by scope',
        img.transplant,
        'Geometric arch and line work suggesting a built structure'
      ),
      offering(
        'maintenance',
        'Maintenance',
        'Maintenance',
        'Keep the work in condition between visits.',
        'Maintenance visits are planned around the condition of the system or surface and the way it is used. Ask what a sensible interval looks like before committing.',
        ['Condition review', 'Planned service interval', 'Repair options for worn parts'],
        'Property owners who want to avoid avoidable failures.',
        'Varies by scope',
        img.laser,
        'Soft concentric rings suggesting a routine check'
      ),
      offering(
        'urgent',
        'Urgent Requests',
        'Priority',
        'Ask about same-day or emergency availability.',
        'Urgent work is scheduled by availability and the actual risk. Call the business directly for a faster answer than the form.',
        ['Call for urgent availability', 'Risk explained before work', 'Temporary fix options where needed'],
        'Property owners dealing with an active leak, outage, or safety issue.',
        'Set by availability',
        img.extensions,
        'Flowing forms suggesting speed and movement'
      )
    ],
    process: [
      { title: 'Describe', body: 'Send the job details, location, and timing through the form or call the business directly.' },
      { title: 'Quote', body: 'Get the scope, exclusions, and price in writing before work is scheduled.' },
      { title: 'Complete', body: 'Confirm the work, the cleanup, and the follow-up plan after the job.' }
    ],
    faq: [
      {
        question: 'Is the estimate free?',
        answer: 'Ask directly when you request the quote. The answer can depend on the type of job and whether a site visit is needed.'
      },
      {
        question: 'Which areas do you serve?',
        answer: 'Service areas vary by trade and schedule. Send the property address with the request so the business can confirm coverage.'
      },
      {
        question: 'What should the quote include?',
        answer: 'Ask for the scope, materials, exclusions, cleanup, and payment terms in writing. A verbal range is not the same as a quoted job.'
      }
    ]
  };
}

function buildRestaurantProfile(lead: LocalOutreachProspect, place: Place): ContentProfile {
  const where = place.city ? ` in ${place.city}` : '';
  const industry = (lead.industry ?? '').trim() || 'Restaurant';
  const img = IMAGES.menu;
  return {
    descriptor: industry,
    headline: `A local table${where}.`,
    subhead: `${lead.name} uses this page for the details that matter before a visit: location, contact, and a direct way to ask about hours, menus, or group seating.`,
    requestLabel: 'reservation request',
    offerings: [
      offering(
        'dine-in',
        'Dine In',
        'Visit',
        'Join the table for a sit-down meal.',
        'Call ahead for current hours, wait times, and the menu. The kitchen and seating schedule can change by day.',
        ['Call for current hours', 'Ask about the day’s menu', 'Confirm seating availability'],
        'Guests planning a sit-down visit.',
        'Varies by service',
        img.systems,
        'Warm geometric forms suggesting a table setting'
      ),
      offering(
        'takeout',
        'Takeout',
        'To Go',
        'Order to go when you do not want to stay.',
        'Ask the business directly for the current takeout menu, packaging, and pickup timing. Online ordering may be handled separately.',
        ['Call for the takeout menu', 'Confirm pickup timing', 'Ask about packaging and allergens'],
        'Guests ordering food to go.',
        'Varies by order',
        img.extensions,
        'Flowing forms suggesting a takeaway bag'
      ),
      offering(
        'groups',
        'Groups & Events',
        'Large Tables',
        'Ask about group seating and private events.',
        'Group availability depends on the day, the size of the party, and the space. Call before assuming a large table can be reserved.',
        ['Call with the party size', 'Confirm the date and time', 'Ask about deposits or minimums'],
        'Guests planning a group meal or private event.',
        'Set by the booking',
        img.transplant,
        'Geometric arch suggesting a private dining room'
      )
    ],
    process: [
      { title: 'Check', body: 'Call or check the listing for current hours, menu, and availability before you travel.' },
      { title: 'Reserve', body: 'Use the form or call directly for a table, group booking, or takeout question.' },
      { title: 'Visit', body: 'Confirm the details with the business before the reservation or pickup time.' }
    ],
    faq: [
      {
        question: 'Where can I see the current menu?',
        answer: 'Ask the business directly. Menus change by day and season, and this preview does not invent dishes or prices.'
      },
      {
        question: 'Do you take reservations?',
        answer: 'Reservation policy varies. Call the business or send a request with the date, time, and party size so it can confirm.'
      },
      {
        question: 'Can you accommodate dietary restrictions?',
        answer: 'Ask before ordering. The business can confirm ingredients, cross-contact risk, and whether a modification is possible.'
      }
    ]
  };
}

function buildAutomotiveProfile(lead: LocalOutreachProspect, place: Place): ContentProfile {
  const where = place.city ? ` in ${place.city}` : '';
  const img = IMAGES.service;
  return {
    descriptor: 'Auto Service',
    headline: `Straight answers${where}, before the repair.`,
    subhead: `${lead.name} starts with diagnosis and a written estimate, so you know what the vehicle needs before authorizing the work.`,
    requestLabel: 'service request',
    offerings: [
      offering(
        'diagnostics',
        'Diagnostics',
        'Diagnosis',
        'Find the fault before replacing parts.',
        'A diagnostic visit should identify the fault, explain the evidence, and separate the repair from routine maintenance. Ask for the findings before authorizing work.',
        ['Fault diagnosis first', 'Findings explained', 'Repair estimate before authorization'],
        'Drivers dealing with a warning light, noise, or drivability problem.',
        'Varies by diagnosis',
        img.laser,
        'Soft concentric rings suggesting a diagnostic scan'
      ),
      offering(
        'maintenance',
        'Scheduled Maintenance',
        'Maintenance',
        'Routine service matched to the vehicle and mileage.',
        'Maintenance is scheduled around the manufacturer interval and the actual condition of the vehicle. Ask what is included and what can wait.',
        ['Mileage and condition review', 'Service items listed', 'Next interval explained'],
        'Drivers keeping up with routine service.',
        'Varies by service',
        img.systems,
        'Layered forms suggesting mechanical structure'
      ),
      offering(
        'brakes-tires',
        'Brakes & Tires',
        'Safety',
        'Inspection and repair for the parts that stop the car.',
        'Brake and tire work starts with a measurement and inspection. Ask for the readings and the reason a replacement is recommended.',
        ['Measurement before replacement', 'Parts and labor separated', 'Safety items explained'],
        'Drivers with braking, steering, or tire concerns.',
        'Varies by inspection',
        img.transplant,
        'Geometric arch suggesting a wheel and tire'
      ),
      offering(
        'repairs',
        'General Repairs',
        'Repair',
        'Mechanical repair with the scope agreed first.',
        'General repair covers the systems that keep the vehicle running. The estimate should list the parts, labor, and anything that still needs diagnosis.',
        ['Written estimate', 'Parts and labor listed', 'Follow-up if the scope changes'],
        'Drivers authorizing a repair after diagnosis.',
        'Varies by repair',
        img.extensions,
        'Flowing forms suggesting motion'
      )
    ],
    process: [
      { title: 'Describe', body: 'Send the vehicle, symptom, and timing so the shop can prepare for the visit.' },
      { title: 'Diagnose', body: 'Get the findings and a written estimate before any repair is authorized.' },
      { title: 'Repair', body: 'Confirm the scope, the parts, and the pickup time before the work begins.' }
    ],
    faq: [
      {
        question: 'Do I need an appointment?',
        answer: 'Ask the shop directly. Some work can be scheduled, while diagnostics or urgent repairs may need a different slot.'
      },
      {
        question: 'Will you call before doing extra work?',
        answer: 'Ask for that commitment when you drop off the vehicle. The estimate should say what happens if the diagnosis finds something else.'
      },
      {
        question: 'What should I bring?',
        answer: 'Bring the keys, any recent service records, and a description of when the problem happens. Mention any warning lights or recent repairs.'
      }
    ]
  };
}

function buildDentalProfile(lead: LocalOutreachProspect, place: Place): ContentProfile {
  const where = place.city ? ` in ${place.city}` : '';
  const img = IMAGES.clinic;
  return {
    descriptor: 'Dental Care',
    headline: `Dental care${where}, without the runaround.`,
    subhead: `${lead.name} uses this page to explain the first visit, the treatment options, and how to request an appointment without a phone tag loop.`,
    requestLabel: 'appointment request',
    offerings: [
      offering(
        'checkups',
        'Checkups & Cleanings',
        'Preventive',
        'Routine exams and cleaning for ongoing oral health.',
        'A checkup covers the examination, cleaning, and the findings that need attention. Ask what is included and what the practice recommends next.',
        ['Exam and cleaning', 'Findings explained', 'Next visit interval'],
        'New and existing patients keeping up with routine care.',
        'One visit',
        img.laser,
        'Soft concentric rings suggesting a clinical check'
      ),
      offering(
        'restorative',
        'Restorative Care',
        'Restorative',
        'Treatment for decay, damage, or a missing tooth.',
        'Restorative treatment starts with an exam and a plan. Ask for the options, the number of visits, and the full cost before scheduling.',
        ['Exam and treatment plan', 'Options explained', 'Visit count and cost confirmed'],
        'Patients with decay, damage, or a missing tooth.',
        'Set by the plan',
        img.systems,
        'Layered forms suggesting a rebuilt structure'
      ),
      offering(
        'cosmetic',
        'Cosmetic Dentistry',
        'Cosmetic',
        'Elective treatment planned around the result you want.',
        'Cosmetic work is elective and should be planned around the result you want and the maintenance it needs. Ask for a realistic comparison before committing.',
        ['Result and maintenance review', 'Options compared', 'Cost and visit count confirmed'],
        'Patients considering an elective change.',
        'Set by the plan',
        img.extensions,
        'Flowing forms suggesting a polished finish'
      ),
      offering(
        'urgent',
        'Urgent Visits',
        'Urgent',
        'Call directly for pain, swelling, or a broken tooth.',
        'Urgent dental problems need a direct call, not a web form. The practice can confirm availability and what to do while you wait.',
        ['Call for urgent availability', 'Explain swelling or pain', 'Follow the practice’s interim advice'],
        'Patients with pain, swelling, or recent dental damage.',
        'Set by availability',
        img.transplant,
        'Geometric arch suggesting a protective structure'
      )
    ],
    process: [
      { title: 'Request', body: 'Send the reason for the visit and the timing that works for you.' },
      { title: 'Confirm', body: 'The practice confirms the appointment, insurance questions, and what to bring.' },
      { title: 'Visit', body: 'The exam findings and the next step are explained before treatment is scheduled.' }
    ],
    faq: [
      {
        question: 'Are you accepting new patients?',
        answer: 'Ask when you request the appointment. Availability can change by provider and by the type of visit.'
      },
      {
        question: 'Do you take my insurance?',
        answer: 'Call the practice with the plan name and member details. Do not assume coverage from a website preview.'
      },
      {
        question: 'What should I bring to the first visit?',
        answer: 'Bring photo ID, insurance details, a medication list, and any recent dental records or images.'
      }
    ]
  };
}

function buildMedicalProfile(lead: LocalOutreachProspect, place: Place): ContentProfile {
  const where = place.city ? ` in ${place.city}` : '';
  const industry = (lead.industry ?? '').trim() || 'Medical Care';
  const img = IMAGES.clinic;
  return {
    descriptor: industry,
    headline: `${industry}${where}, with a clear next step.`,
    subhead: `${lead.name} uses this page to explain how to request a visit, what to bring, and how the practice handles follow-up.`,
    requestLabel: 'appointment request',
    offerings: [
      offering(
        'new-patient',
        'New Patient Visit',
        'First visit',
        'A first appointment to review the reason for the visit and the history.',
        'The first visit covers the reason for the appointment, the relevant history, and the next step. Ask what records or referrals the practice needs before you arrive.',
        ['Reason for visit reviewed', 'History and records checked', 'Next step explained'],
        'New patients requesting a first appointment.',
        'One visit',
        img.laser,
        'Soft concentric rings suggesting clinical care'
      ),
      offering(
        'follow-up',
        'Follow-Up Care',
        'Ongoing care',
        'A scheduled review after a visit or treatment.',
        'Follow-up care is planned around the previous findings and the response to treatment. Ask what the practice needs from you before the next visit.',
        ['Previous findings reviewed', 'Progress checked', 'Next interval agreed'],
        'Existing patients returning for review.',
        'One visit',
        img.systems,
        'Layered forms suggesting an ongoing plan'
      ),
      offering(
        'preventive',
        'Preventive Care',
        'Prevention',
        'Routine care planned around your history.',
        'Preventive care is scheduled around the practice’s guidance and your history. Ask which checks are routine and which depend on symptoms.',
        ['Routine checks reviewed', 'Risk factors discussed', 'Schedule agreed'],
        'Patients keeping up with routine care.',
        'One visit',
        img.extensions,
        'Flowing forms suggesting continuity'
      ),
      offering(
        'coordination',
        'Care Coordination',
        'Coordination',
        'Help connecting the visit to the next provider or service.',
        'Care coordination covers records, referrals, and the handoff to another provider. Ask what the practice can send and what you need to request yourself.',
        ['Records and referrals', 'Handoff explained', 'Patient responsibilities confirmed'],
        'Patients moving between providers or services.',
        'Set by the care plan',
        img.transplant,
        'Geometric arch suggesting a bridge between providers'
      )
    ],
    process: [
      { title: 'Request', body: 'Send the reason for the visit and the timing that works for you.' },
      { title: 'Prepare', body: 'The practice confirms what to bring, whether a referral is needed, and the visit details.' },
      { title: 'Visit', body: 'The findings and the next step are explained before you leave.' }
    ],
    faq: [
      {
        question: 'Are you accepting new patients?',
        answer: 'Ask when you request the appointment. Availability can change by provider and by the type of visit.'
      },
      {
        question: 'Do I need a referral?',
        answer: 'It depends on the service and insurance. Ask the practice directly before booking so you know what to bring.'
      },
      {
        question: 'What should I bring to the first visit?',
        answer: 'Bring photo ID, insurance details, a medication list, and any recent records or images relevant to the visit.'
      }
    ]
  };
}

function buildLandscapingProfile(lead: LocalOutreachProspect, place: Place): ContentProfile {
  const where = place.city ? ` in ${place.city}` : '';
  const industry = (lead.industry ?? '').trim() || 'Landscaping';
  const img = IMAGES.project;
  return {
    descriptor: industry,
    headline: `Outdoor work${where}, planned around the property.`,
    subhead: `${lead.name} plans outdoor work around the site, the season, and the maintenance you actually want to keep up with.`,
    requestLabel: 'estimate request',
    offerings: [
      offering(
        'design-install',
        'Design & Installation',
        'Design',
        'A planting or landscape plan installed in stages.',
        'Design work starts with the site, the light, and how the space will be used. Ask for the plan, the plant list, and the installation sequence before work begins.',
        ['Site and light review', 'Plant and material list', 'Installation sequence'],
        'Property owners planning a new landscape or planting bed.',
        'Set by the plan',
        img.transplant,
        'Geometric arch and line work suggesting an outdoor plan'
      ),
      offering(
        'maintenance',
        'Lawn & Garden Maintenance',
        'Maintenance',
        'Routine care planned around the growing season.',
        'Maintenance covers the work that keeps the landscape in condition. Ask which visits are included and how weather or growth changes the schedule.',
        ['Seasonal schedule', 'Included work listed', 'Weather plan agreed'],
        'Property owners who want routine outdoor care.',
        'Recurring visits',
        img.systems,
        'Layered forms suggesting a maintained landscape'
      ),
      offering(
        'hardscape',
        'Hardscaping',
        'Hardscape',
        'Paths, walls, and built outdoor surfaces.',
        'Hardscape work is planned around drainage, access, and the materials that suit the site. Ask for the base preparation and drainage details in the quote.',
        ['Drainage and access review', 'Materials listed', 'Base preparation explained'],
        'Property owners planning a patio, path, or retaining wall.',
        'Set by the scope',
        img.extensions,
        'Flowing forms suggesting a path'
      ),
      offering(
        'cleanup',
        'Seasonal Cleanup',
        'Seasonal',
        'A reset for the property at the change of season.',
        'Seasonal cleanup covers the cutback, removal, and prep the property needs at that point in the year. Ask what is removed and what is left on site.',
        ['Cutback and removal', 'Bed and edge cleanup', 'Disposal explained'],
        'Property owners preparing for a new season.',
        'One visit',
        img.laser,
        'Soft concentric rings suggesting seasonal change'
      )
    ],
    process: [
      { title: 'Walkthrough', body: 'Review the site, the light, the drainage, and how you want to use the outdoor space.' },
      { title: 'Plan', body: 'Get the scope, materials, sequence, and maintenance expectations in writing.' },
      { title: 'Maintain', body: 'Agree the follow-up visits so the work stays in condition after installation.' }
    ],
    faq: [
      {
        question: 'Is the estimate free?',
        answer: 'Ask when you request it. Some projects need a site visit before the business can quote accurately.'
      },
      {
        question: 'Which areas do you serve?',
        answer: 'Send the property address with the request so the business can confirm the service area and schedule.'
      },
      {
        question: 'What should the quote include?',
        answer: 'Ask for the scope, plant or material list, drainage work, disposal, and the maintenance plan in writing.'
      }
    ]
  };
}

function buildGeneralProfile(lead: LocalOutreachProspect, place: Place): ContentProfile {
  const industry = (lead.industry ?? '').trim() || 'Local Service';
  const where = place.city ? ` in ${place.city}` : '';
  const img = IMAGES.general;
  return {
    descriptor: industry,
    headline: `${industry}${where}, with a clear next step.`,
    subhead: `${lead.name} uses this page to explain the work, answer common questions, and take requests without a phone tag loop.`,
    requestLabel: 'request',
    offerings: [
      offering(
        'consultation',
        'Consultation',
        'Get started',
        'Describe the problem and get a clear next step.',
        'The first step is a conversation about what you need, what has already been tried, and what outcome you expect. Use the form to request a time.',
        ['Discuss the scope before work begins', 'Ask about timing and availability', 'Get a clear next step'],
        'New customers.',
        'By appointment',
        img.systems,
        'Layered charcoal and gold forms'
      ),
      offering(
        'service',
        `${industry} Service`,
        'Core service',
        `Professional ${industry.toLowerCase()} support from ${lead.name}.`,
        'Service visits are scoped around the actual job rather than a generic package. Ask for the scope, timeline, and price before work begins.',
        ['Local, appointment-based service', 'Scope confirmed before work', 'Follow-up support'],
        'Home and business customers.',
        'Varies by scope',
        img.transplant,
        'Geometric arch and line work'
      ),
      offering(
        'maintenance',
        'Maintenance',
        'Ongoing care',
        'Keep the work in good condition over time.',
        'Maintenance visits are planned around the condition of the work and the way it is used. Ask what a sensible service interval looks like for your situation.',
        ['Condition review', 'Planned service intervals', 'Repair options'],
        'Existing customers.',
        'Varies by scope',
        img.laser,
        'Soft concentric light rings'
      )
    ],
    process: [
      { title: 'Enquire', body: 'Send the details, location, and timing through the request form.' },
      { title: 'Scope', body: 'Confirm what is included, what is not, and what could change the price.' },
      { title: 'Complete', body: 'Agree the work, the follow-up, and the best way to reach the business.' }
    ],
    faq: [
      {
        question: 'How is the scope of work decided?',
        answer: 'Ask for a written scope and price before work begins. A clear scope should list what is included, what is not, and what could change the price.'
      },
      {
        question: 'How do I request an appointment?',
        answer: 'Use the request form on this page. The business will follow up using the contact details you provide.'
      }
    ]
  };
}

function buildProfile(lead: LocalOutreachProspect, place: Place, kind = classifyIndustry(lead)): ContentProfile {
  switch (kind) {
    case 'restoration':
      return buildRestorationProfile(lead, place);
    case 'medical-hair':
      return buildMedicalHairProfile(lead, place);
    case 'smp':
      return buildSmpProfile(lead, place);
    case 'salon':
      return buildSalonProfile(lead, place);
    case 'home-services':
      return buildHomeServicesProfile(lead, place);
    case 'restaurant':
      return buildRestaurantProfile(lead, place);
    case 'automotive':
      return buildAutomotiveProfile(lead, place);
    case 'dental':
      return buildDentalProfile(lead, place);
    case 'medical':
      return buildMedicalProfile(lead, place);
    case 'landscaping':
      return buildLandscapingProfile(lead, place);
    default:
      return buildGeneralProfile(lead, place);
  }
}

function buildTrust(lead: LocalOutreachProspect, place: Place, proof: ReputationProof | null): string[] {
  const trust: string[] = [];
  if (proof) {
    const reviews = proof.reviewCount === null ? proof.source : `${proof.reviewCount} ${proof.source}`;
    trust.push(`${proof.rating.toFixed(1)}★ from ${reviews}`);
  }
  if (place.city) {
    trust.push(`Serving ${place.city}${place.region ? `, ${place.region}` : ''}`);
  }
  return trust;
}

function buildFaq(lead: LocalOutreachProspect, place: Place, profile: ContentProfile): FaqItem[] {
  const locationAnswer = (lead.address ?? '').trim()
    ? `The business is listed at ${(lead.address ?? '').trim()}. Use the directions link in the footer for the current map listing.`
    : 'Use the request form to ask for the current location and availability.';

  return [
    ...profile.faq,
    {
      question: 'Where are you located?',
      answer: locationAnswer
    },
    {
      question: 'What should I have ready?',
      answer: 'Bring any photos, relevant records, and a sense of your budget and timeline. The business can confirm anything else it needs before the appointment.'
    },
    {
      question: 'How do I get started?',
      answer: `Use the request form on this page. ${lead.name} will follow up using the contact details you provide.`
    }
  ];
}

function navFor(template: TemplateId, proof: ReputationProof | null): Array<{ label: string; href: string }> {
  const reviews = proof ? [{ label: 'Reviews', href: '/#reviews' }] : [];
  switch (template) {
    case 'menu':
      return [
        { label: 'Menu', href: '/#treatments' },
        { label: 'Visit', href: '/#visit' },
        ...reviews,
        { label: 'Reserve', href: '/#booking' }
      ];
    case 'service':
      return [
        { label: 'Services', href: '/#treatments' },
        { label: 'Process', href: '/#approach' },
        ...reviews,
        { label: 'Quote', href: '/#booking' }
      ];
    case 'clinic':
      return [
        { label: 'Treatments', href: '/#treatments' },
        { label: 'Process', href: '/#approach' },
        ...reviews,
        { label: 'Book', href: '/#booking' }
      ];
    case 'project':
      return [
        { label: 'Services', href: '/#treatments' },
        { label: 'Process', href: '/#approach' },
        ...reviews,
        { label: 'Estimate', href: '/#booking' }
      ];
    case 'general':
      return [
        { label: 'Services', href: '/#treatments' },
        { label: 'Process', href: '/#approach' },
        ...reviews,
        { label: 'Contact', href: '/#booking' }
      ];
    default:
      return [
        { label: 'Services', href: '/#treatments' },
        { label: 'Approach', href: '/#approach' },
        ...reviews,
        { label: 'Questions', href: '/#faq' },
        { label: 'Book', href: '/#booking' }
      ];
  }
}

function bookingFields(offerings: Offering[]): BookingField[] {
  const options = offerings.map((item) => ({ value: item.id, label: item.name }));
  options.push({ value: 'not-sure', label: 'Not sure yet' });
  return [
    {
      name: 'name',
      label: 'Full name',
      type: 'text',
      required: true,
      autocomplete: 'name',
      placeholder: 'Your name'
    },
    {
      name: 'email',
      label: 'Email',
      type: 'email',
      required: true,
      autocomplete: 'email',
      placeholder: 'you@example.com'
    },
    {
      name: 'phone',
      label: 'Phone',
      type: 'tel',
      required: false,
      autocomplete: 'tel',
      placeholder: 'Your phone number'
    },
    {
      name: 'treatment',
      label: 'What are you interested in?',
      type: 'select',
      required: true,
      options
    },
    {
      name: 'message',
      label: 'Anything the business should know?',
      type: 'textarea',
      required: false,
      placeholder: 'Describe what you need and when you would like to come in.'
    }
  ];
}

function buildBooking(profile: ContentProfile, lead: LocalOutreachProspect): BookingConfig {
  return {
    endpoint: '/api/booking',
    fields: bookingFields(profile.offerings),
    consentLabel:
      'I agree to be contacted about this request. My details will not be sold or used for unrelated marketing.',
    privacyHref: '/privacy',
    successMessage: `Your ${profile.requestLabel} is in. ${shortName(lead.name)} will follow up using the contact details you provided.`,
    errorMessage: 'We could not send your request. Please try again.',
    unavailableMessage:
      'Online booking is not configured for this preview yet. Use the contact details on this page.',
    notification: {
      webhookEnv: 'BOOKING_WEBHOOK_URL',
      apiKeyEnv: 'BOOKING_API_KEY',
      fromEmailEnv: 'BOOKING_FROM_EMAIL',
      subjectPrefix: `New ${profile.requestLabel} — ${lead.name}`
    }
  };
}

export function generateSiteContent(
  lead: LocalOutreachProspect,
  options: ContentOptions = {}
): SiteContent {
  if (!lead.name.trim()) {
    throw new Error('LocalOutreachProspect.name is required to generate a mockup.');
  }

  const place = placeFromProspect(lead);
  const kind = classifyIndustry(lead);
  const vertical = options.vertical ?? matchVertical(lead);
  const verticalBuilder = getVerticalContentBuilder(vertical);
  const profile =
    verticalBuilder === null
      ? buildProfile(lead, place, kind)
      : verticalBuilder({
          lead,
          kind,
          businessName: lead.name.trim(),
          shortName: shortName(lead.name),
          city: place.city,
          region: place.region
        });
  const proof = proofFromProspect(lead);
  const template = resolveTemplate(options.template, kind);
  const theme = options.theme ?? classifyProspectTheme(lead, kind);
  const heroImage = profile.images ?? IMAGES[template];
  const cta: {
    primary: string;
    primaryHref?: string;
    secondary: string;
    secondaryHref?: string;
  } = profile.ctas ?? CTA[template];
  const hostnames = options.hostnames ?? prospectHostnames(lead, options.previewBaseDomain);
  const host = hostnames[0] ?? `${prospectSlug(lead)}.preview.localhost`;
  const scheme = host.endsWith('.localhost') ? 'http' : 'https';
  const siteUrl = options.siteUrl ?? `${scheme}://${host}`;
  const noindex = options.indexable !== true;
  const descriptor = profile.descriptor;
  const citySuffix = place.city ? ` in ${place.city}` : '';

  const business: Business = {
    name: lead.name.trim(),
    shortName: shortName(lead.name),
    descriptor,
    tagline: `${descriptor}${citySuffix}.`,
    legalName: lead.name.trim(),
    industry: (lead.industry ?? '').trim() || descriptor,
    email: (lead.email ?? '').trim() || null,
    phone: phoneRoute(lead.phone ?? ''),
    hours: [],
    locations: [
      {
        label: 'Business location',
        legalName: lead.name.trim(),
        streetAddress: place.streetAddress,
        city: place.city,
        region: place.region,
        postalCode: place.postalCode,
        country: 'US',
        mapsUrl: siteSearchUrl(lead, place),
        directionsUrl: directionsUrl(lead, place),
        geo: null
      }
    ]
  };

  return {
    schemaVersion: CONTENT_SCHEMA_VERSION,
    id: options.id ?? prospectSlug(lead),
    isPreview: noindex,
    hostnames,
    siteUrl,
    theme,
    template,
    vertical,
    industryKind: kind,
    business,
    nav: profile.nav ?? navFor(template, proof),
    hero: {
      eyebrow: profile.eyebrow ?? `${descriptor}${place.city ? ` · ${place.city}` : ''}`,
      headline: profile.headline,
      subhead: profile.subhead,
      primaryCta: cta.primary,
      primaryHref: cta.primaryHref ?? '/#booking',
      secondaryCta: cta.secondary,
      secondaryHref: cta.secondaryHref ?? '/#treatments',
      image: heroImage.hero,
      imageAlt: heroImage.heroAlt,
      trust: buildTrust(lead, place, proof)
    },
    offerings: profile.offerings,
    process: profile.process,
    proof,
    faq: buildFaq(lead, place, profile),
    booking: buildBooking(profile, lead),
    seo: {
      title: `${lead.name} | ${descriptor}${citySuffix}`,
      description: `${lead.name}${citySuffix}. ${descriptor} details, contact information, and a direct request form.`,
      noindex
    }
  };
}

/**
 * @deprecated Use generateSiteContent. Kept for backwards compatibility with
 * existing prospect envelopes and callers that read brand/company/treatments.
 */
export function generateProspectMockup(
  lead: LocalOutreachProspect,
  options: ContentOptions = {}
): ClinicContent {
  const content = generateSiteContent(lead, options);
  return {
    ...content,
    brand: content.business,
    company: content.business,
    treatments: content.offerings
  };
}
