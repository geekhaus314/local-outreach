import type { VerticalId } from '$lib/verticals/types.ts';

export type VerticalThemeId =
  | 'hair-restoration-clinical'
  | 'smp-ink'
  | 'laser-precision'
  | 'salon-wellness'
  | 'restaurant-luxury'
  | 'automotive-industrial'
  | 'roofing-storm'
  | 'hvac-service'
  | 'plumbing-emergency'
  | 'electrical-circuit'
  | 'dental-clinical'
  | 'veterinary-warm'
  | 'retail-boutique'
  | 'general-honest';

export interface VerticalThemeTokens {
  name: VerticalThemeId;
  label: string;
  description: string;
  // Color system
  background: string;
  backgroundAlt: string;
  surface: string;
  surfaceStrong: string;
  surfaceInverted: string;
  text: string;
  textMuted: string;
  textInverted: string;
  brand: string;
  brandContrast: string;
  accent: string;
  accentContrast: string;
  border: string;
  borderStrong: string;
  focus: string;
  // Typography
  fontDisplay: string;
  fontBody: string;
  fontMono: string;
  // Geometry
  radius: string;
  radiusSm: string;
  radiusLg: string;
  // Depth
  shadow: string;
  shadowStrong: string;
  // Chrome color (used for browser UI / header tint)
  chromeColor: string;
  // Vertical-specific accents
  accent2: string;
  accent3: string;
}

// Each vertical gets its own complete design system. No shared startup tropes:
// no gradient sheens, no pill radii, no hover lift, no glow shadows, no
// reveal-on-scroll, no striped placeholders. Distinct typography, color,
// geometry, and layout per category.

