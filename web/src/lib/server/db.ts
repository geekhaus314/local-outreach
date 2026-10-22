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
  status: string;
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
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export interface BusinessFilter {
  q?: string;
  vertical?: string;
  kind?: string;
  status?: string;
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

  const where = clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : '';
  const { results } = await db
    .prepare(
      `SELECT slug, name, industry, industry_kind, vertical, opportunity, classification, rating, review_count, status
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
    status: row.status
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

export async function listBookingsByBusiness(
  db: D1Database,
  slug: string,
  limit = 50
): Promise<BookingRequestRecord[]> {
  const { results } = await db
    .prepare('SELECT * FROM bookings WHERE business_slug = ? ORDER BY created_at DESC LIMIT ?')
    .bind(slug, limit)
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

export interface AuditRow {
  id: string;
  business_id: string;
  business_name: string;
  business_slug: string;
  summary: string;
  findings: string;
  site_health: number | null;
  created_at: string;
}

export interface PitchRow {
  id: string;
  business_id: string;
  business_name: string;
  business_slug: string;
  channel: string;
  body: string;
  status: string;
  created_at: string;
}

export interface MockupRow {
  id: string;
  business_id: string;
  business_name: string;
  business_slug: string;
  template: string;
  theme: string;
  content_version: number;
  preview_host: string;
  is_indexable: number;
  created_at: string;
}

export interface JobRunRow {
  id: string;
  kind: string;
  status: string;
  attempts: number;
  payload: string;
  error: string;
  created_at: string;
  updated_at: string;
}

export interface BookingRow {
  id: string;
  business_id: string | null;
  business_slug: string;
  name: string;
  email: string;
  phone: string;
  service: string;
  message: string;
  consent: number;
  status: string;
  idempotency_key: string;
  created_at: string;
}

const BUSINESS_COLUMNS = new Set([
  'name',
  'industry',
  'industry_kind',
  'phone',
  'address',
  'website',
  'email',
  'traffic_tier',
  'decision_maker',
  'classification',
  'opportunity',
  'need_score',
  'value_score',
  'site_health',
  'rating',
  'review_count',
  'audit_summary',
  'pitch_facts',
  'sources',
  'source_ids',
  'low_confidence',
  'maps_url',
  'last_audited',
  'persona',
  'template',
  'theme',
  'vertical',
  'hostnames',
  'indexable',
  'status'
]);

function businessValue(column: string, value: unknown): unknown {
  if ((column === 'pitch_facts' || column === 'sources' || column === 'hostnames') && Array.isArray(value)) {
    return JSON.stringify(value);
  }
  if ((column === 'low_confidence' || column === 'indexable') && typeof value === 'boolean') {
    return value ? 1 : 0;
  }
  return value ?? '';
}

export async function getBusiness(db: D1Database, id: string): Promise<BusinessRow | null> {
  return db.prepare('SELECT * FROM businesses WHERE id = ?').bind(id).first<BusinessRow>();
}

export async function updateBusiness(db: D1Database, id: string, patch: Record<string, unknown>): Promise<boolean> {
  const entries = Object.entries(patch).filter(
    ([column]) => BUSINESS_COLUMNS.has(column) && column !== 'id' && column !== 'slug'
  );
  if (entries.length === 0) {
    return false;
  }

  const setClause = entries.map(([column]) => `${column} = ?`).join(', ');
  await db
    .prepare(`UPDATE businesses SET ${setClause}, updated_at = datetime('now') WHERE id = ?`)
    .bind(...entries.map(([column, value]) => businessValue(column, value)), id)
    .run();

  return true;
}

export async function deleteBusiness(db: D1Database, id: string): Promise<void> {
  await db
    .batch([
      db.prepare('DELETE FROM audits WHERE business_id = ?').bind(id),
      db.prepare('DELETE FROM pitches WHERE business_id = ?').bind(id),
      db.prepare('DELETE FROM mockups WHERE business_id = ?').bind(id),
      db.prepare('DELETE FROM businesses WHERE id = ?').bind(id)
    ]);
}

export async function nextMockupVersion(db: D1Database, businessId: string): Promise<number> {
  const row = await db
    .prepare('SELECT MAX(content_version) AS latest FROM mockups WHERE business_id = ?')
    .bind(businessId)
    .first<{ latest: number | null }>();
  return (row?.latest ?? 0) + 1;
}

export async function listAudits(db: D1Database, businessId?: string): Promise<AuditRow[]> {
  const base = `SELECT a.*, b.name AS business_name, b.slug AS business_slug
    FROM audits a LEFT JOIN businesses b ON b.id = a.business_id`;
  const query = businessId
    ? `${base} WHERE a.business_id = ? ORDER BY a.created_at DESC`
    : `${base} ORDER BY a.created_at DESC`;
  const { results } = businessId
    ? await db.prepare(query).bind(businessId).all<AuditRow>()
    : await db.prepare(query).all<AuditRow>();
  return results ?? [];
}

export async function getAudit(db: D1Database, id: string): Promise<AuditRow | null> {
  return db
    .prepare(
      `SELECT a.*, b.name AS business_name, b.slug AS business_slug
       FROM audits a LEFT JOIN businesses b ON b.id = a.business_id
       WHERE a.id = ?`
    )
    .bind(id)
    .first<AuditRow>();
}

export async function insertAudit(
  db: D1Database,
  record: { id: string; businessId: string; summary: string; findings: string[]; siteHealth: number | null }
): Promise<void> {
  await db
    .prepare('INSERT INTO audits (id, business_id, summary, findings, site_health) VALUES (?, ?, ?, ?, ?)')
    .bind(record.id, record.businessId, record.summary, JSON.stringify(record.findings), record.siteHealth)
    .run();
}

export async function updateAudit(
  db: D1Database,
  id: string,
  patch: { summary?: string; findings?: string[]; siteHealth?: number | null }
): Promise<void> {
  const sets: string[] = [];
  const values: unknown[] = [];
  if (patch.summary !== undefined) {
    sets.push('summary = ?');
    values.push(patch.summary);
  }
  if (patch.findings !== undefined) {
    sets.push('findings = ?');
    values.push(JSON.stringify(patch.findings));
  }
  if (patch.siteHealth !== undefined) {
    sets.push('site_health = ?');
    values.push(patch.siteHealth);
  }
  if (sets.length === 0) return;
  await db.prepare(`UPDATE audits SET ${sets.join(', ')} WHERE id = ?`).bind(...values, id).run();
}

export async function deleteAudit(db: D1Database, id: string): Promise<void> {
  await db.prepare('DELETE FROM audits WHERE id = ?').bind(id).run();
}

export async function listPitches(db: D1Database, businessId?: string): Promise<PitchRow[]> {
  const base = `SELECT p.*, b.name AS business_name, b.slug AS business_slug
    FROM pitches p LEFT JOIN businesses b ON b.id = p.business_id`;
  const query = businessId
    ? `${base} WHERE p.business_id = ? ORDER BY p.created_at DESC`
    : `${base} ORDER BY p.created_at DESC`;
  const { results } = businessId
    ? await db.prepare(query).bind(businessId).all<PitchRow>()
    : await db.prepare(query).all<PitchRow>();
  return results ?? [];
}

export async function getPitch(db: D1Database, id: string): Promise<PitchRow | null> {
  return db
    .prepare(
      `SELECT p.*, b.name AS business_name, b.slug AS business_slug
       FROM pitches p LEFT JOIN businesses b ON b.id = p.business_id
       WHERE p.id = ?`
    )
    .bind(id)
    .first<PitchRow>();
}

export async function insertPitch(
  db: D1Database,
  record: { id: string; businessId: string; channel: string; body: string; status?: string }
): Promise<void> {
  await db
    .prepare('INSERT INTO pitches (id, business_id, channel, body, status) VALUES (?, ?, ?, ?, ?)')
    .bind(record.id, record.businessId, record.channel, record.body, record.status ?? 'draft')
    .run();
}

export async function updatePitch(db: D1Database, id: string, patch: Record<string, unknown>): Promise<void> {
  const entries = Object.entries(patch).filter(([column]) => ['channel', 'body', 'status'].includes(column));
  if (entries.length === 0) {
    return;
  }
  const setClause = entries.map(([column]) => `${column} = ?`).join(', ');
  await db
    .prepare(`UPDATE pitches SET ${setClause} WHERE id = ?`)
    .bind(...entries.map(([, value]) => value ?? ''), id)
    .run();
}

export async function deletePitch(db: D1Database, id: string): Promise<void> {
  await db.prepare('DELETE FROM pitches WHERE id = ?').bind(id).run();
}

export async function updateMockup(
  db: D1Database,
  id: string,
  patch: { template?: string; theme?: string; previewHost?: string; isIndexable?: boolean }
): Promise<void> {
  const sets: string[] = [];
  const values: unknown[] = [];
  if (patch.template !== undefined) {
    sets.push('template = ?');
    values.push(patch.template);
  }
  if (patch.theme !== undefined) {
    sets.push('theme = ?');
    values.push(patch.theme);
  }
  if (patch.previewHost !== undefined) {
    sets.push('preview_host = ?');
    values.push(patch.previewHost);
  }
  if (patch.isIndexable !== undefined) {
    sets.push('is_indexable = ?');
    values.push(patch.isIndexable ? 1 : 0);
  }
  if (sets.length === 0) return;
  await db.prepare(`UPDATE mockups SET ${sets.join(', ')} WHERE id = ?`).bind(...values, id).run();
}

export async function deleteMockup(db: D1Database, id: string): Promise<void> {
  await db.prepare('DELETE FROM mockups WHERE id = ?').bind(id).run();
}

export async function listMockups(db: D1Database, businessId?: string): Promise<MockupRow[]> {
  const query = businessId
    ? 'SELECT * FROM mockups WHERE business_id = ? ORDER BY created_at DESC'
    : 'SELECT * FROM mockups ORDER BY created_at DESC';
  const { results } = businessId
    ? await db.prepare(query).bind(businessId).all<MockupRow>()
    : await db.prepare(query).all<MockupRow>();
  return results ?? [];
}

export async function getMockup(db: D1Database, id: string): Promise<MockupRow | null> {
  return db.prepare('SELECT * FROM mockups WHERE id = ?').bind(id).first<MockupRow>();
}

export async function insertMockup(
  db: D1Database,
  record: {
    id: string;
    businessId: string;
    template: string;
    theme: string;
    contentVersion: number;
    previewHost: string;
    isIndexable: boolean;
  }
): Promise<void> {
  await db
    .prepare(
      'INSERT INTO mockups (id, business_id, template, theme, content_version, preview_host, is_indexable) VALUES (?, ?, ?, ?, ?, ?, ?)'
    )
    .bind(
      record.id,
      record.businessId,
      record.template,
      record.theme,
      record.contentVersion,
      record.previewHost,
      record.isIndexable ? 1 : 0
    )
    .run();
}

export async function listJobRuns(db: D1Database, limit = 50): Promise<JobRunRow[]> {
  const { results } = await db
    .prepare('SELECT * FROM job_runs ORDER BY created_at DESC LIMIT ?')
    .bind(limit)
    .all<JobRunRow>();
  return results ?? [];
}

export async function insertJobRun(
  db: D1Database,
  record: { id: string; kind: string; status?: string; payload?: Record<string, unknown> }
): Promise<void> {
  await db
    .prepare('INSERT INTO job_runs (id, kind, status, attempts, payload, error) VALUES (?, ?, ?, 0, ?, ?)')
    .bind(record.id, record.kind, record.status ?? 'queued', JSON.stringify(record.payload ?? {}), '')
    .run();
}

export async function updateJobRun(
  db: D1Database,
  id: string,
  patch: { status?: string; attempts?: number; error?: string; payload?: Record<string, unknown> }
): Promise<void> {
  const sets: string[] = [];
  const values: unknown[] = [];
  if (patch.status !== undefined) {
    sets.push('status = ?');
    values.push(patch.status);
  }
  if (patch.attempts !== undefined) {
    sets.push('attempts = ?');
    values.push(patch.attempts);
  }
  if (patch.error !== undefined) {
    sets.push('error = ?');
    values.push(patch.error);
  }
  if (patch.payload !== undefined) {
    sets.push('payload = ?');
    values.push(JSON.stringify(patch.payload));
  }
  if (sets.length === 0) {
    return;
  }
  sets.push("updated_at = datetime('now')");
  await db.prepare(`UPDATE job_runs SET ${sets.join(', ')} WHERE id = ?`).bind(...values, id).run();
}

export interface PipelineSummary {
  prospects: number;
  audits: number;
  pitches: number;
  pitchesSent: number;
  mockups: number;
  bookings: number;
  jobRuns: number;
}

export async function getPipelineSummary(db: D1Database): Promise<PipelineSummary> {
  const [prospects, audits, pitches, pitchesSent, mockups, bookings, jobRuns] = await Promise.all([
    db.prepare('SELECT COUNT(*) AS n FROM businesses').first<{ n: number }>(),
    db.prepare('SELECT COUNT(*) AS n FROM audits').first<{ n: number }>(),
    db.prepare('SELECT COUNT(*) AS n FROM pitches').first<{ n: number }>(),
    db.prepare("SELECT COUNT(*) AS n FROM pitches WHERE status = 'sent'").first<{ n: number }>(),
    db.prepare('SELECT COUNT(*) AS n FROM mockups').first<{ n: number }>(),
    db.prepare('SELECT COUNT(*) AS n FROM bookings').first<{ n: number }>(),
    db.prepare('SELECT COUNT(*) AS n FROM job_runs').first<{ n: number }>()
  ]);

  return {
    prospects: prospects?.n ?? 0,
    audits: audits?.n ?? 0,
    pitches: pitches?.n ?? 0,
    pitchesSent: pitchesSent?.n ?? 0,
    mockups: mockups?.n ?? 0,
    bookings: bookings?.n ?? 0,
    jobRuns: jobRuns?.n ?? 0
  };
}

export async function getBooking(db: D1Database, id: string): Promise<BookingRow | null> {
  return db.prepare('SELECT * FROM bookings WHERE id = ?').bind(id).first<BookingRow>();
}

export async function updateBooking(db: D1Database, id: string, patch: Record<string, unknown>): Promise<void> {
  const entries = Object.entries(patch).filter(([column]) =>
    ['name', 'email', 'phone', 'service', 'message', 'consent', 'status'].includes(column)
  );
  if (entries.length === 0) {
    return;
  }
  const setClause = entries.map(([column]) => `${column} = ?`).join(', ');
  await db
    .prepare(`UPDATE bookings SET ${setClause} WHERE id = ?`)
    .bind(...entries.map(([, value]) => value ?? ''), id)
    .run();
}

export async function deleteBooking(db: D1Database, id: string): Promise<void> {
  await db.prepare('DELETE FROM bookings WHERE id = ?').bind(id).run();
}

