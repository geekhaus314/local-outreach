import type { Offering } from '$lib/content/types';
import type { VerticalContent, VerticalContext } from '../types.ts';

const IMAGES = {
  table: '/media/restaurant-table.svg',
  takeout: '/media/restaurant-takeout.svg',
  group: '/media/restaurant-group.svg',
  room: '/media/restaurant-room.svg'
} as const;

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

export function buildRestaurantContent({ lead, city, region }: VerticalContext): VerticalContent {
  const area = city ? ` in ${city}` : '';
  const served = [city, region].filter(Boolean).join(', ');

  return {
    descriptor: 'Restaurant',
    eyebrow: `At the table${area}`,
    headline: `A local table${area}, with the details up front.`,
    subhead: `${lead.name} uses this page for the things you need before you go: how to ask about the menu, current hours, group seating, and pickup. Nothing here is guessed.`,
    requestLabel: 'reservation request',
    ctas: {
      primary: 'Ask about a table',
      primaryHref: '/#booking',
      secondary: 'Read the menu notes',
      secondaryHref: '/#menu'
    },
    nav: [
      { label: 'The table', href: '/#menu' },
      { label: 'How it works', href: '/#process' },
      { label: 'Reviews', href: '/#reviews' },
      { label: 'Reserve', href: '/#booking' }
    ],
    images: {
      hero: '/media/restaurant-hero.svg',
      heroAlt: 'Abstract dining-room line work in green, cream and brick'
    },
    offerings: [
      offering(
        'dine-in',
        'Dine In',
        'The dining room',
        'Sit down for a meal and ask the kitchen what is on today.',
        'The menu changes by day and season, so the current menu is confirmed by the restaurant rather than printed here. Call ahead for hours, wait times, and whether a table is available.',
        ['Call for current hours', 'Ask what is on today', 'Confirm seating before you travel'],
        'Guests planning a sit-down meal.',
        'Varies by service',
        IMAGES.table,
        'Abstract place setting with a plate and glass'
      ),
      offering(
        'takeout',
        'Takeout',
        'To go',
        'Order to go when you would rather eat at home.',
        'Takeout timing, packaging, and the current to-go menu are set by the restaurant. Ask directly whether ordering happens by phone or through a separate service.',
        ['Ask for the takeout menu', 'Confirm pickup timing', 'Mention allergies before ordering'],
        'Guests ordering food to go.',
        'Varies by order',
        IMAGES.takeout,
        'Abstract takeaway bag and folded napkin'
      ),
      offering(
        'groups',
        'Groups & Large Tables',
        'Bring people',
        'Ask about seating a group before you invite everyone.',
        'Group seating depends on the day, the size of the party, and the room. Call with the date, time, and headcount so the restaurant can confirm what is possible.',
        ['Call with the party size', 'Confirm the date and time', 'Ask about deposits or minimums'],
        'Guests planning a group meal.',
        'Set by the booking',
        IMAGES.group,
        'Abstract long table with several chairs'
      ),
      offering(
        'private-events',
        'Private Events',
        'The back room',
        'Ask whether the space can be reserved for an event.',
        'Private-event availability is a business decision, not a website promise. Ask about the room, the menu, the deposit, and the cancellation terms before committing.',
        ['Ask about the private space', 'Confirm the menu and deposit', 'Get the cancellation terms in writing'],
        'Guests planning a private gathering.',
        'Set by the event',
        IMAGES.room,
        'Abstract doorway and hanging lights'
      )
    ],
    process: [
      {
        title: 'Check',
        body: 'Call or check the listing for current hours, the day’s menu, and whether the room is open.'
      },
      {
        title: 'Ask',
        body: 'Send the date, time, party size, and any dietary needs. The restaurant confirms what it can do.'
      },
      {
        title: 'Confirm',
        body: 'Wait for the restaurant to confirm the table or pickup time before you make the trip.'
      }
    ],
    faq: [
      {
        question: 'Where can I see the current menu?',
        answer:
          'Ask the restaurant directly. Menus change by day and season, and this preview does not invent dishes or prices.'
      },
      {
        question: 'Do you take reservations?',
        answer:
          'Reservation policy varies. Call the restaurant or send a request with the date, time, and party size so it can confirm.'
      },
      {
        question: 'Can you accommodate dietary restrictions?',
        answer:
          'Ask before ordering. The kitchen can confirm ingredients, cross-contact risk, and whether a modification is possible.'
      },
      {
        question: 'Is there parking?',
        answer:
          'Ask when you call. Parking and access depend on the location, and this page should not promise either.'
      }
    ]
  };
}
