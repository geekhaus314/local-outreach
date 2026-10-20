import type { ThemeName } from '../data/themes.ts';
import type { VerticalId } from '../verticals/types.ts';

export const CONTENT_SCHEMA_VERSION = 1;

export const TEMPLATE_IDS = [
  'editorial',
  'service',
  'menu',
  'clinic',
  'project',
  'general'
] as const;

export type TemplateId = (typeof TEMPLATE_IDS)[number];

export type IndustryKind =
  | 'restoration'
  | 'medical-hair'
  | 'smp'
  | 'salon'
  | 'home-services'
  | 'restaurant'
  | 'automotive'
  | 'roofing'
  | 'hvac'
  | 'plumbing'
  | 'electrical'
  | 'dental'
  | 'orthodontics'
  | 'medical'
  | 'landscaping'
  | 'pest'
  | 'moving'
  | 'remodeling'
  | 'windows'
  | 'veterinary'
  | 'retail'
  | 'painting'
  | 'locksmith'
  | 'fitness'
  | 'pool'
  | 'cleaning'
  | 'appliance'
  | 'real-estate'
  | 'general';

export type ProspectClassification =
  | 'NO_PRESENCE'
  | 'SOCIAL_ONLY'
  | 'DEAD_SITE'
  | 'NEEDS_REHAB'
  | 'MARKETPLACE_ONLY'
  | 'HAS_DECENT_SITE';

export interface LocalOutreachProspect {
  name: string;
  industry: string;
  phone: string;
  address: string;
  website: string;
  email: string;
  traffic_tier: string;
  decision_maker: string;
  classification: ProspectClassification | string;
  opportunity: number;
  need_score: number;
  value_score: number;
  site_health: number | null;
  rating: number | null;
  review_count: number | null;
  audit_summary: string;
  pitch_facts: string[];
  sources: string[];
  source_ids: string;
  low_confidence: boolean;
  maps_url: string;
  last_audited: string;
  persona: string;
}

export type ProspectMockupOptions = ContentOptions;

export interface ContentOptions {
  id?: string;
  vertical?: VerticalId;
  theme?: ThemeName;
  previewBaseDomain?: string;
  hostnames?: string[];
  indexable?: boolean;
  siteUrl?: string;
  template?: TemplateId | string;
}

export interface Location {
  label: string;
  legalName: string;
  streetAddress: string;
  city: string;
  region: string;
  postalCode: string;
  country: string;
  mapsUrl: string;
  directionsUrl: string;
  geo: { latitude: number; longitude: number } | null;
}

export interface OpeningHours {
  days: string[];
  opens: string;
  closes: string;
}

export interface PhoneRoute {
  display: string;
  dial: string;
  source: string;
}

export interface OfferingPricingTier {
  label: string;
  price: string;
  note?: string;
}

export interface Offering {
  id: string;
  name: string;
  category: string;
  summary: string;
  description: string;
  features: string[];
  audience: string;
  duration: string;
  priceFrom?: string;
  pricing?: OfferingPricingTier[];
  image: string;
  imageAlt: string;
}

export type Treatment = Offering;
export type TreatmentPricingTier = OfferingPricingTier;

export interface ReputationProof {
  rating: number;
  reviewCount: number | null;
  source: string;
}

export interface FaqItem {
  question: string;
  answer: string;
}

export type BookingFieldType = 'text' | 'email' | 'tel' | 'select' | 'textarea';

export interface BookingField {
  name: string;
  label: string;
  type: BookingFieldType;
  required: boolean;
  autocomplete?: 'name' | 'email' | 'tel';
  placeholder?: string;
  options?: Array<{ value: string; label: string }>;
}

export interface BookingConfig {
  endpoint: string;
  fields: BookingField[];
  consentLabel: string;
  privacyHref: string;
  successMessage: string;
  errorMessage: string;
  unavailableMessage: string;
  notification: {
    webhookEnv: string;
    apiKeyEnv: string;
    fromEmailEnv: string;
    subjectPrefix: string;
  };
}

export interface ProcessStep {
  title: string;
  body: string;
}

export interface Business {
  name: string;
  shortName: string;
  descriptor: string;
  tagline: string;
  legalName: string;
  industry: string;
  email: string | null;
  phone: PhoneRoute | null;
  hours: OpeningHours[];
  locations: Location[];
}

export interface BookingRequestRecord {
  id: string;
  businessSlug: string;
  name: string;
  email: string;
  phone: string;
  service: string;
  message: string;
  consent: boolean;
  status: string;
  createdAt: string;
}

export interface SiteContent {
  schemaVersion: number;
  id: string;
  isPreview: boolean;
  hostnames: string[];
  siteUrl: string;
  theme: ThemeName;
  template: TemplateId;
  vertical: VerticalId;
  industryKind: IndustryKind;
  business: Business;
  nav: Array<{ label: string; href: string }>;
  hero: {
    eyebrow: string;
    headline: string;
    subhead: string;
    primaryCta: string;
    primaryHref: string;
    secondaryCta: string;
    secondaryHref: string;
    image: string;
    imageAlt: string;
    trust: string[];
  };
  offerings: Offering[];
  process: ProcessStep[];
  proof: ReputationProof | null;
  faq: FaqItem[];
  booking: BookingConfig;
  seo: {
    title: string;
    description: string;
    noindex: boolean;
  };
}

/**
 * Backwards-compatible shape for existing callers. New code should use SiteContent,
 * business, offerings and process. These aliases are kept so old routes and prospect
 * envelopes keep working while the template layer is swapped.
 */
export interface ClinicContent extends SiteContent {
  brand: Business;
  company: Business;
  treatments: Offering[];
}
