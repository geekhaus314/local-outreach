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

export interface BookingInsert {
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

export async function recordBooking(db: D1Database, booking: BookingInsert): Promise<void> {
  await db
    .prepare(
      `INSERT INTO bookings
         (id, business_id, business_slug, name, email, phone, service, message, consent, status, idempotency_key)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'received', ?)
       ON CONFLICT(idempotency_key) DO NOTHING`
    )
    .bind(
      booking.id,
      booking.businessId,
      booking.businessSlug,
      booking.name,
      booking.email,
      booking.phone,
      booking.service,
      booking.message,
      booking.consent ? 1 : 0,
      booking.idempotencyKey
    )
    .run();
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

export async function upsertProspect(
  db: D1Database,
  prospect: LocalOutreachProspect,
  extras: { id: string; slug: string; template: string; theme: string; vertical: string; hostnames: string[]; indexable: boolean }
): Promise<void> {
  const record = prospectToBusiness(prospect, extras);
  const columns = Object.keys(record);
  const placeholders = columns.map(() => "?").join(", ");
  const updates = columns.filter((column) => column !== "id").map((column) => `${column} = excluded.${column}`).join(", ");
  await db.prepare(
    `INSERT INTO businesses (${columns.join(", ")}) VALUES (${placeholders})
       ON CONFLICT(id) DO UPDATE SET ${updates}, updated_at = datetime('now')`
  ).bind(...columns.map((column) => record[column])).run();
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

function bookingToApi(row: BookingRow) {
  return {
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
  };
}

export async function listBookings(db: D1Database, limit = 50): Promise<ReturnType<typeof bookingToApi>[]> {
  const { results } = await db.prepare("SELECT * FROM bookings ORDER BY created_at DESC LIMIT ?").bind(limit).all<BookingRow>();
  return (results ?? []).map(bookingToApi);
}
export async function listBookingsByBusiness(db: D1Database, slug: string, limit = 50): Promise<ReturnType<typeof bookingToApi>[]> {
  const { results } = await db.prepare("SELECT * FROM bookings WHERE business_slug = ? ORDER BY created_at DESC LIMIT ?").bind(slug, limit).all<BookingRow>();
  return (results ?? []).map(bookingToApi);
}
const BUSINESS_COLUMNS = /* @__PURE__ */ new Set([
  "name",
  "industry",
  "industry_kind",
  "phone",
  "address",
  "website",
  "email",
  "traffic_tier",
  "decision_maker",
  "classification",
  "opportunity",
  "need_score",
  "value_score",
  "site_health",
  "rating",
  "review_count",
  "audit_summary",
  "pitch_facts",
  "sources",
  "source_ids",
  "low_confidence",
  "maps_url",
  "last_audited",
  "persona",
  "template",
  "theme",
  "vertical",
  "hostnames",
  "indexable",
  "status",
  "lifecycle_status"
]);
export type LeadLifecycleStatus = "cold" | "contacted" | "audited" | "proposal_sent" | "converted" | "rejected";
const LEAD_LIFECYCLE_STATUSES: LeadLifecycleStatus[] = ["cold", "contacted", "audited", "proposal_sent", "converted", "rejected"];
export function lifecycleStatusIsValid(value: string): value is LeadLifecycleStatus {
  return (LEAD_LIFECYCLE_STATUSES as string[]).includes(value);
}
export async function listLeads(db: D1Database, filter: BusinessFilter = {}): Promise<BusinessRow[]> {
  const clauses: string[] = [];
  const values: unknown[] = [];
  if (filter.q && filter.q.trim()) {
    clauses.push("(name LIKE ? OR industry LIKE ? OR phone LIKE ?)");
    const needle = `%${filter.q.trim()}%`;
    values.push(needle, needle, needle);
  }
  if (filter.vertical && filter.vertical !== "all") {
    clauses.push("vertical = ?");
    values.push(filter.vertical);
  }
  if (filter.kind && filter.kind !== "all") {
    clauses.push("industry_kind = ?");
    values.push(filter.kind);
  }
  if (filter.lifecycle && filter.lifecycle !== "all") {
    if (!lifecycleStatusIsValid(filter.lifecycle)) {
      throw new Error(`Unknown lifecycle status: ${filter.lifecycle}`);
    }
    clauses.push("lifecycle_status = ?");
    values.push(filter.lifecycle);
  }
  if (filter.status) {
    clauses.push("status = ?");
    values.push(filter.status);
  }
  const where = clauses.length > 0 ? `WHERE ${clauses.join(" AND ")}` : "";
  const { results } = await db.prepare(
    `SELECT ${LEAD_COLUMNS} FROM businesses ${where}
       ORDER BY opportunity DESC, name ASC`
  ).bind(...values).all<BusinessRow>();
  return results ?? [];
}
export const LEAD_COLUMNS = [
  "id",
  "slug",
  "name",
  "industry",
  "industry_kind",
  "phone",
  "address",
  "website",
  "email",
  "rating",
  "review_count",
  "opportunity",
  "need_score",
  "value_score",
  "site_health",
  "classification",
  "lifecycle_status",
  "status",
  "last_audited",
  "created_at",
  "updated_at"
].join(", ");
export interface LifecycleTransitionInput {
  businessId: string;
  toStatus: LeadLifecycleStatus;
  actorId: string;
  note?: string;
}

export async function recordLifecycleTransition(db: D1Database, input: LifecycleTransitionInput): Promise<LeadLifecycleStatus> {
  const current = await db.prepare("SELECT lifecycle_status FROM businesses WHERE id = ?").bind(input.businessId).first<{ lifecycle_status: string }>();
  const from = (current?.lifecycle_status as LeadLifecycleStatus) ?? "cold";
  await db.prepare(
    `UPDATE businesses SET lifecycle_status = ?, updated_at = datetime('now') WHERE id = ?`
  ).bind(input.toStatus, input.businessId).run();
  await db.prepare(
    `INSERT INTO lifecycle_events (id, business_id, from_status, to_status, actor_id, note)
       VALUES (?, ?, ?, ?, ?, ?)`
  ).bind(
    `life-${crypto.randomUUID()}`,
    input.businessId,
    from,
    input.toStatus,
    input.actorId,
    input.note ?? ""
  ).run();
  return from;
}

export interface LifecycleEventRow {
  id: string;
  business_id: string;
  from_status: string;
  to_status: string;
  actor_id: string;
  note: string;
  created_at: string;
}

export async function listLifecycleEvents(db: D1Database, businessId?: string): Promise<LifecycleEventRow[]> {
  const query = businessId ? "SELECT * FROM lifecycle_events WHERE business_id = ? ORDER BY created_at DESC" : "SELECT * FROM lifecycle_events ORDER BY created_at DESC";
  const { results } = businessId ? await db.prepare(query).bind(businessId).all<LifecycleEventRow>() : await db.prepare(query).all<LifecycleEventRow>();
  return results ?? [];
}
export const COMMUNICATION_COLUMNS = [
  "c.id",
  "c.business_id",
  "b.name AS business_name",
  "b.slug AS business_slug",
  "c.direction",
  "c.channel",
  "c.subject",
  "c.body",
  "c.occurred_at",
  "c.response_to",
  "c.outcome",
  "c.actor_id",
  "c.created_at"
].join(", ");
export type CommunicationDirection = "outbound" | "inbound";
export type CommunicationOutcome = "" | "replied" | "meeting_booked" | "declined" | "gatekeeper" | "wrong_number";

export interface CommunicationRow {
  id: string;
  business_id: string;
  business_name: string | null;
  business_slug: string | null;
  direction: CommunicationDirection;
  channel: string;
  subject: string;
  body: string;
  occurred_at: string;
  response_to: string | null;
  outcome: CommunicationOutcome;
  actor_id: string;
  created_at: string;
}

export interface CommunicationFilter {
  businessId?: string;
  direction?: string;
  responseNeeded?: boolean;
  limit?: number;
}

export function directionIsValid(value: string): value is CommunicationDirection {
  return value === "outbound" || value === "inbound";
}
export function parseDirection(value: string): CommunicationDirection | null {
  return directionIsValid(value) ? value : null;
}
export async function listCommunications(db: D1Database, filter: CommunicationFilter = {}): Promise<CommunicationRow[]> {
  const clauses: string[] = [];
  const values: unknown[] = [];
  if (filter.businessId) {
    clauses.push("c.business_id = ?");
    values.push(filter.businessId);
  }
  if (filter.direction) {
    clauses.push("c.direction = ?");
    values.push(filter.direction);
  }
  if (filter.responseNeeded) {
    clauses.push("c.direction = ?");
    values.push("outbound");
    clauses.push("c.outcome = ?");
    values.push("");
    clauses.push("NOT EXISTS (SELECT 1 FROM communications r WHERE r.response_to = c.id)");
  }
  const where = clauses.length > 0 ? `WHERE ${clauses.join(" AND ")}` : "";
  const limit = Math.min(Math.max(filter.limit ?? 100, 1), 500);
  const { results } = await db.prepare(
    `SELECT ${COMMUNICATION_COLUMNS}
       FROM communications c LEFT JOIN businesses b ON b.id = c.business_id
       ${where}
       ORDER BY COALESCE(c.occurred_at, c.created_at) DESC, c.created_at DESC
       LIMIT ?`
  ).bind(...values, limit).all<CommunicationRow>();
  return results ?? [];
}
export async function getCommunication(db: D1Database, id: string): Promise<CommunicationRow | null> {
  return db.prepare(
    `SELECT ${COMMUNICATION_COLUMNS}
       FROM communications c LEFT JOIN businesses b ON b.id = c.business_id
       WHERE c.id = ?`
  ).bind(id).first<CommunicationRow>();
}
export function outcomeIsValid(value: string): value is CommunicationOutcome {
  return (["", "replied", "meeting_booked", "declined", "gatekeeper", "wrong_number"] as string[]).includes(value);
}
const COMMUNICATION_CHANNELS = ["email", "sms", "call", "voicemail", "form", "in_person", "letter"];
export function channelIsValid(value: string): boolean {
  return COMMUNICATION_CHANNELS.includes(value);
}

export interface CommunicationInsert {
  db: D1Database;
  businessId: string;
  direction: CommunicationDirection;
  channel: string;
  subject: string;
  body: string;
  occurredAt: string | null;
  responseTo: string | null;
  outcome: CommunicationOutcome;
  actorId: string;
}

export async function insertCommunication(input: CommunicationInsert): Promise<CommunicationRow> {
  const db = input.db;
  const id = `comm-${crypto.randomUUID()}`;
  await db.prepare(
    `INSERT INTO communications (id, business_id, direction, channel, subject, body, occurred_at, response_to, outcome, actor_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    id,
    input.businessId,
    input.direction,
    input.channel,
    input.subject,
    input.body,
    input.occurredAt,
    input.responseTo,
    input.outcome,
    input.actorId
  ).run();
  const row = await getCommunication(input.db, id);
  if (!row) throw new Error("Communication row vanished after insert.");
  return row;
}

export interface CommunicationPatch {
  channel?: string;
  subject?: string;
  body?: string;
  occurredAt?: string | null;
  outcome?: CommunicationOutcome;
}

export async function updateCommunication(db: D1Database, id: string, patch: CommunicationPatch): Promise<void> {
  const sets: string[] = [];
  const values: unknown[] = [];
  if (patch.channel !== undefined) {
    sets.push("channel = ?");
    values.push(patch.channel);
  }
  if (patch.subject !== undefined) {
    sets.push("subject = ?");
    values.push(patch.subject);
  }
  if (patch.body !== undefined) {
    sets.push("body = ?");
    values.push(patch.body);
  }
  if (patch.occurredAt !== undefined) {
    sets.push("occurred_at = ?");
    values.push(patch.occurredAt);
  }
  if (patch.outcome !== undefined) {
    sets.push("outcome = ?");
    values.push(patch.outcome);
  }
  if (sets.length === 0) return;
  await db.prepare(`UPDATE communications SET ${sets.join(", ")} WHERE id = ?`).bind(...values, id).run();
}

export async function deleteCommunication(db: D1Database, id: string): Promise<void> {
  await db.prepare("DELETE FROM communications WHERE id = ?").bind(id).run();
}
export type UserRole = "owner" | "admin" | "viewer";

export interface UserRow {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  disabled: number;
  created_at: string;
  last_seen_at: string | null;
}

const USER_ROLES: UserRole[] = ["owner", "admin", "viewer"];
export function userRoleIsValid(value: string): value is UserRole {
  return (USER_ROLES as string[]).includes(value);
}
export async function listUsers(db: D1Database): Promise<UserRow[]> {
  const { results } = await db.prepare("SELECT id, email, name, role, disabled, created_at, last_seen_at FROM users ORDER BY created_at ASC").all<UserRow>();
  return results ?? [];
}
export async function getUser(db: D1Database, id: string): Promise<UserRow | null> {
  return db.prepare("SELECT id, email, name, role, disabled, created_at, last_seen_at FROM users WHERE id = ?").bind(id).first<UserRow>();
}
export interface UserPatch {
  role?: UserRole;
  name?: string;
  disabled?: boolean;
  passwordHash?: string;
}
export async function updateUser(db: D1Database, id: string, patch: UserPatch): Promise<void> {
  const sets: string[] = [];
  const values: unknown[] = [];
  if (patch.role !== undefined) {
    sets.push("role = ?");
    values.push(patch.role);
  }
  if (patch.name !== undefined) {
    sets.push("name = ?");
    values.push(patch.name);
  }
  if (patch.disabled !== undefined) {
    sets.push("disabled = ?");
    values.push(patch.disabled ? 1 : 0);
  }
  if (patch.passwordHash !== undefined) {
    sets.push("password_hash = ?");
    values.push(patch.passwordHash);
  }
  if (sets.length === 0) return;
  await db.prepare(`UPDATE users SET ${sets.join(", ")} WHERE id = ?`).bind(...values, id).run();
}
export async function deleteUser(db: D1Database, id: string): Promise<void> {
  await db.batch([
    db.prepare("DELETE FROM sessions WHERE user_id = ?").bind(id),
    db.prepare("DELETE FROM users WHERE id = ?").bind(id)
  ]);
}
export async function countEnabledOwners(db: D1Database, excludingId?: string): Promise<number> {
  const row = excludingId ? await db.prepare("SELECT COUNT(*) AS n FROM users WHERE role = 'owner' AND disabled = 0 AND id <> ?").bind(excludingId).first<{ n: number }>() : await db.prepare("SELECT COUNT(*) AS n FROM users WHERE role = 'owner' AND disabled = 0").first<{ n: number }>();
  return row?.n ?? 0;
}
export const LAUNCH_PRICE_ESTIMATE = 1200;

interface LifecycleCountRow { lifecycle: string; n: number }
interface CommsCountRow { outbound: number; inbound: number }
interface LifecycleMonthRow { month: string; from_status: string; to_status: string; events: number }
interface BookingMonthRow { month: string; count: number }
interface TopOpportunityRow { slug: string; name: string; industry: string; opportunity: number; lifecycle_status: string; website: string }

export interface AnalyticsSummary {
  leads: number;
  funnel: { lifecycle: LeadLifecycleStatus; count: number; estimatedValue: number }[];
  conversionRate: number;
  convertedCount: number;
  proposalsSent: number;
  contactSubmissionCount: number;
  outboundMessages: number;
  inboundResponses: number;
  responseRate: number;
  monthlyOutreach: { month: string; outbound: number; inbound: number; events: number }[];
  monthlyBookings: { month: string; count: number }[];
  deadSiteCount: number;
  noPresenceCount: number;
  averageSiteHealth: number | null;
  topOpportunities: TopOpportunityRow[];
  staleContacts: number;
}

export async function getAnalyticsSummary(db: D1Database): Promise<AnalyticsSummary> {
  const [leadCount, funnelRows, commsCount, eventRows, bookingRows, healthRow, deadRow, topRows, staleRow, bookingCount, noPresenceRow] = await Promise.all([
    db.prepare("SELECT COUNT(*) AS n FROM businesses").first<{ n: number }>(),
    db.prepare(
      `SELECT lifecycle_status AS lifecycle, COUNT(*) AS n
           FROM businesses GROUP BY lifecycle_status`
    ).all<LifecycleCountRow>(),
    db.prepare(
      `SELECT SUM(CASE WHEN direction = 'outbound' THEN 1 ELSE 0 END) AS outbound,
                  SUM(CASE WHEN direction = 'inbound' THEN 1 ELSE 0 END) AS inbound
           FROM communications`
    ).first<CommsCountRow>(),
    db.prepare(
      `SELECT substr(created_at, 1, 7) AS month, from_status, to_status, COUNT(*) AS events
           FROM lifecycle_events GROUP BY month, from_status, to_status`
    ).all<LifecycleMonthRow>(),
    db.prepare(
      `SELECT substr(created_at, 1, 7) AS month, COUNT(*) AS count
           FROM bookings GROUP BY month ORDER BY month ASC`
    ).all<BookingMonthRow>(),
    db.prepare("SELECT AVG(site_health) AS health FROM businesses WHERE site_health IS NOT NULL").first<{ health: number }>(),
    db.prepare("SELECT COUNT(*) AS n FROM businesses WHERE classification = 'DEAD_SITE'").first<{ n: number }>(),
    db.prepare(
      `SELECT slug, name, industry, opportunity, lifecycle_status, website
           FROM businesses ORDER BY opportunity DESC LIMIT 10`
    ).all<TopOpportunityRow>(),
    db.prepare(
      `SELECT COUNT(*) AS n FROM businesses b
           WHERE b.lifecycle_status = 'contacted'
             AND b.updated_at < datetime('now', '-14 days')`
    ).first<{ n: number }>(),
    db.prepare("SELECT COUNT(*) AS n FROM bookings").first<{ n: number }>(),
    db.prepare("SELECT COUNT(*) AS n FROM businesses WHERE classification = 'NO_PRESENCE'").first<{ n: number }>()
  ]);
  const funnel = LEAD_LIFECYCLE_STATUSES.map((status) => {
    const count = funnelRows.results?.find((r) => r.lifecycle === status)?.n ?? 0;
    const weight = status === "proposal_sent" || status === "converted" ? LAUNCH_PRICE_ESTIMATE : 0;
    return { lifecycle: status, count, estimatedValue: count * weight };
  });
  const convertedCount = funnel.find((f) => f.lifecycle === "converted")?.count ?? 0;
  const proposalsSent = funnel.find((f) => f.lifecycle === "proposal_sent")?.count ?? 0;
  const lifecycleTotal = funnel.reduce((sum, f) => sum + f.count, 0);
  const conversionRate = lifecycleTotal > 0 ? convertedCount / lifecycleTotal : 0;
  const outboundMessages = commsCount?.outbound ?? 0;
  const inboundResponses = commsCount?.inbound ?? 0;
  const responseRate = outboundMessages > 0 ? inboundResponses / outboundMessages : 0;
  const monthlyOutreachMap = new Map<string, { month: string; outbound: number; inbound: number; events: number }>();
  for (const row of eventRows.results ?? []) {
    if (!row.month) continue;
    const entry = monthlyOutreachMap.get(row.month) ?? { month: row.month, outbound: 0, inbound: 0, events: 0 };
    if (row.to_status !== row.from_status) {
      if (row.to_status === "contacted") {
        entry.outbound += row.events;
      } else {
        entry.events += row.events;
      }
    }
    monthlyOutreachMap.set(row.month, entry);
  }
  const bookingMonths = new Set((bookingRows.results ?? []).map((b) => b.month));
  for (const month of bookingMonths) {
    const entry = monthlyOutreachMap.get(month) ?? { month, outbound: 0, inbound: 0, events: 0 };
    monthlyOutreachMap.set(month, entry);
  }
  const monthlyOutreach = Array.from(monthlyOutreachMap.values()).sort((a, b) => a.month.localeCompare(b.month));
  return {
    leads: leadCount?.n ?? 0,
    funnel,
    conversionRate,
    convertedCount,
    proposalsSent,
    contactSubmissionCount: bookingCount?.n ?? 0,
    outboundMessages,
    inboundResponses,
    responseRate,
    monthlyOutreach,
    monthlyBookings: (bookingRows.results ?? []).map((row) => ({ month: row.month, count: row.count })),
    deadSiteCount: deadRow?.n ?? 0,
    noPresenceCount: noPresenceRow?.n ?? 0,
    averageSiteHealth: healthRow?.health !== null && healthRow?.health !== undefined ? Math.round(healthRow.health) : null,
    topOpportunities: topRows.results ?? [],
    staleContacts: staleRow?.n ?? 0
  };
}
export function businessValue(column: string, value: unknown): unknown {
  if ((column === "pitch_facts" || column === "sources" || column === "hostnames") && Array.isArray(value)) {
    return JSON.stringify(value);
  }
  if ((column === "low_confidence" || column === "indexable") && typeof value === "boolean") {
    return value ? 1 : 0;
  }
  return value ?? "";
}
export async function getBusiness(db: D1Database, id: string): Promise<BusinessRow | null> {
  return db.prepare("SELECT * FROM businesses WHERE id = ?").bind(id).first<BusinessRow>();
}
export async function updateBusiness(db: D1Database, id: string, patch: Record<string, unknown>): Promise<boolean> {
  const entries = Object.entries(patch).filter(
    ([column]) => BUSINESS_COLUMNS.has(column) && column !== "id" && column !== "slug"
  );
  if (entries.length === 0) {
    return false;
  }
  const setClause = entries.map(([column]) => `${column} = ?`).join(", ");
  await db.prepare(`UPDATE businesses SET ${setClause}, updated_at = datetime('now') WHERE id = ?`).bind(...entries.map(([column, value]) => businessValue(column, value)), id).run();
  return true;
}
export async function deleteBusiness(db: D1Database, id: string): Promise<void> {
  await db.batch([
    db.prepare("DELETE FROM audits WHERE business_id = ?").bind(id),
    db.prepare("DELETE FROM pitches WHERE business_id = ?").bind(id),
    db.prepare("DELETE FROM mockups WHERE business_id = ?").bind(id),
    db.prepare("DELETE FROM lifecycle_events WHERE business_id = ?").bind(id),
    db.prepare("DELETE FROM communications WHERE business_id = ?").bind(id),
    db.prepare("DELETE FROM businesses WHERE id = ?").bind(id)
  ]);
}
export async function nextMockupVersion(db: D1Database, businessId: string): Promise<number> {
  const row = await db.prepare("SELECT MAX(content_version) AS latest FROM mockups WHERE business_id = ?").bind(businessId).first<{ latest: number | null }>();
  return (row?.latest ?? 0) + 1;
}

export interface AuditRow {
  id: string;
  business_id: string;
  summary: string;
  findings: string;
  site_health: number | null;
  created_at: string;
  business_name: string | null;
  business_slug: string | null;
}

export async function listAudits(db: D1Database, businessId?: string): Promise<AuditRow[]> {
  const base = `SELECT a.*, b.name AS business_name, b.slug AS business_slug
    FROM audits a LEFT JOIN businesses b ON b.id = a.business_id`;
  const query = businessId ? `${base} WHERE a.business_id = ? ORDER BY a.created_at DESC` : `${base} ORDER BY a.created_at DESC`;
  const { results } = businessId ? await db.prepare(query).bind(businessId).all<AuditRow>() : await db.prepare(query).all<AuditRow>();
  return results ?? [];
}
export async function getAudit(db: D1Database, id: string): Promise<AuditRow | null> {
  return db.prepare(
    `SELECT a.*, b.name AS business_name, b.slug AS business_slug
       FROM audits a LEFT JOIN businesses b ON b.id = a.business_id
       WHERE a.id = ?`
  ).bind(id).first<AuditRow>();
}
export interface AuditInsert {
  id: string;
  businessId: string;
  summary: string;
  findings: unknown[];
  siteHealth: number | null;
}
export async function insertAudit(db: D1Database, record: AuditInsert): Promise<void> {
  await db.prepare("INSERT INTO audits (id, business_id, summary, findings, site_health) VALUES (?, ?, ?, ?, ?)").bind(record.id, record.businessId, record.summary, JSON.stringify(record.findings), record.siteHealth).run();
}
export interface AuditPatch {
  summary?: string;
  findings?: unknown[];
  siteHealth?: number | null;
}
export async function updateAudit(db: D1Database, id: string, patch: AuditPatch): Promise<void> {
  const sets: string[] = [];
  const values: unknown[] = [];
  if (patch.summary !== undefined) {
    sets.push("summary = ?");
    values.push(patch.summary);
  }
  if (patch.findings !== undefined) {
    sets.push("findings = ?");
    values.push(JSON.stringify(patch.findings));
  }
  if (patch.siteHealth !== undefined) {
    sets.push("site_health = ?");
    values.push(patch.siteHealth);
  }
  if (sets.length === 0) return;
  await db.prepare(`UPDATE audits SET ${sets.join(", ")} WHERE id = ?`).bind(...values, id).run();
}
export async function deleteAudit(db: D1Database, id: string): Promise<void> {
  await db.prepare("DELETE FROM audits WHERE id = ?").bind(id).run();
}

export interface PitchRow {
  id: string;
  business_id: string;
  channel: string;
  body: string;
  status: string;
  created_at: string;
  business_name: string | null;
  business_slug: string | null;
}

export async function listPitches(db: D1Database, businessId?: string): Promise<PitchRow[]> {
  const base = `SELECT p.*, b.name AS business_name, b.slug AS business_slug
    FROM pitches p LEFT JOIN businesses b ON b.id = p.business_id`;
  const query = businessId ? `${base} WHERE p.business_id = ? ORDER BY p.created_at DESC` : `${base} ORDER BY p.created_at DESC`;
  const { results } = businessId ? await db.prepare(query).bind(businessId).all<PitchRow>() : await db.prepare(query).all<PitchRow>();
  return results ?? [];
}
export async function getPitch(db: D1Database, id: string): Promise<PitchRow | null> {
  return db.prepare(
    `SELECT p.*, b.name AS business_name, b.slug AS business_slug
       FROM pitches p LEFT JOIN businesses b ON b.id = p.business_id
       WHERE p.id = ?`
  ).bind(id).first<PitchRow>();
}
export interface PitchInsert {
  id: string;
  businessId: string;
  channel: string;
  body: string;
  status?: string;
}
export async function insertPitch(db: D1Database, record: PitchInsert): Promise<void> {
  await db.prepare("INSERT INTO pitches (id, business_id, channel, body, status) VALUES (?, ?, ?, ?, ?)").bind(record.id, record.businessId, record.channel, record.body, record.status ?? "draft").run();
}
export interface PitchPatch {
  channel?: string;
  body?: string;
  status?: string;
}
export async function updatePitch(db: D1Database, id: string, patch: PitchPatch): Promise<void> {
  const entries = Object.entries(patch).filter(([column]) => ["channel", "body", "status"].includes(column));
  if (entries.length === 0) {
    return;
  }
  const setClause = entries.map(([column]) => `${column} = ?`).join(", ");
  await db.prepare(`UPDATE pitches SET ${setClause} WHERE id = ?`).bind(...entries.map(([, value]) => value ?? ""), id).run();
}
export async function deletePitch(db: D1Database, id: string): Promise<void> {
  await db.prepare("DELETE FROM pitches WHERE id = ?").bind(id).run();
}

export interface MockupPatch {
  template?: string;
  theme?: string;
  previewHost?: string;
  isIndexable?: boolean;
}

export async function updateMockup(db: D1Database, id: string, patch: MockupPatch): Promise<void> {
  const sets: string[] = [];
  const values: unknown[] = [];
  if (patch.template !== undefined) {
    sets.push("template = ?");
    values.push(patch.template);
  }
  if (patch.theme !== undefined) {
    sets.push("theme = ?");
    values.push(patch.theme);
  }
  if (patch.previewHost !== undefined) {
    sets.push("preview_host = ?");
    values.push(patch.previewHost);
  }
  if (patch.isIndexable !== undefined) {
    sets.push("is_indexable = ?");
    values.push(patch.isIndexable ? 1 : 0);
  }
  if (sets.length === 0) return;
  await db.prepare(`UPDATE mockups SET ${sets.join(", ")} WHERE id = ?`).bind(...values, id).run();
}
export async function deleteMockup(db: D1Database, id: string): Promise<void> {
  await db.prepare("DELETE FROM mockups WHERE id = ?").bind(id).run();
}

export interface MockupRow {
  id: string;
  business_id: string;
  template: string;
  theme: string;
  content_version: number;
  preview_host: string;
  is_indexable: number;
  created_at: string;
}

export async function listMockups(db: D1Database, businessId?: string): Promise<MockupRow[]> {
  const query = businessId ? "SELECT * FROM mockups WHERE business_id = ? ORDER BY created_at DESC" : "SELECT * FROM mockups ORDER BY created_at DESC";
  const { results } = businessId ? await db.prepare(query).bind(businessId).all<MockupRow>() : await db.prepare(query).all<MockupRow>();
  return results ?? [];
}
export async function getMockup(db: D1Database, id: string): Promise<MockupRow | null> {
  return db.prepare("SELECT * FROM mockups WHERE id = ?").bind(id).first<MockupRow>();
}
export interface MockupInsert {
  id: string;
  businessId: string;
  template: string;
  theme: string;
  contentVersion: number;
  previewHost: string;
  isIndexable: boolean;
}
export async function insertMockup(db: D1Database, record: MockupInsert): Promise<void> {
  await db.prepare(
    "INSERT INTO mockups (id, business_id, template, theme, content_version, preview_host, is_indexable) VALUES (?, ?, ?, ?, ?, ?, ?)"
  ).bind(
    record.id,
    record.businessId,
    record.template,
    record.theme,
    record.contentVersion,
    record.previewHost,
    record.isIndexable ? 1 : 0
  ).run();
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

export async function listJobRuns(db: D1Database, limit = 50): Promise<JobRunRow[]> {
  const { results } = await db.prepare("SELECT * FROM job_runs ORDER BY created_at DESC LIMIT ?").bind(limit).all<JobRunRow>();
  return results ?? [];
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
    db.prepare("SELECT COUNT(*) AS n FROM businesses").first<{ n: number }>(),
    db.prepare("SELECT COUNT(*) AS n FROM audits").first<{ n: number }>(),
    db.prepare("SELECT COUNT(*) AS n FROM pitches").first<{ n: number }>(),
    db.prepare("SELECT COUNT(*) AS n FROM pitches WHERE status = 'sent'").first<{ n: number }>(),
    db.prepare("SELECT COUNT(*) AS n FROM mockups").first<{ n: number }>(),
    db.prepare("SELECT COUNT(*) AS n FROM bookings").first<{ n: number }>(),
    db.prepare("SELECT COUNT(*) AS n FROM job_runs").first<{ n: number }>()
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
  return db.prepare("SELECT * FROM bookings WHERE id = ?").bind(id).first<BookingRow>();
}
export interface BookingPatch {
  name?: string;
  email?: string;
  phone?: string;
  service?: string;
  message?: string;
  consent?: boolean;
  status?: string;
}
export async function updateBooking(db: D1Database, id: string, patch: BookingPatch): Promise<void> {
  const entries = Object.entries(patch).filter(
    ([column]) => ["name", "email", "phone", "service", "message", "consent", "status"].includes(column)
  );
  if (entries.length === 0) {
    return;
  }
  const setClause = entries.map(([column]) => `${column} = ?`).join(", ");
  await db.prepare(`UPDATE bookings SET ${setClause} WHERE id = ?`).bind(...entries.map(([, value]) => value ?? ""), id).run();
}
export async function deleteBooking(db: D1Database, id: string): Promise<void> {
  await db.prepare("DELETE FROM bookings WHERE id = ?").bind(id).run();
}

export interface VerticalCountRow {
  vertical: string;
  count: number;
}

export async function countBusinessesByVertical(db: D1Database): Promise<VerticalCountRow[]> {
  const { results } = await db.prepare("SELECT vertical, COUNT(*) AS count FROM businesses GROUP BY vertical ORDER BY count DESC, vertical ASC").all<VerticalCountRow>();
  return results ?? [];
}
