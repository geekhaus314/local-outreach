import type { Offering } from '$lib/content/types';
import type { VerticalContent, VerticalContext } from '../types.ts';

const HERO = '/media/retail-hero.svg';
const HERO_ALT = 'Abstract storefront awning and shelves';

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

export function buildRetailContent({ lead, city }: VerticalContext): VerticalContent {
  const area = city ? ` in ${city}` : '';

  return {
    descriptor: 'Retail store',
    eyebrow: `At the counter${area}`,
    headline: `Check the shelf${area} before you drive.`,
    subhead: `${lead.name} uses this page to take a stock question, confirm pickup, or start a special order. Hours, stock, and policies are confirmed by the store, not guessed here.`,
    requestLabel: 'product request',
    ctas: {
      primary: 'Ask about an item',
      primaryHref: '/#booking',
      secondary: 'See departments',
      secondaryHref: '/#departments'
    },
    nav: [
      { label: 'Departments', href: '/#departments' },
      { label: 'Pickup', href: '/#process' },
      { label: 'Reviews', href: '/#reviews' },
      { label: 'Ask about an item', href: '/#booking' }
    ],
    images: { hero: HERO, heroAlt: HERO_ALT },
    offerings: [
      offering(
        'in-store',
        'In-Store Shopping',
        'The floor',
        'Walk the aisles and ask staff about what is actually in stock.',
        'Stock changes daily. Call before a special trip for a specific item, and ask whether the store can hold it for you.',
        ['Call for current hours', 'Ask whether an item is in stock', 'Ask about holding an item'],
        'Shoppers browsing in person.',
        'Open during store hours'
      ),
      offering(
        'pickup',
        'Pickup & Curbside',
        'Collect',
        'Reserve an item and agree on a pickup window.',
        'Pickup depends on stock and staffing. Confirm the item, the price, the pickup window, and what to bring before you leave.',
        ['Confirm the exact item', 'Agree on a pickup window', 'Ask what to bring for collection'],
        'Shoppers who know what they need.',
        'Same day when in stock'
      ),
      offering(
        'special-order',
        'Special Orders',
        'Order in',
        'Ask the store to order something it does not keep on the shelf.',
        'Special orders involve a lead time and sometimes a deposit. Ask for the expected date, the cancellation terms, and whether the deposit is refundable.',
        ['Ask about lead time', 'Confirm deposit and cancellation terms', 'Get the expected date in writing'],
        'Shoppers looking for a specific item.',
        'Set by the supplier'
      ),
      offering(
        'returns',
        'Returns & Warranty',
        'After the sale',
        'Ask for the return window and warranty terms before you buy.',
        'Return and warranty policies are set by the store and sometimes by the manufacturer. Ask for the policy in writing and keep the receipt.',
        ['Ask for the return window', 'Confirm packaging requirements', 'Keep the receipt and warranty card'],
        'Customers with a recent purchase.',
        'Set by store policy'
      )
    ],
    process: [
      {
        title: 'Check',
        body: 'Send the item name, size, or model number. The store confirms whether it is on the shelf.'
      },
      {
        title: 'Reserve',
        body: 'If it is available, agree on the price and a pickup window before you travel.'
      },
      {
        title: 'Collect',
        body: 'Bring the confirmation and any required ID. Pay and inspect the item at the counter.'
      }
    ],
    faq: [
      {
        question: 'Can you hold an item for me?',
        answer:
          'Ask when you send the request. Holds depend on the item, the store’s policy, and how long you need.'
      },
      {
        question: 'Do you price match?',
        answer:
          'Ask the store directly. A price-match policy is a business decision, and this preview should not invent one.'
      },
      {
        question: 'What is the return window?',
        answer:
          'Ask before you buy and get the answer in writing on the receipt. The window can differ by department or brand.'
      },
      {
        question: 'Can I order something you do not stock?',
        answer:
          'Some items can be special ordered. Ask about the lead time, deposit, and whether the deposit is refundable.'
      }
    ]
  };
}
