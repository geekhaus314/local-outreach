import type { Offering } from '$lib/content/types';
import type { VerticalContent, VerticalContext } from '../types.ts';

const HERO = '/media/vet-hero.svg';
const HERO_ALT = 'Abstract paw print and care cross';

function offering(
  id: string,
  name: string,
  category: string,
  summary: string,
  description: string,
  features: string[],
  audience: string,
  duration: string
): Offering {
  return {
    id,
    name,
    category,
    summary,
    description,
    features,
    audience,
    duration,
    image: HERO,
    imageAlt: HERO_ALT
  };
}

export function buildVeterinaryContent({ lead, city }: VerticalContext): VerticalContent {
  const area = city ? ` in ${city}` : '';

  return {
    descriptor: 'Veterinary care',
    eyebrow: `Animal care${area}`,
    headline: `Care for the animals${area}, with the next step clear.`,
    subhead: `${lead.name} explains how to request a visit, what to bring, and when to call instead of using the form. Emergencies should always go to a phone call first.`,
    requestLabel: 'appointment request',
    ctas: {
      primary: 'Request a visit',
      primaryHref: '/#booking',
      secondary: 'See visit types',
      secondaryHref: '/#care'
    },
    nav: [
      { label: 'Visit types', href: '/#care' },
      { label: 'What to expect', href: '/#process' },
      { label: 'Reviews', href: '/#reviews' },
      { label: 'Request a visit', href: '/#booking' }
    ],
    images: { hero: HERO, heroAlt: HERO_ALT },
    offerings: [
      offering(
        'wellness',
        'Wellness & Vaccines',
        'Routine care',
        'Exams, vaccines, and the questions that come up between visits.',
        'A wellness visit covers the physical exam, the vaccine history, and the preventive care the veterinarian recommends. Ask what is due now and what can wait.',
        ['Physical exam', 'Vaccine and prevention review', 'Next visit interval'],
        'Pets keeping up with routine care.',
        'One visit'
      ),
      offering(
        'sick-visit',
        'Sick Visits',
        'When something changes',
        'For vomiting, limping, itching, or a change you cannot explain.',
        'A sick visit starts with the history and the symptoms. Ask what diagnostics are recommended, what they cost, and what happens if the first step does not answer the question.',
        ['History and symptom review', 'Exam and diagnostics plan', 'Cost discussed before treatment'],
        'Pets showing a new or worsening symptom.',
        'Varies by case'
      ),
      offering(
        'dental',
        'Dental Care',
        'Mouth and teeth',
        'Assessment and cleaning planned by the veterinarian.',
        'Dental care starts with an exam and a plan. Ask whether anesthesia is used, what monitoring is included, and what the recovery at home looks like.',
        ['Oral exam', 'Cleaning plan and estimate', 'Home care guidance'],
        'Pets with tartar, bad breath, or mouth discomfort.',
        'Set by the plan'
      ),
      offering(
        'urgent',
        'Urgent Questions',
        'Call first',
        'Call before using the form for breathing trouble, bleeding, poisoning, or collapse.',
        'Urgent problems need a phone call, not a web request. The team can confirm availability and tell you what to do while you travel. Do not wait for a form reply.',
        ['Call for urgent availability', 'Describe the symptoms', 'Follow the team’s interim advice'],
        'Pets with a sudden or serious problem.',
        'Call now'
      )
    ],
    process: [
      {
        title: 'Tell us what changed',
        body: 'Describe the symptom, when it started, and anything the pet ate or did differently.'
      },
      {
        title: 'Triage',
        body: 'The team decides whether this is a visit, an urgent call, or something you can monitor at home.'
      },
      {
        title: 'Visit and plan',
        body: 'The exam findings and the next step are explained, with the cost discussed before treatment.'
      }
    ],
    faq: [
      {
        question: 'What counts as an emergency?',
        answer:
          'Breathing trouble, collapse, uncontrolled bleeding, suspected poisoning, and a pet that cannot keep water down should be a phone call right away. Do not rely on a form.'
      },
      {
        question: 'Are you accepting new patients?',
        answer:
          'Ask when you request the visit. Availability changes by veterinarian and by the type of appointment.'
      },
      {
        question: 'What should I bring?',
        answer:
          'Bring the vaccine and medical history you have, a list of medications, and a note of when the problem started.'
      },
      {
        question: 'Will I know the cost first?',
        answer:
          'Ask for the exam fee and the recommended diagnostics before treatment. The team can confirm what is included in the estimate.'
      }
    ]
  };
}
