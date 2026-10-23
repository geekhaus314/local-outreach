import type { VerticalMeta } from './types.ts';

export const VERTICAL_METAS: readonly VerticalMeta[] = [
  {
    id: 'restaurant',
    label: 'Restaurant & food service',
    industryKind: 'restaurant',
    theme: 'restaurant-luxury',
    legacyTemplate: 'menu',
    summary: 'Menus, reservations, hours and a food-forward identity.'
  },
  {
    id: 'automotive',
    label: 'Automotive repair',
    industryKind: 'automotive',
    theme: 'automotive-industrial',
    legacyTemplate: 'service',
    summary: 'Diagnostics, repair scope, service bays and quote requests.'
  },
  {
    id: 'roofing',
    label: 'Roofing',
    industryKind: 'roofing',
    theme: 'roofing-storm',
    legacyTemplate: 'project',
    summary: 'Storm damage, inspections, replacement scope and estimates.'
  },
  {
    id: 'hvac',
    label: 'Heating & cooling',
    industryKind: 'hvac',
    theme: 'hvac-service',
    legacyTemplate: 'service',
    summary: 'Repair, maintenance plans, installation and emergency service.'
  },
  {
    id: 'plumbing',
    label: 'Plumbing',
    industryKind: 'plumbing',
    theme: 'plumbing-emergency',
    legacyTemplate: 'service',
    summary: 'Leaks, drains, water heaters and emergency call-outs.'
  },
  {
    id: 'electrical',
    label: 'Electrical',
    industryKind: 'electrical',
    theme: 'electrical-circuit',
    legacyTemplate: 'service',
    summary: 'Panels, wiring, lighting, safety inspections and permits.'
  },
  {
    id: 'dental',
    label: 'Dental',
    industryKind: 'dental',
    theme: 'dental-clinical',
    legacyTemplate: 'clinic',
    summary: 'Preventive care, restorative work, insurance and new patients.'
  },
  {
    id: 'orthodontics',
    label: 'Orthodontics',
    industryKind: 'orthodontics',
    theme: 'dental-clinical',
    legacyTemplate: 'clinic',
    summary: 'Braces, aligners, treatment timelines and consultations.'
  },
  {
    id: 'landscaping',
    label: 'Landscaping & lawn care',
    industryKind: 'landscaping',
    theme: 'general-honest',
    legacyTemplate: 'project',
    summary: 'Design, installation, maintenance and seasonal programs.'
  },
  {
    id: 'pest',
    label: 'Pest control',
    industryKind: 'pest',
    theme: 'general-honest',
    legacyTemplate: 'service',
    summary: 'Inspections, treatment plans, prevention and follow-ups.'
  },
  {
    id: 'moving',
    label: 'Moving & storage',
    industryKind: 'moving',
    theme: 'general-honest',
    legacyTemplate: 'service',
    summary: 'Local moves, packing, storage and booking windows.'
  },
  {
    id: 'remodeling',
    label: 'Remodeling & contracting',
    industryKind: 'remodeling',
    theme: 'general-honest',
    legacyTemplate: 'project',
    summary: 'Kitchens, baths, decks, permits and project timelines.'
  },
  {
    id: 'windows',
    label: 'Windows & glass',
    industryKind: 'windows',
    theme: 'general-honest',
    legacyTemplate: 'service',
    summary: 'Replacement windows, glass, screens and measurement visits.'
  },
  {
    id: 'salon',
    label: 'Salon, barber & personal care',
    industryKind: 'salon',
    theme: 'salon-wellness',
    legacyTemplate: 'editorial',
    summary: 'Stylists, service menus, bookings and walk-in expectations.'
  },
  {
    id: 'veterinary',
    label: 'Veterinary & pet care',
    industryKind: 'veterinary',
    theme: 'veterinary-warm',
    legacyTemplate: 'clinic',
    summary: 'Wellness visits, urgent care, grooming and pet owners.'
  },
  {
    id: 'retail',
    label: 'Retail & suppliers',
    industryKind: 'retail',
    theme: 'retail-boutique',
    legacyTemplate: 'general',
    summary: 'Departments, inventory, hours and in-store pickup.'
  },
  {
    id: 'painting',
    label: 'Painting & finishing',
    industryKind: 'painting',
    theme: 'general-honest',
    legacyTemplate: 'project',
    summary: 'Interior and exterior painting, prep work and estimates.'
  },
  {
    id: 'locksmith',
    label: 'Locksmith',
    industryKind: 'locksmith',
    theme: 'general-honest',
    legacyTemplate: 'service',
    summary: 'Lockouts, rekeying, hardware and response times.'
  },
  {
    id: 'fitness',
    label: 'Fitness & training',
    industryKind: 'fitness',
    theme: 'general-honest',
    legacyTemplate: 'editorial',
    summary: 'Programs, classes, memberships and trial sessions.'
  },
  {
    id: 'pool',
    label: 'Pool & spa service',
    industryKind: 'pool',
    theme: 'general-honest',
    legacyTemplate: 'service',
    summary: 'Openings, closings, maintenance and equipment repair.'
  },
  {
    id: 'cleaning',
    label: 'Cleaning services',
    industryKind: 'cleaning',
    theme: 'general-honest',
    legacyTemplate: 'service',
    summary: 'Recurring cleans, deep cleans, move-outs and quotes.'
  },
  {
    id: 'medical',
    label: 'Medical & health',
    industryKind: 'medical',
    theme: 'hair-restoration-clinical',
    legacyTemplate: 'clinic',
    summary: 'Providers, services, insurance and appointment requests.'
  },
  {
    id: 'appliance',
    label: 'Appliance repair',
    industryKind: 'appliance',
    theme: 'general-honest',
    legacyTemplate: 'service',
    summary: 'Brands serviced, repair visits, diagnostics and warranties.'
  },
  {
    id: 'real-estate',
    label: 'Real estate',
    industryKind: 'real-estate',
    theme: 'general-honest',
    legacyTemplate: 'general',
    summary: 'Listings, neighborhoods, agents and showing requests.'
  },
  {
    id: 'general',
    label: 'General local business',
    industryKind: 'general',
    theme: 'general-honest',
    legacyTemplate: 'general',
    summary: 'Typed fallback for any local business not yet matched to a vertical.'
  }
];
