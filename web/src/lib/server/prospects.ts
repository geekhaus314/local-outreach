import { isThemeName } from '$lib/data/themes';
import {
  generateSiteContent,
  normalizeHostname,
  prospectSlug,
  type ContentOptions,
  type LocalOutreachProspect,
  type SiteContent
} from '$lib/data/clinicContent';
import { findBusinessByHostname, findBusinessBySlug, getDatabase, parseArray, rowToProspect } from './db';
import { isVerticalId } from '$lib/verticals/taxonomy';

interface ProspectFile {
  prospect: LocalOutreachProspect;
  hostnames?: string[];
  previewBaseDomain?: string;
  indexable?: boolean;
  siteUrl?: string;
  template?: string;
  theme?: string;
}

type ProspectModule = LocalOutreachProspect | ProspectFile;

const modules = import.meta.glob('../../../prospects/*.json', {
  eager: true,
  import: 'default'
}) as Record<string, ProspectModule>;

function isEnvelope(value: ProspectModule): value is ProspectFile {
  return typeof value === 'object' && value !== null && 'prospect' in value;
}

function contentFromProspect(prospect: LocalOutreachProspect, options: ContentOptions): SiteContent {
  return generateSiteContent(prospect, options);
}

function buildJsonTenants(): SiteContent[] {
  return Object.values(modules).map((value) => {
    const file = isEnvelope(value) ? value : { prospect: value };
    const options: ContentOptions = {
      template: file.template,
      theme: isThemeName(file.theme) ? file.theme : undefined,
      hostnames: file.hostnames,
      previewBaseDomain: file.previewBaseDomain,
      indexable: file.indexable,
      siteUrl: file.siteUrl
    };
    return contentFromProspect(file.prospect, options);
  });
}

let jsonTenants: SiteContent[] | null = null;

function getJsonTenants(): SiteContent[] {
  jsonTenants ??= buildJsonTenants();
  return jsonTenants;
}

function findJsonTenantBySlug(slug: string): SiteContent | null {
  const tenants = getJsonTenants();
  const exact = tenants.find((tenant) => tenant.id === slug);
  if (exact) return exact;
  return tenants.find((tenant) => tenant.id.startsWith(slug)) ?? null;
}

function findJsonTenantByHostname(hostname: string): SiteContent | null {
  const normalized = normalizeHostname(hostname);
  return (
    getJsonTenants().find((tenant) =>
      tenant.hostnames.some((host) => normalizeHostname(host) === normalized)
    ) ?? null
  );
}

function contentFromRow(row: Parameters<typeof rowToProspect>[0]): SiteContent {
  const prospect = rowToProspect(row);
  const theme = isThemeName(row.theme) ? row.theme : undefined;
  return contentFromProspect(prospect, {
    id: row.slug,
    template: row.template,
    theme,
    vertical: isVerticalId(row.vertical) ? row.vertical : undefined,
    hostnames: parseArray(row.hostnames),
    indexable: row.indexable === 1
  });
}

export async function resolveTenant(url: URL, platform?: App.Platform): Promise<SiteContent | null> {
  const explicit = url.searchParams.get('prospect');
  const db = getDatabase(platform);

  if (db) {
    const row = explicit
      ? await findBusinessBySlug(db, explicit)
      : await findBusinessByHostname(db, normalizeHostname(url.hostname));
    if (row) return contentFromRow(row);
  }

  if (explicit) return findJsonTenantBySlug(explicit);
  return findJsonTenantByHostname(url.hostname);
}

export function listProspectSlugs(): string[] {
  return getJsonTenants().map((tenant) => tenant.id);
}

export { prospectSlug };
