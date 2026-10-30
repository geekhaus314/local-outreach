import type { D1Database, D1Result } from '@cloudflare/workers-types';
import type { BookingRequestRecord, LocalOutreachProspect } from '$lib/content/types';

export interface BusinessRow {
  id: string;
  slug: string;
  name: string;
  industry: string;
  industry_kind: string;
  phone: string;
  address: string;
  website: string;
  email: string;
  traffic_tier: string;
  decision_maker: string;
  classification: string;
  opportunity: number;
  need_score: number;
  value_score: number;
  site_health: number | null;
  rating: number | null;
  review_count: number | null;
  audit_summary: string;
  pitch_facts: string;
  sources: string;
  source_ids: string;
  low_confidence: number;
  maps_url: string;
  last_audited: string;
  persona: string;
  template: string;
  theme: string;
  vertical: string;
  hostnames: string;
  indexable: number;
  status: string;
  lifecycle_status: string;
  created_at: string;
  updated_at: string;
}

export function parseArray(value: string): string[] {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : [];
  } catch {
    return [];
  }
}

export function rowToProspect(row: BusinessRow): LocalOutreachProspect {
  return {
    name: row.name,
    industry: row.industry,
    phone: row.phone,
    address: row.address,
    website: row.website,
    email: row.email,
    traffic_tier: row.traffic_tier,
    decision_maker: row.decision_maker,
    classification: row.classification,
    opportunity: row.opportunity,
    need_score: row.need_score,
    value_score: row.value_score,
    site_health: row.site_health,
    rating: row.rating,
    review_count: row.review_count,
    audit_summary: row.audit_summary,
    pitch_facts: parseArray(row.pitch_facts),
    sources: parseArray(row.sources),
    source_ids: row.source_ids,
    low_confidence: row.low_confidence === 1,
    maps_url: row.maps_url,
    last_audited: row.last_audited,
    persona: row.persona
  };
}

export function prospectToBusiness(
  prospect: LocalOutreachProspect,
  extras: { id: string; slug: string; template: string; theme: string; vertical: string; hostnames: string[]; indexable: boolean }
): Record<string, unknown> {
  return {
    id: extras.id,
    slug: extras.slug,
    name: prospect.name,
    industry: prospect.industry,
    phone: prospect.phone,
    address: prospect.address,
    website: prospect.website,
    email: prospect.email,
    traffic_tier: prospect.traffic_tier,
    decision_maker: prospect.decision_maker,
    classification: prospect.classification,
    opportunity: prospect.opportunity,
    need_score: prospect.need_score,
    value_score: prospect.value_score,
    site_health: prospect.site_health,
    rating: prospect.rating,
    review_count: prospect.review_count,
    audit_summary: prospect.audit_summary,
    pitch_facts: JSON.stringify(prospect.pitch_facts ?? []),
    sources: JSON.stringify(prospect.sources ?? []),
    source_ids: prospect.source_ids,
    low_confidence: prospect.low_confidence ? 1 : 0,
    maps_url: prospect.maps_url,
    last_audited: prospect.last_audited,
    persona: prospect.persona,
    template: extras.template,
    theme: extras.theme,
    vertical: extras.vertical,
    hostnames: JSON.stringify(extras.hostnames),
    indexable: extras.indexable ? 1 : 0
  };
}

export function getDatabase(platform: App.Platform | undefined): D1Database | null {
  return platform?.env?.DB ?? null;
}

export async function findBusinessBySlug(db: D1Database, slug: string): Promise<BusinessRow | null> {
  return db.prepare('SELECT * FROM businesses WHERE slug = ?').bind(slug).first<BusinessRow>();
}

export async function findBusinessByHostname(db: D1Database, hostname: string): Promise<BusinessRow | null> {
  return db
    .prepare(
      `SELECT b.* FROM businesses b, json_each(b.hostnames) AS host
       WHERE host.value = ?
       LIMIT 1`
    )
    .bind(hostname)
    .first<BusinessRow>();
}

export interface BusinessSummary {
  slug: string;
  name: string;
  industry: string;
  industryKind: string;
  vertical: string;
  opportunity: number;
  classification: string;
  rating: number | null;
  reviewCount: number | null;
  status: string;
  lifecycle_status: string;
}

export interface AdminProspect extends BusinessSummary {
  id: string;
  website: string;
  email: string;
  phone: string;
  address: string;
  auditSummary: string;
  siteHealth: number | null;
  trafficTier: string;
  decisionMaker: string;
  lastAudited: string;
  template: string;
  theme: string;
  hostnames: string[];
  indexable: boolean;
  lifecycle_status: string;
  createdAt: string;
  updatedAt: string;
}

export function rowToAdminProspect(row: BusinessRow): AdminProspect {
  return {
    slug: row.slug,
    name: row.name,
    industry: row.industry,
    industryKind: row.industry_kind,
    vertical: row.vertical,
    opportunity: row.opportunity,
    classification: row.classification,
    rating: row.rating,
    reviewCount: row.review_count,
    status: row.status,
    id: row.id,
    website: row.website,
    email: row.email,
    phone: row.phone,
    address: row.address,
    auditSummary: row.audit_summary,
    siteHealth: row.site_health,
    trafficTier: row.traffic_tier,
    decisionMaker: row.decision_maker,
    lastAudited: row.last_audited,
    template: row.template,
    theme: row.theme,
    hostnames: parseArray(row.hostnames),
    indexable: row.indexable === 1,
    lifecycle_status: row.lifecycle_status,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export interface BusinessFilter {
  q?: string;
  vertical?: string;
  kind?: string;
  status?: string;
  lifecycle?: string;
}

export async function listBusinessSummaries(
  db: D1Database,
  filter: BusinessFilter = {}
): Promise<BusinessSummary[]> {
  const clauses: string[] = [];
  const values: unknown[] = [];

  if (filter.q && filter.q.trim()) {
    clauses.push('(name LIKE ? OR industry LIKE ? OR slug LIKE ?)');
    const needle = `%${filter.q.trim()}%`;
    values.push(needle, needle, needle);
  }
  if (filter.vertical) {
    clauses.push('vertical = ?');
    values.push(filter.vertical);
  }
  if (filter.kind) {
    clauses.push('industry_kind = ?');
    values.push(filter.kind);
  }
  if (filter.status) {
    clauses.push('status = ?');
    values.push(filter.status);
  }
  if (filter.lifecycle && filter.lifecycle !== 'all') {
    if (!lifecycleStatusIsValid(filter.lifecycle)) {
      throw new Error(`Unknown lifecycle status: ${filter.lifecycle}`);
    }
    clauses.push('lifecycle_status = ?');
    values.push(filter.lifecycle);
  }

  const where = clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : '';
  const { results } = await db
    .prepare(
      `SELECT slug, name, industry, industry_kind, vertical, opportunity, classification, rating, review_count, status, lifecycle_status
       FROM businesses ${where}
       ORDER BY opportunity DESC, name ASC`
    )
    .bind(...values)
    .all<{
      slug: string;
      name: string;
      industry: string;
      industry_kind: string;
      vertical: string;
      opportunity: number;
      classification: string;
      rating: number | null;
      review_count: number | null;
      status: string;
      lifecycle_status: string;
    }>();

  return (results ?? []).map((row) => ({
    slug: row.slug,
    name: row.name,
    industry: row.industry,
    industryKind: row.industry_kind,
    vertical: row.vertical,
    opportunity: row.opportunity,
    classification: row.classification,
    rating: row.rating,
    reviewCount: row.review_count,
    status: row.status,
    lifecycle_status: row.lifecycle_status
  }));
}
