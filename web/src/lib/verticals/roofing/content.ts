import type { Offering } from '$lib/content/types';
import type { VerticalContent, VerticalContext } from '../types.ts';

function offering(
  id: string,
  name: string,
  category: string,
  summary: string,
  features: string[],
  duration: string
): Offering {
  return {
    id,
    name,
    category,
    summary,
    description: summary,
    features,
    audience: 'Homeowners in the service area',
    duration,
    image: '/media/roof-hero.svg',
    imageAlt: 'Abstract roofline and shingle course line work'
  };
}

export function buildRoofingContent({ lead, city, region }: VerticalContext): VerticalContent {
  const where = city ? ` in ${city}` : region ? ` in ${region}` : '';

  return {
    descriptor: 'Roofing contractor',
    eyebrow: `Roofing & storm repair${where}`,
    headline: 'Storm damage handled from first inspection to final nail.',
    subhead: `${lead.name} inspects the roof, documents what it finds, and tells you what needs fixing now versus what can wait. No pressure, no vague estimates.`,
    requestLabel: 'inspection request',
    ctas: {
      primary: 'Book an inspection',
      primaryHref: '/#booking',
      secondary: 'What we inspect',
      secondaryHref: '/#inspect'
    },
    nav: [
      { label: 'Inspection', href: '/#inspect' },
      { label: 'Our process', href: '/#process' },
      { label: 'Reviews', href: '/#reviews' },
      { label: 'Get an estimate', href: '/#booking' }
    ],
    images: {
      hero: '/media/roof-hero.svg',
      heroAlt: 'Abstract roofline and shingle course line work'
    },
    offerings: [
      offering(
        'storm-inspection',
        'Storm & hail inspection',
        'Assess',
        'A documented inspection after a storm, with photos of anything the roof is holding onto.',
        ['Full roof and flashing check', 'Photo documentation', 'Clear repair-or-monitor call'],
        'Same-week scheduling'
      ),
      offering(
        'repair',
        'Leak tracing & repair',
        'Fix',
        'Find where the water is actually getting in, then repair that path instead of guessing.',
        ['Leak source tracing', 'Flashing and seal repair', 'Repair notes for your records'],
        'Usually one visit'
      ),
      offering(
        'replacement',
        'Roof replacement',
        'Replace',
        'A full tear-off and replacement scoped in writing before work begins.',
        ['Written scope and materials list', 'Tear-off and deck review', 'Cleanup and final walkthrough'],
        'Multi-day project'
      ),
      offering(
        'gutters',
        'Gutters & drainage',
        'Water management',
        'Gutters, downspouts and drainage that move water away from the structure.',
        ['Gutter condition check', 'Clog and pitch issues', 'Downspout routing review'],
        'One to two visits'
      ),
      offering(
        'documentation',
        'Storm & insurance documentation',
        'Paperwork',
        'Organised photos and notes you can hand to an insurer or adjuster for your claim.',
        ['Dated photo set', 'Damage summary', 'Supporting measurements'],
        'Within a few days'
      ),
      offering(
        'maintenance',
        'Maintenance & checkups',
        'Prevent',
        'Seasonal checks that catch small failures before they become ceiling stains.',
        ['Annual inspection', 'Sealant and flashing upkeep', 'Priority repair list'],
        'Scheduled annually'
      )
    ],
    process: [
      {
        title: 'Inspect',
        body: 'We get on the roof, check the deck, flashing and penetrations, and photograph what matters.'
      },
      {
        title: 'Document',
        body: 'You get a written summary: what is damaged, what is wear, and what can wait.'
      },
      {
        title: 'Approve',
        body: 'Nothing is torn off until you approve a written scope and price.'
      },
      {
        title: 'Install & verify',
        body: 'The work is completed, the site is cleared, and you get a final walkthrough.'
      }
    ],
    faq: [
      {
        question: 'Do you handle storm claims?',
        answer: 'We document the damage with dated photos and a written summary you can give your insurer. The claim and its approval are between you and your provider.'
      },
      {
        question: 'How long does a replacement take?',
        answer: 'Most residential replacements take a few days depending on size, weather and the condition of the deck. You get a realistic window in the written scope.'
      },
      {
        question: 'Can you just repair one section?',
        answer: 'Often yes. If a section can be repaired safely and matched, we will say so. If the roof is at the end of its life, we will show you why.'
      },
      {
        question: 'When should a roof be inspected?',
        answer: 'After any major storm, and once a year otherwise. Early inspection is what keeps a small flashing failure from becoming a ceiling repair.'
      }
    ]
  };
}
