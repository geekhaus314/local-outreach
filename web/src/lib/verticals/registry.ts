import type { TemplateId } from '$lib/content/types';
import { buildAutomotiveContent } from './automotive/content.ts';
import { VERTICAL_METAS } from './meta.ts';
import { buildRestaurantContent } from './restaurant/content.ts';
import { buildSalonContent } from './salon/content.ts';
import type {
  VerticalComponent,
  VerticalContentBuilder,
  VerticalId,
  VerticalMeta
} from './types.ts';

const META_BY_ID = new Map<VerticalId, VerticalMeta>(VERTICAL_METAS.map((meta) => [meta.id, meta]));
const GENERAL_META = VERTICAL_METAS.find((meta) => meta.id === 'general');

export function getVerticalMeta(id: VerticalId): VerticalMeta {
  const meta = META_BY_ID.get(id) ?? GENERAL_META;
  if (!meta) throw new Error('The general vertical meta is missing.');
  return meta;
}

export function listVerticalMetas(): readonly VerticalMeta[] {
  return VERTICAL_METAS;
}

/**
 * Content builders are pure data modules. They are imported statically so the
 * server content engine and node tests can call them without pulling a Svelte
 * component into the module graph.
 */
export function getVerticalContentBuilder(id: VerticalId): VerticalContentBuilder | null {
  switch (id) {
    case 'salon':
      return buildSalonContent;
    case 'restaurant':
      return buildRestaurantContent;
    case 'automotive':
      return buildAutomotiveContent;
    default:
      return null;
  }
}

/**
 * Component loaders stay async on purpose: only the visited vertical's chunk is
 * fetched. Legacy templates are loaded the same way so this module stays free of
 * static Svelte imports (the content engine imports it).
 */
export async function loadVerticalComponent(id: VerticalId): Promise<VerticalComponent> {
  switch (id) {
    case 'salon':
      return (await import('./salon/SalonVertical.svelte')).default;
    case 'restaurant':
      return (await import('./restaurant/RestaurantSite.svelte')).default;
    case 'automotive':
      return (await import('./automotive/AutomotiveSite.svelte')).default;
    default:
      return loadLegacyTemplate(getVerticalMeta(id).legacyTemplate);
  }
}

async function loadLegacyTemplate(id: TemplateId): Promise<VerticalComponent> {
  switch (id) {
    case 'editorial':
      return (await import('$lib/templates/editorial/EditorialTemplate.svelte')).default;
    case 'service':
      return (await import('$lib/templates/service/ServiceTemplate.svelte')).default;
    case 'menu':
      return (await import('$lib/templates/menu/MenuTemplate.svelte')).default;
    case 'clinic':
      return (await import('$lib/templates/clinic/ClinicTemplate.svelte')).default;
    case 'project':
      return (await import('$lib/templates/project/ProjectTemplate.svelte')).default;
    case 'general':
      return (await import('$lib/templates/general/GeneralTemplate.svelte')).default;
  }
}
