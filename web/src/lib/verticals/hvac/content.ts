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
    audience: 'Home and business customers',
    duration,
    image: '/media/hvac-hero.svg',
    imageAlt: 'Abstract airflow and temperature diagram'
  };
}

export function buildHvacContent({ lead, city, region }: VerticalContext): VerticalContent {
  const where = city ? ` in ${city}` : region ? ` in ${region}` : '';

  return {
    descriptor: 'Heating & cooling',
    eyebrow: `HVAC service${where}`,
    headline: 'Comfort that holds on the worst days of the year.',
    subhead: `${lead.name} diagnoses the system before recommending a replacement, and explains the repair options in plain language.`,
    requestLabel: 'service request',
    ctas: {
      primary: 'Request service',
      primaryHref: '/#booking',
      secondary: 'Systems we service',
      secondaryHref: '/#systems'
    },
    nav: [
      { label: 'Systems', href: '/#systems' },
      { label: 'How it works', href: '/#process' },
      { label: 'Reviews', href: '/#reviews' },
      { label: 'Book a visit', href: '/#booking' }
    ],
    images: {
      hero: '/media/hvac-hero.svg',
      heroAlt: 'Abstract airflow and temperature diagram'
    },
    offerings: [
      offering(
        'diagnostics',
        'Diagnostics & tune-ups',
        'Assess',
        'A full check of the system so you know what is failing before it fails completely.',
        ['System and thermostat check', 'Refrigerant and electrical review', 'Written findings'],
        'About an hour'
      ),
      offering(
        'cooling',
        'Air conditioning repair',
        'Cooling',
        'Warm air, weak airflow, leaks or a unit that short-cycles, traced to the cause.',
        ['Fault tracing', 'Component repair or replacement', 'Post-repair temperature check'],
        'Same day in most cases'
      ),
      offering(
        'heating',
        'Furnace & heating repair',
        'Heating',
        'No heat, short cycles or odd smells, diagnosed and repaired safely.',
        ['Ignition and safety check', 'Heat exchanger review', 'Repair with clear scope'],
        'Same day in most cases'
      ),
      offering(
        'maintenance',
        'Maintenance plans',
        'Prevent',
        'Scheduled visits that keep efficiency up and breakdowns down, priced up front.',
        ['Two visits a year', 'Filter and coil care', 'Priority scheduling'],
        'Twice a year'
      ),
      offering(
        'install',
        'Replacement & installation',
        'Install',
        'A correctly sized system, installed and commissioned, not just swapped box-for-box.',
        ['Load and sizing review', 'Written equipment proposal', 'Commissioning and walkthrough'],
        'One to two days'
      ),
      offering(
        'iaq',
        'Indoor air quality',
        'Air quality',
        'Filtration, humidity and ventilation options for the air you actually breathe.',
        ['Filtration review', 'Humidity control options', 'Ventilation advice'],
        'Varies by scope'
      )
    ],
    process: [
      {
        title: 'Diagnose',
        body: 'We measure the system, not just look at it, and tell you what is actually wrong.'
      },
      {
        title: 'Options in writing',
        body: 'Repair and replacement options with prices, so you can decide with the numbers in front of you.'
      },
      {
        title: 'Repair or install',
        body: 'Work is done to spec, with the area protected and the old parts available to see.'
      },
      {
        title: 'Verify comfort',
        body: 'We run the system and confirm the temperature and airflow before we leave.'
      }
    ],
    faq: [
      {
        question: 'Do you offer emergency service?',
        answer: 'Ask when you request service. Availability changes with the season and the time of day.'
      },
      {
        question: 'Is a maintenance plan worth it?',
        answer: 'It depends on the age and use of the system. Ask for the plan details and what it includes before signing up.'
      },
      {
        question: 'How long does a new system take?',
        answer: 'Most residential replacements take one to two days. You get a realistic window in the written proposal.'
      },
      {
        question: 'How often should filters be changed?',
        answer: 'It depends on the filter rating and your home. Ask for a realistic interval for your system during the visit.'
      }
    ]
  };
}