export const VERTICAL_THEMES: Record<VerticalThemeId, VerticalThemeTokens> = {
  'hair-restoration-clinical': {
    name: 'hair-restoration-clinical',
    label: 'Hair Restoration — Clinical',
    description: 'Surgical precision. Deep navy, sterile white, single accent. Built for transplant and restoration practices where trust is everything.',
    background: '#ffffff',
    backgroundAlt: '#f4f6f8',
    surface: '#ffffff',
    surfaceStrong: '#e8ecf0',
    surfaceInverted: '#0b1320',
    text: '#0b1320',
    textMuted: '#475569',
    textInverted: '#ffffff',
    brand: '#0b1320',
    brandContrast: '#ffffff',
    accent: '#7c3aed',
    accentContrast: '#ffffff',
    border: '#cbd5e1',
    borderStrong: '#94a3b8',
    focus: '#7c3aed',
    fontDisplay: '"Playfair Display", Georgia, "Times New Roman", serif',
    fontBody: '"Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    fontMono: '"Source Code Pro", ui-monospace, SFMono-Regular, Menlo, monospace',
    radius: '0px',
    radiusSm: '0px',
    radiusLg: '0px',
    shadow: '0 24px 60px -38px rgb(11 19 32 / 0.35)',
    shadowStrong: '0 40px 100px -50px rgb(11 19 32 / 0.45)',
    chromeColor: '#0b1320',
    accent2: '#be185d',
    accent3: '#0f766e'
  },
  'smp-ink': {
    name: 'smp-ink',
    label: 'SMP — Ink & Oxblood',
    description: 'High-contrast ink on cream. Hairline rules, serif display, service-menu layout. Built for scalp micropigmentation studios where visual proof is everything.',
    background: '#faf7f2',
    backgroundAlt: '#efe9de',
    surface: '#ffffff',
    surfaceStrong: '#e4dccd',
    surfaceInverted: '#1a1a1a',
    text: '#1a1a1a',
    textMuted: '#6b6257',
    textInverted: '#faf7f2',
    brand: '#1a1a1a',
    brandContrast: '#faf7f2',
    accent: '#7f1d1d',
    accentContrast: '#ffffff',
    border: '#ddd3c3',
    borderStrong: '#b9a887',
    focus: '#7f1d1d',
    fontDisplay: '"Playfair Display", Georgia, "Times New Roman", serif',
    fontBody: '"Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    fontMono: '"Source Code Pro", ui-monospace, SFMono-Regular, Menlo, monospace',
    radius: '0px',
    radiusSm: '0px',
    radiusLg: '0px',
    shadow: '0 24px 60px -38px rgb(26 26 26 / 0.45)',
    shadowStrong: '0 40px 100px -50px rgb(26 26 26 / 0.55)',
    chromeColor: '#1a1a1a',
    accent2: '#991b1b',
    accent3: '#b45309'
  },
  'laser-precision': {
    name: 'laser-precision',
    label: 'Laser Therapy — Precision',
    description: 'Cold clinical white with a single electric accent. Built for LLLT and laser hair therapy where technology is the selling point.',
    background: '#ffffff',
    backgroundAlt: '#f8fafc',
    surface: '#ffffff',
    surfaceStrong: '#f1f5f9',
    surfaceInverted: '#0f172a',
    text: '#0f172a',
    textMuted: '#475569',
    textInverted: '#ffffff',
    brand: '#0f172a',
    brandContrast: '#ffffff',
    accent: '#0ea5e9',
    accentContrast: '#ffffff',
    border: '#e2e8f0',
    borderStrong: '#94a3b8',
    focus: '#0ea5e9',
    fontDisplay: '"Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    fontBody: '"Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    fontMono: '"Source Code Pro", ui-monospace, SFMono-Regular, Menlo, monospace',
    radius: '2px',
    radiusSm: '1px',
    radiusLg: '4px',
    shadow: '0 18px 50px -28px rgb(15 23 42 / 0.25)',
    shadowStrong: '0 30px 80px -40px rgb(15 23 42 / 0.35)',
    chromeColor: '#0f172a',
    accent2: '#0891b2',
    accent3: '#0f172a'
  },
  'salon-wellness': {
    name: 'salon-wellness',
    label: 'Salon — Modern Wellness',
    description: 'Calm organic curves. Forest, sand, generous radius. Built for salons and barbershops where atmosphere matters as much as the cut.',
    background: '#faf7f2',
    backgroundAlt: '#efe9de',
    surface: '#ffffff',
    surfaceStrong: '#e4dccd',
    surfaceInverted: '#2f4f4f',
    text: '#1f2a2a',
    textMuted: '#5c6b6b',
    textInverted: '#faf7f2',
    brand: '#2f4f4f',
    brandContrast: '#faf7f2',
    accent: '#c2a878',
    accentContrast: '#1f2a2a',
    border: '#ddd3c3',
    borderStrong: '#b9a887',
    focus: '#2f4f4f',
    fontDisplay: '"Plus Jakarta Sans", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    fontBody: '"Plus Jakarta Sans", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    fontMono: '"Source Code Pro", ui-monospace, SFMono-Regular, Menlo, monospace',
    radius: '16px',
    radiusSm: '10px',
    radiusLg: '24px',
    shadow: '0 24px 60px -34px rgb(47 79 79 / 0.32)',
    shadowStrong: '0 40px 100px -50px rgb(47 79 79 / 0.42)',
    chromeColor: '#2f4f4f',
    accent2: '#8b4513',
    accent3: '#5c6b6b'
  },
  'restaurant-luxury': {
    name: 'restaurant-luxury',
    label: 'Restaurant — Premium Luxury',
    description: 'Private-studio restraint. Charcoal, cream, restrained gold. Built for restaurants where the food is the hero and the site gets out of the way.',
    background: '#fdfdfb',
    backgroundAlt: '#f5f1e8',
    surface: '#ffffff',
    surfaceStrong: '#1a1a1a',
    surfaceInverted: '#1a1a1a',
    text: '#1a1a1a',
    textMuted: '#6b6257',
    textInverted: '#fdfdfb',
    brand: '#1a1a1a',
    brandContrast: '#fdfdfb',
    accent: '#d4af37',
    accentContrast: '#1a1a1a',
    border: '#e6dfd2',
    borderStrong: '#b9a887',
    focus: '#d4af37',
    fontDisplay: '"Playfair Display", Georgia, "Times New Roman", serif',
    fontBody: '"Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    fontMono: '"Source Code Pro", ui-monospace, SFMono-Regular, Menlo, monospace',
    radius: '0px',
    radiusSm: '0px',
    radiusLg: '0px',
    shadow: '0 24px 60px -38px rgb(26 26 26 / 0.45)',
    shadowStrong: '0 40px 100px -50px rgb(26 26 26 / 0.55)',
    chromeColor: '#0a0a0a',
    accent2: '#b45309',
    accent3: '#6b6257'
  },
  'automotive-industrial': {
    name: 'automotive-industrial',
    label: 'Automotive — Industrial',
    description: 'Deep charcoal, electric orange, high contrast. Built for auto repair where structure and repair are the message.',
    background: '#0f172a',
    backgroundAlt: '#1e293b',
    surface: '#1e293b',
    surfaceStrong: '#334155',
    surfaceInverted: '#f8fafc',
    text: '#f8fafc',
    textMuted: '#94a3b8',
    textInverted: '#0f172a',
    brand: '#f8fafc',
    brandContrast: '#0f172a',
    accent: '#f97316',
    accentContrast: '#0f172a',
    border: '#334155',
    borderStrong: '#64748b',
    focus: '#f97316',
    fontDisplay: '"Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    fontBody: '"Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    fontMono: '"Source Code Pro", ui-monospace, SFMono-Regular, Menlo, monospace',
    radius: '4px',
    radiusSm: '2px',
    radiusLg: '8px',
    shadow: '0 30px 80px -40px rgb(15 23 42 / 0.5)',
    shadowStrong: '0 50px 120px -60px rgb(15 23 42 / 0.6)',
    chromeColor: '#0f172a',
    accent2: '#ea580c',
    accent3: '#94a3b8'
  },
  'roofing-storm': {
    name: 'roofing-storm',
    label: 'Roofing — Storm',
    description: 'Weathered slate, storm blue, structural lines. Built for roofing where durability and inspection are the selling points.',
    background: '#f1f5f9',
    backgroundAlt: '#e2e8f0',
    surface: '#ffffff',
    surfaceStrong: '#cbd5e1',
    surfaceInverted: '#1e293b',
    text: '#1e293b',
    textMuted: '#64748b',
    textInverted: '#f8fafc',
    brand: '#1e293b',
    brandContrast: '#f8fafc',
    accent: '#0284c7',
    accentContrast: '#ffffff',
    border: '#94a3b8',
    borderStrong: '#475569',
    focus: '#0284c7',
    fontDisplay: '"Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    fontBody: '"Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    fontMono: '"Source Code Pro", ui-monospace, SFMono-Regular, Menlo, monospace',
    radius: '0px',
    radiusSm: '0px',
    radiusLg: '0px',
    shadow: '0 20px 50px -30px rgb(30 41 59 / 0.3)',
    shadowStrong: '0 35px 90px -45px rgb(30 41 59 / 0.4)',
    chromeColor: '#1e293b',
    accent2: '#0369a1',
    accent3: '#64748b'
  },
  'hvac-service': {
    name: 'hvac-service',
    label: 'HVAC — Service',
    description: 'Clean clinical blue-white with service-truck orange. Built for heating and cooling where emergency response is the value.',
    background: '#ffffff',
    backgroundAlt: '#f0f9ff',
    surface: '#ffffff',
    surfaceStrong: '#bae6fd',
    surfaceInverted: '#0c4a6e',
    text: '#0c4a6e',
    textMuted: '#475569',
    textInverted: '#ffffff',
    brand: '#0c4a6e',
    brandContrast: '#ffffff',
    accent: '#f97316',
    accentContrast: '#0c4a6e',
    border: '#bfdbfe',
    borderStrong: '#93c5fd',
    focus: '#f97316',
    fontDisplay: '"Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    fontBody: '"Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    fontMono: '"Source Code Pro", ui-monospace, SFMono-Regular, Menlo, monospace',
    radius: '6px',
    radiusSm: '3px',
    radiusLg: '12px',
    shadow: '0 18px 50px -28px rgb(12 74 110 / 0.25)',
    shadowStrong: '0 30px 80px -40px rgb(12 74 110 / 0.35)',
    chromeColor: '#0c4a6e',
    accent2: '#ea580c',
    accent3: '#0369a1'
  },
  'plumbing-emergency': {
    name: 'plumbing-emergency',
    label: 'Plumbing — Emergency',
    description: 'Deep navy with copper accents. Built for plumbing where trust and 24-hour response are everything.',
    background: '#ffffff',
    backgroundAlt: '#f8fafc',
    surface: '#ffffff',
    surfaceStrong: '#e2e8f0',
    surfaceInverted: '#0f172a',
    text: '#0f172a',
    textMuted: '#475569',
    textInverted: '#ffffff',
    brand: '#0f172a',
    brandContrast: '#ffffff',
    accent: '#b45309',
    accentContrast: '#ffffff',
    border: '#cbd5e1',
    borderStrong: '#94a3b8',
    focus: '#b45309',
    fontDisplay: '"Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    fontBody: '"Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    fontMono: '"Source Code Pro", ui-monospace, SFMono-Regular, Menlo, monospace',
    radius: '0px',
    radiusSm: '0px',
    radiusLg: '0px',
    shadow: '0 20px 50px -30px rgb(15 23 42 / 0.3)',
    shadowStrong: '0 35px 90px -45px rgb(15 23 42 / 0.4)',
    chromeColor: '#0f172a',
    accent2: '#92400e',
    accent3: '#64748b'
  },
  'electrical-circuit': {
    name: 'electrical-circuit',
    label: 'Electrical — Circuit',
    description: 'Dark slate with safety yellow highlights. Built for electrical where safety and permits are the message.',
    background: '#0f172a',
    backgroundAlt: '#1e293b',
    surface: '#1e293b',
    surfaceStrong: '#334155',
    surfaceInverted: '#f8fafc',
    text: '#f8fafc',
    textMuted: '#94a3b8',
    textInverted: '#0f172a',
    brand: '#f8fafc',
    brandContrast: '#0f172a',
    accent: '#eab308',
    accentContrast: '#0f172a',
    border: '#334155',
    borderStrong: '#64748b',
    focus: '#eab308',
    fontDisplay: '"Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    fontBody: '"Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    fontMono: '"Source Code Pro", ui-monospace, SFMono-Regular, Menlo, monospace',
    radius: '4px',
    radiusSm: '2px',
    radiusLg: '8px',
    shadow: '0 30px 80px -40px rgb(15 23 42 / 0.5)',
    shadowStrong: '0 50px 120px -60px rgb(15 23 42 / 0.6)',
    chromeColor: '#0f172a',
    accent2: '#ca8a04',
    accent3: '#94a3b8'
  },
  'dental-clinical': {
    name: 'dental-clinical',
    label: 'Dental — Clinical',
    description: 'Bright sterile white with teal accent. Built for dental where cleanliness and preventive care are the brand.',
    background: '#ffffff',
    backgroundAlt: '#f0fdfa',
    surface: '#ffffff',
    surfaceStrong: '#ccfbf1',
    surfaceInverted: '#0f766e',
    text: '#0f766e',
    textMuted: '#475569',
    textInverted: '#ffffff',
    brand: '#0f766e',
    brandContrast: '#ffffff',
    accent: '#0ea5e9',
    accentContrast: '#0f766e',
    border: '#99f6e4',
    borderStrong: '#5eead4',
    focus: '#0ea5e9',
    fontDisplay: '"Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    fontBody: '"Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    fontMono: '"Source Code Pro", ui-monospace, SFMono-Regular, Menlo, monospace',
    radius: '8px',
    radiusSm: '4px',
    radiusLg: '16px',
    shadow: '0 16px 48px -24px rgb(15 118 110 / 0.2)',
    shadowStrong: '0 28px 75px -35px rgb(15 118 110 / 0.3)',
    chromeColor: '#0f766e',
    accent2: '#115e59',
    accent3: '#475569'
  },
  'veterinary-warm': {
    name: 'veterinary-warm',
    label: 'Veterinary — Warm',
    description: 'Soft sage and warm cream. Built for veterinary and pet care where empathy and approachability win clients.',
    background: '#faf7f2',
    backgroundAlt: '#f3e9d8',
    surface: '#ffffff',
    surfaceStrong: '#e4dccd',
    surfaceInverted: '#2f4f4f',
    text: '#1f2a2a',
    textMuted: '#5c6b6b',
    textInverted: '#faf7f2',
    brand: '#2f4f4f',
    brandContrast: '#faf7f2',
    accent: '#84cc16',
    accentContrast: '#1f2a2a',
    border: '#ddd3c3',
    borderStrong: '#b9a887',
    focus: '#84cc16',
    fontDisplay: '"Plus Jakarta Sans", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    fontBody: '"Plus Jakarta Sans", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    fontMono: '"Source Code Pro", ui-monospace, SFMono-Regular, Menlo, monospace',
    radius: '20px',
    radiusSm: '12px',
    radiusLg: '28px',
    shadow: '0 20px 55px -30px rgb(47 79 79 / 0.28)',
    shadowStrong: '0 38px 95px -48px rgb(47 79 79 / 0.38)',
    chromeColor: '#2f4f4f',
    accent2: '#65a30d',
    accent3: '#5c6b6b'
  },
  'retail-boutique': {
    name: 'retail-boutique',
    label: 'Retail — Boutique',
    description: 'Charcoal with champagne gold. Built for retail where inventory presentation and department structure matter.',
    background: '#fdfdfb',
    backgroundAlt: '#f5f1e8',
    surface: '#ffffff',
    surfaceStrong: '#1a1a1a',
    surfaceInverted: '#1a1a1a',
    text: '#1a1a1a',
    textMuted: '#6b6257',
    textInverted: '#fdfdfb',
    brand: '#1a1a1a',
    brandContrast: '#fdfdfb',
    accent: '#c5a059',
    accentContrast: '#1a1a1a',
    border: '#e6dfd2',
    borderStrong: '#b9a887',
    focus: '#c5a059',
    fontDisplay: '"Playfair Display", Georgia, "Times New Roman", serif',
    fontBody: '"Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    fontMono: '"Source Code Pro", ui-monospace, SFMono-Regular, Menlo, monospace',
    radius: '2px',
    radiusSm: '1px',
    radiusLg: '4px',
    shadow: '0 22px 58px -36px rgb(26 26 26 / 0.38)',
    shadowStrong: '0 38px 98px -48px rgb(26 26 26 / 0.48)',
    chromeColor: '#0a0a0a',
    accent2: '#b45309',
    accent3: '#6b6257'
  },
  'general-honest': {
    name: 'general-honest',
    label: 'General — Honest Fallback',
    description: 'Neutral slate with no invention. Built for unmatched businesses — presents the public listing, never invents services.',
    background: '#f8fafc',
    backgroundAlt: '#e2e8f0',
    surface: '#ffffff',
    surfaceStrong: '#cbd5e1',
    surfaceInverted: '#1e293b',
    text: '#1e293b',
    textMuted: '#64748b',
    textInverted: '#f8fafc',
    brand: '#1e293b',
    brandContrast: '#f8fafc',
    accent: '#0ea5e9',
    accentContrast: '#ffffff',
    border: '#94a3b8',
    borderStrong: '#475569',
    focus: '#0ea5e9',
    fontDisplay: '"Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    fontBody: '"Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    fontMono: '"Source Code Pro", ui-monospace, SFMono-Regular, Menlo, monospace',
    radius: '0px',
    radiusSm: '0px',
    radiusLg: '0px',
    shadow: '0 16px 48px -24px rgb(30 41 59 / 0.18)',
    shadowStrong: '0 28px 75px -35px rgb(30 41 59 / 0.28)',
    chromeColor: '#1e293b',
    accent2: '#0284c7',
    accent3: '#64748b'
  }
};

