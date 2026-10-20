import type { Offering } from '$lib/content/types';
import type { VerticalContent, VerticalContext } from '../types.ts';

const IMAGES = {
  silhouette: '/media/treatment-systems.svg',
  ribbons: '/media/treatment-extensions.svg',
  arch: '/media/treatment-transplant.svg',
  rings: '/media/treatment-laser.svg'
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

export function buildSalonContent({ lead, city }: VerticalContext): VerticalContent {
  const where = city ? ` in ${city}` : '';
  const text = `${lead.name} ${lead.industry}`.toLowerCase();
  const barber = /barber/.test(text);
  const spa = /spa|wellness/.test(text);

  return {
    descriptor: barber ? 'Barber Shop' : spa ? 'Salon & Spa' : 'Hair Salon',
    eyebrow: barber ? `Barber shop${where}` : `Salon${where}`,
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
        barber
          ? 'A clean cut with a defined line-up and a finish that suits your routine.'
          : 'A cut planned around your hair, face shape, and how much styling you want to do.',
        barber
          ? 'The appointment starts with a short consultation on length, fade, and line-up. The cut is finished with a style and a quick routine you can repeat at home.'
          : 'The consultation covers length, shape, and maintenance before the cut. The finish is styled for your hair type and the time you actually have in the morning.',
        barber
          ? ['Consultation on length and fade', 'Defined line-up', 'Finishing style and product guidance']
          : ['Shape and length consultation', 'Cut for your hair type', 'Styling guidance for home'],
        barber ? 'Clients who want a precise, low-maintenance cut.' : 'Clients who want a cut that works with their routine.',
        'One appointment',
        IMAGES.silhouette,
        'Layered forms suggesting a clean silhouette'
      ),
      offering(
        'color',
        barber ? 'Beard & Grooming' : 'Color & Gloss',
        barber ? 'Grooming' : 'Color',
        barber
          ? 'Beard shaping and grooming finished with the cut.'
          : 'Color, gloss, or tonal work matched to your skin and maintenance plan.',
        barber
          ? 'Beard work is shaped around the jawline and the cut, then finished with a grooming plan that keeps the shape between visits.'
          : 'Color is planned around your starting shade, the amount of upkeep you want, and how your hair has handled color before. The consultation covers the realistic result and the maintenance interval.',
        barber
          ? ['Jawline and cheek line shaping', 'Beard length and texture review', 'Home grooming guidance']
          : ['Color and tone consultation', 'Patch or strand discussion where needed', 'Maintenance plan'],
        barber
          ? 'Clients who want the cut and beard shape maintained together.'
          : 'Clients considering a color change or gloss refresh.',
        barber ? 'Add-on to a cut' : 'Consultation plus service',
        IMAGES.ribbons,
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
        IMAGES.arch,
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
        IMAGES.rings,
        'Soft concentric light rings in blue and charcoal'
      )
    ],
    process: [
      {
        title: 'Consult',
        body: 'Talk through the shape, color, or finish you want and the maintenance you can keep up with.'
      },
      {
        title: 'Service',
        body: 'The appointment is carried out in the order that protects the hair and the finished result.'
      },
      {
        title: 'Aftercare',
        body: 'Leave with the products, timing, and routine needed to keep the result looking intentional.'
      }
    ],
    faq: [
      {
        question: 'Do you take walk-ins?',
        answer:
          'Availability changes by day. Call the shop directly before walking in, or use the appointment form and wait for confirmation.'
      },
      {
        question: 'What should I bring to a color appointment?',
        answer:
          'Bring a photo of the result you want and anything that shows your current color history. If you have had a reaction to color before, mention it before the appointment.'
      },
      {
        question: 'How often should I rebook?',
        answer:
          'The right interval depends on the cut, color, and how fast your hair grows. Ask for a realistic rebooking window before you leave.'
      }
    ]
  };
}
