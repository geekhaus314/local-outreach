import type { LocalOutreachProspect } from '$lib/content/types';
import { VERTICAL_IDS, type VerticalId } from './types.ts';

interface TaxonomyRule {
  vertical: VerticalId;
  pattern: RegExp;
}

// Order matters. Name keywords win over the industry field, which is often wrong
// in the source data (for example a barbershop tagged "Restaurant").
const RULES: readonly TaxonomyRule[] = [
  { vertical: 'orthodontics', pattern: /orthodont/ },
  {
    vertical: 'dental',
    pattern: /dentist|dental|oral surgeon|endodont|periodont|teeth|tooth/
  },
  {
    vertical: 'pool',
    pattern: /\bpool\b|hot tub|pool service|pool cleaning/
  },
  {
    vertical: 'medical',
    pattern:
      /hair (loss|restoration|replacement|transplant)|hair system|hairpiece|toupee|\bwig\b|alopecia|tricholog|scalp micropigmentation|\bsmp\b/
  },
  {
    vertical: 'salon',
    pattern: /barber|hair salon|\bsalon\b|stylist|personal care|beauty|\bnail\b|tattoo|\bspa\b|hair\b/
  },
  {
    vertical: 'real-estate',
    pattern: /real estate|realtor|realty|property management|brokerage|homes for sale|listing agent/
  },
  {
    vertical: 'moving',
    pattern: /mover|moving|self-storage|\bstorage\b|trucking|truck rental|logistics|distribution|shipping|mailing|equipment rental|trailer rental/
  },
  {
    vertical: 'automotive',
    pattern: /automotive|auto repair|auto body|mechanic|oil change|transmission|brake|\btire\b|auto glass|auto machine|\bmachine shop\b|auto upholster|auto restoration|auto parts|truck repair|car wash|garage door/
  },
  { vertical: 'roofing', pattern: /roof/ },
  {
    vertical: 'hvac',
    pattern: /hvac|heating|air condition|air duct|furnace|mechanical contractor|home automation|fire alarm|ventilation/
  },
  {
    vertical: 'plumbing',
    pattern: /plumb|water damage|water works|water treatment|septic|drain|excavat|utility contractor/
  },
  {
    vertical: 'electrical',
    pattern: /electrical|electrician|lighting contractor|\bsolar\b|electric\b/
  },
  {
    vertical: 'landscaping',
    pattern: /landscap|lawn|garden|irrigation|\bsod\b|mulch|turf|tree service|arborist|snow removal|nursery/
  },
  {
    vertical: 'pest',
    pattern: /pest|animal control|garbage|waste management|junk removal|exterminat|rodent|wildlife/
  },
  {
    vertical: 'cleaning',
    pattern: /house cleaning|pressure washing|\bmaid\b|janitorial|carpet clean|\bclean/
  },
  {
    vertical: 'veterinary',
    pattern: /veterinar|animal hospital|pet groomer|\bpet\b/
  },
  {
    vertical: 'windows',
    pattern: /window|glass|mirror|screen repair|tint/
  },
  {
    vertical: 'painting',
    pattern: /paint|dry wall|drywall|wallpaper|finishing/
  },
  {
    vertical: 'locksmith',
    pattern: /locksmith|key duplication|\bkey\b/
  },
  {
    vertical: 'fitness',
    pattern: /fitness|\bgym\b|yoga|pilates|crossfit|personal train/
  },
  {
    vertical: 'medical',
    pattern: /doctor|physician|medical clinic|family practice|health|chiropract|clinic|surgeon|dermatolog|physical therapy|surgical center/
  },
  {
    vertical: 'appliance',
    pattern: /appliance repair|appliance service/
  },
  {
    vertical: 'remodeling',
    pattern: /remodel|deck builder|custom home|general contractor|contractor|construction|handyman|flooring|home inspector|builder|bathroom|kitchen|interior design|carpent|siding/
  },
  {
    vertical: 'restaurant',
    pattern: /restaurant|cafe|coffee|bakery|pizzeria|pizza|grill|diner|bistro|tavern|\bbar\b|food|market|catering|juice|smoothie|ice cream|deli/
  },
  {
    vertical: 'retail',
    pattern: /retail|wholesaler|manufacturer|supplier|\bstore\b|\bshop\b|marketplace|hardware|building materials|industrial equipment|home improvement|tool store/
  }
];

const VERTICAL_SET = new Set<string>(VERTICAL_IDS);

export function isVerticalId(value: unknown): value is VerticalId {
  return typeof value === 'string' && VERTICAL_SET.has(value);
}

export function matchVerticalText(text: string): VerticalId {
  const haystack = text.toLowerCase();
  for (const rule of RULES) {
    if (rule.pattern.test(haystack)) return rule.vertical;
  }
  return 'general';
}

export function matchVertical(lead: Pick<LocalOutreachProspect, 'name' | 'industry'>): VerticalId {
  return matchVerticalText(`${lead.name ?? ''} ${lead.industry ?? ''}`);
}