export function verticalThemeFor(vertical: VerticalId): VerticalThemeTokens {
  const map: Record<VerticalId, VerticalThemeId> = {
    'restaurant': 'restaurant-luxury',
    'automotive': 'automotive-industrial',
    'roofing': 'roofing-storm',
    'hvac': 'hvac-service',
    'plumbing': 'plumbing-emergency',
    'electrical': 'electrical-circuit',
    'dental': 'dental-clinical',
    'orthodontics': 'dental-clinical',
    'landscaping': 'general-honest',
    'pest': 'general-honest',
    'moving': 'general-honest',
    'remodeling': 'general-honest',
    'windows': 'general-honest',
    'salon': 'salon-wellness',
    'veterinary': 'veterinary-warm',
    'retail': 'retail-boutique',
    'painting': 'general-honest',
    'locksmith': 'general-honest',
    'fitness': 'general-honest',
    'pool': 'general-honest',
    'cleaning': 'general-honest',
    'medical': 'hair-restoration-clinical',
    'appliance': 'general-honest',
    'real-estate': 'general-honest',
    'general': 'general-honest'
  };

  // Hair restoration and SMP route to specialized medical themes.
  // If the vertical is medical but the business is specifically hair, use the
  // hair restoration clinical theme.
  const themeId = map[vertical];
  return VERTICAL_THEMES[themeId];
}

export function verticalThemeForKind(kind: string): VerticalThemeTokens {
  const kindMap: Record<string, VerticalThemeId> = {
    'medical-hair': 'hair-restoration-clinical',
    'restoration': 'hair-restoration-clinical',
    'smp': 'smp-ink',
    'medical': 'hair-restoration-clinical',
    'dental': 'dental-clinical',
    'orthodontics': 'dental-clinical',
    'restaurant': 'restaurant-luxury',
    'automotive': 'automotive-industrial',
    'roofing': 'roofing-storm',
    'hvac': 'hvac-service',
    'plumbing': 'plumbing-emergency',
    'electrical': 'electrical-circuit',
    'salon': 'salon-wellness',
    'veterinary': 'veterinary-warm',
    'retail': 'retail-boutique'
  };
  const themeId = kindMap[kind] ?? 'general-honest';
  return VERTICAL_THEMES[themeId];
}

export function listVerticalThemes(): VerticalThemeTokens[] {
  return Object.values(VERTICAL_THEMES);
}
