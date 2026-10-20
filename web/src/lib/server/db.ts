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
}

export async function listBusinessSummaries(db: D1Database): Promise<BusinessSummary[]> {
  const { results } = await db
    .prepare(
      'SELECT slug, name, industry, industry_kind, vertical, opportunity, classification, rating, review_count FROM businesses ORDER BY opportunity DESC, name ASC'
    )
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
    reviewCount: row.review_count
  }));
}

export async function listProspects(db: D1Database): Promise<LocalOutreachProspect[]> {
  const { results } = await db
    .prepare('SELECT * FROM businesses ORDER BY opportunity DESC, name ASC')
    .all<BusinessRow>();
  return (results ?? []).map(rowToProspect);
}

export async function listHostnames(db: D1Database): Promise<Array<{ slug: string; hostnames: string[] }>> {
  const { results } = await db.prepare('SELECT slug, hostnames FROM businesses').all<{
    slug: string;
    hostnames: string;
  }>();
  return (results ?? []).map((row) => ({ slug: row.slug, hostnames: parseArray(row.hostnames) }));
}

export async function upsertProspect(
  db: D1Database,
  prospect: LocalOutreachProspect,
  extras: { id: string; slug: string; template: string; theme: string; vertical: string; hostnames: string[]; indexable: boolean }
): Promise<void> {
  const record = prospectToBusiness(prospect, extras);
  const columns = Object.keys(record);
  const placeholders = columns.map(() => '?').join(', ');
  const updates = columns
    .filter((column) => column !== 'id')
    .map((column) => `${column} = excluded.${column}`)
    .join(', ');

  await db
    .prepare(
      `INSERT INTO businesses (${columns.join(', ')}) VALUES (${placeholders})
       ON CONFLICT(id) DO UPDATE SET ${updates}, updated_at = datetime('now')`
    )
    .bind(...columns.map((column) => record[column]))
    .run();
}

export async function recordBooking(
  db: D1Database,
  record: {
    id: string;
    businessId: string | null;
    businessSlug: string;
    name: string;
    email: string;
    phone: string;
    service: string;
    message: string;
    consent: boolean;
    idempotencyKey: string;
  }
): Promise<void> {
  await db
    .prepare(
      `INSERT INTO bookings
        (id, business_id, business_slug, name, email, phone, service, message, consent, idempotency_key)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(idempotency_key) DO NOTHING`
    )
    .bind(
      record.id,
      record.businessId,
      record.businessSlug,
      record.name,
      record.email,
      record.phone,
      record.service,
      record.message,
      record.consent ? 1 : 0,
      record.idempotencyKey
    )
    .run();
}

export async function listBookings(db: D1Database, limit = 50): Promise<BookingRequestRecord[]> {
  const { results } = await db
    .prepare('SELECT * FROM bookings ORDER BY created_at DESC LIMIT ?')
    .bind(limit)
    .all<{
      id: string;
      business_slug: string;
      name: string;
      email: string;
      phone: string;
      service: string;
      message: string;
      consent: number;
      status: string;
      created_at: string;
    }>();

  return (results ?? []).map((row) => ({
    id: row.id,
    businessSlug: row.business_slug,
    name: row.name,
    email: row.email,
    phone: row.phone,
    service: row.service,
    message: row.message,
    consent: row.consent === 1,
    status: row.status,
    createdAt: row.created_at
  }));
}

