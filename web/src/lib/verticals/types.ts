import type { Component } from 'svelte';
import type {
  FaqItem,
  IndustryKind,
  LocalOutreachProspect,
  Offering,
  ProcessStep,
  SiteContent,
  TemplateId
} from '$lib/content/types';
import type { ThemeName } from '$lib/data/themes';

export const VERTICAL_IDS = [
  'restaurant',
  'automotive',
  'roofing',
  'hvac',
  'plumbing',
  'electrical',
  'dental',
  'orthodontics',
  'landscaping',
  'pest',
  'moving',
  'remodeling',
  'windows',
  'salon',
  'veterinary',
  'retail',
  'painting',
  'locksmith',
  'fitness',
  'pool',
  'cleaning',
  'medical',
  'appliance',
  'real-estate',
  'general'
] as const;

export type VerticalId = (typeof VERTICAL_IDS)[number];

export type VerticalComponent = Component<{ content: SiteContent }>;

export interface VerticalContext {
  lead: LocalOutreachProspect;
  kind: IndustryKind;
  businessName: string;
  shortName: string;
  city: string;
  region: string;
}

export interface VerticalContent {
  descriptor: string;
  headline: string;
  subhead: string;
  requestLabel: string;
  eyebrow?: string;
  offerings: Offering[];
  process: ProcessStep[];
  faq: FaqItem[];
  ctas?: {
    primary: string;
    primaryHref?: string;
    secondary: string;
    secondaryHref?: string;
  };
  images?: {
    hero: string;
    heroAlt: string;
  };
  nav?: Array<{ label: string; href: string }>;
}

export type VerticalContentBuilder = (context: VerticalContext) => VerticalContent;

export interface VerticalMeta {
  id: VerticalId;
  label: string;
  industryKind: IndustryKind;
  theme: ThemeName;
  legacyTemplate: TemplateId;
  summary: string;
}

export interface VerticalDefinition {
  meta: VerticalMeta;
  buildContent: VerticalContentBuilder;
  load(): Promise<VerticalComponent>;
}
