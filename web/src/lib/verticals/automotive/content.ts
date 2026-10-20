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
    audience: 'Drivers in the service area',
    duration,
    image: '/media/auto-bay.svg',
    imageAlt: 'Abstract service bay line work'
  };
}

export function buildAutomotiveContent(context: VerticalContext): VerticalContent {
  const { shortName, city } = context;
  const area = city ? ` in ${city}` : '';

  return {
    descriptor: 'Automotive repair shop',
    eyebrow: `Independent shop${area}`,
    headline: `Straight answers for what is actually wrong with your car.`,
    subhead: `${shortName} diagnoses the problem before quoting the repair. You get the finding, the options, and a written estimate before anyone turns a wrench.`,
    requestLabel: 'service request',
    ctas: {
      primary: 'Request a diagnosis',
      primaryHref: '/#booking',
      secondary: 'See what we fix',
      secondaryHref: '/#capabilities'
    },
    nav: [
      { label: 'What we fix', href: '/#capabilities' },
      { label: 'How it works', href: '/#process' },
      { label: 'Reviews', href: '/#reviews' },
      { label: 'Request service', href: '/#booking' }
    ],
    images: {
      hero: '/media/auto-hero.svg',
      heroAlt: 'Abstract diagram of a vehicle chassis and diagnostic lines'
    },
    offerings: [
      offering(
        'diagnostics',
        'Diagnostics & check-engine',
        'Find the fault',
        'A real diagnostic pass on the fault codes and the symptoms you describe, not a parts guess.',
        ['Fault-code scan', 'Road test when needed', 'Findings explained in plain language'],
        'Same-day in most cases'
      ),
      offering(
        'brakes',
        'Brakes & suspension',
        'Safety',
        'Pads, rotors, lines, struts and the noises that show up long before a failure.',
        ['Pad and rotor measurement', 'Brake fluid check', 'Suspension inspection'],
        'Usually one day'
      ),
      offering(
        'maintenance',
        'Oil, fluids & scheduled maintenance',
        'Keep it running',
        'The routine work that prevents the expensive repair, tracked against your mileage.',
        ['Oil and filter', 'Fluid levels and condition', 'Maintenance due list'],
        'Under an hour'
      ),
      offering(
        'tires',
        'Tires, alignment & rotation',
        'Road contact',
        'Tread, pressure, wear patterns and alignment so the car tracks straight and tires last.',
        ['Tread depth check', 'Rotation', 'Alignment recommendation'],
        'Same day'
      ),
      offering(
        'electrical',
        'A/C, electrical & batteries',
        'Comfort and starting',
        'No-start conditions, weak batteries, charging faults and A/C that blows warm.',
        ['Battery and charging test', 'A/C performance check', 'Electrical fault tracing'],
        'Varies by fault'
      ),
      offering(
        'pre-purchase',
        'Pre-purchase inspection',
        'Before you buy',
        'An independent look at a used vehicle before money changes hands.',
        ['Underbody and frame check', 'Fluid and leak inspection', 'Written summary'],
        'About an hour'
      )
    ],
    process: [
      {
        title: 'Tell us the symptom',
        body: 'Describe the noise, light or behavior. The more specific you are, the faster the diagnosis.'
      },
      {
        title: 'We diagnose, not guess',
        body: 'Fault codes plus a physical check. You get the finding before any repair is approved.'
      },
      {
        title: 'Approve the estimate',
        body: 'Work only starts after you approve a written estimate. No surprise line items.'
      },
      {
        title: 'Repair and road test',
        body: 'The fix is verified on the road, and the old parts are available if you want to see them.'
      }
    ],
    faq: [
      {
        question: 'Do I need an appointment for a diagnosis?',
        answer: 'Appointments get priority, but call the shop if the car will not start or feels unsafe to drive.'
      },
      {
        question: 'Will you quote before doing the work?',
        answer: 'Yes. Work starts only after you approve a written estimate for the diagnosed repair.'
      },
      {
        question: 'Can you work on my make and model?',
        answer: 'Ask when you request service. Some shops specialize, and this preview should never imply a capability the shop does not have.'
      },
      {
        question: 'What should I bring?',
        answer: 'The keys, any recent service records, and a description of when the problem shows up.'
      }
    ]
  };
}
