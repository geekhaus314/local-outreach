import type { Offering } from '$lib/content/types';
import type { VerticalContent, VerticalContext } from '../types.ts';

function listingOffering(
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
    audience: 'Local customers',
    duration,
    image: '/media/general-hero.svg',
    imageAlt: 'Neutral geometric line work'
  };
}

/**
 * Fallback vertical for any local business the taxonomy has not matched yet.
 * It never invents a service list. It presents the public listing (category,
 * location, contact, reputation) and asks the business to confirm the rest,
 * so a prospect is never shown services they do not offer.
 */
export function buildGeneralContent({ lead, city, region }: VerticalContext): VerticalContent {
  const where = city ? ` in ${city}` : region ? ` in ${region}` : '';
  const listed = (lead.industry ?? '').trim();
  const category = listed.length > 0 ? listed : 'Local business';
  const hasRating = lead.rating !== null && lead.rating !== undefined;

  return {
    descriptor: category,
    eyebrow: `Locally owned${where}`,
    headline: `${lead.name}${where}, without the guesswork.`,
    subhead: `This page is built from the public listing for ${lead.name}: category, location, contact details and reviews. The service list is confirmed with the business before anything goes live.`,
    requestLabel: 'request',
    ctas: {
      primary: 'Send a request',
      primaryHref: '/#booking',
      secondary: 'Listing details',
      secondaryHref: '/#details'
    },
    nav: [
      { label: 'Details', href: '/#details' },
      { label: 'Reputation', href: '/#reputation' },
      { label: 'Questions', href: '/#faq' },
      { label: 'Contact', href: '/#booking' }
    ],
    images: {
      hero: '/media/general-hero.svg',
      heroAlt: 'Neutral geometric line work'
    },
    offerings: [
      listingOffering(
        'listed-category',
        category,
        'Public listing',
        `${lead.name} is listed locally under ${category}. The exact services are confirmed with the business, not assumed by this page.`,
        ['Category taken from the public listing', 'Services to be confirmed by the business'],
        'Confirm with the business'
      ),
      listingOffering(
        'consultation',
        'Quotes & consultation',
        'Getting started',
        'Describe what you need and the business replies with scope, timing and price before any work begins.',
        ['Scope confirmed before work starts', 'Contact by the method you choose'],
        'Varies by request'
      ),
      listingOffering(
        'visit',
        'Visit & contact',
        'In person',
        hasRating
          ? `${lead.name} is reviewed locally and can be reached using the details on this page.`
          : `Use the contact details on this page to reach ${lead.name} directly.`,
        ['Location and map link', 'Direct phone contact where listed'],
        'During business hours'
      )
    ],
    process: [
      {
        title: 'Send the request',
        body: 'Share what you need, where you are, and when you would like it done.'
      },
      {
        title: 'The business confirms',
        body: 'You get the scope, the price and the timing in writing from the business.'
      },
      {
        title: 'Details get finalised',
        body: 'The listing page is completed with the business’s real services, hours and photos.'
      }
    ],
    faq: [
      {
        question: 'Are these services final?',
        answer: 'No. This page shows the public listing category and a structure for the business to fill in. The business confirms its own service list, hours and pricing.'
      },
      {
        question: 'How do I reach the business?',
        answer: 'Use the request form on this page or the phone number in the header. The business follows up using the contact details you provide.'
      },
      {
        question: 'Where is the business located?',
        answer: city
          ? `The listing is in ${city}${region ? `, ${region}` : ''}. Use the map link in the footer for directions.`
          : 'Use the request form to ask for the current address and directions.'
      }
    ]
  };
}
