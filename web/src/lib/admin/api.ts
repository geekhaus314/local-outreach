export interface AdminProspectSummary {
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

export interface AdminProspectDetail extends AdminProspectSummary {
  id: string;
  lifecycle_status: string;
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

export interface AdminAudit {
  id: string;
  business_id: string;
  business_name: string | null;
  summary: string;
  findings: string;
  site_health: number | null;
  created_at: string;
}

export interface AdminPitch {
  id: string;
  business_id: string;
  business_name: string | null;
  channel: string;
  body: string;
  status: string;
  created_at: string;
}

export interface AdminMockup {
  id: string;
  business_id: string;
  business_name: string | null;
  template: string;
  theme: string;
  content_version: number;
  preview_host: string;
  is_indexable: number;
  created_at: string;
}

export interface AdminBooking {
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

export interface AdminJobRun {
  id: string;
  kind: string;
  status: string;
  attempts: number;
  payload: string;
  error: string;
  created_at: string;
  updated_at: string;
}

export interface AdminSummary {
  prospects: number;
  audits: number;
  pitches: number;
  pitchesSent: number;
  mockups: number;
  bookings: number;
  jobRuns: number;
}

export interface ProspectDetail {
  prospect: AdminProspectDetail;
  audits: AdminAudit[];
  pitches: AdminPitch[];
  mockups: AdminMockup[];
  bookings: AdminBooking[];
}

export interface RegenerateOutcome {
  kind: string;
  businessId: string;
  slug: string;
  audit?: { id: string; health: number; summary: string; needsRehab: boolean; findings: number };
  pitch?: { id: string; channel: string };
  mockup?: { id: string; contentVersion: number; previewHost: string };
}

export class AdminApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: {
      Accept: 'application/json',
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      ...(init.headers ?? {})
    }
  });

  const text = await response.text();
  const data = text ? (JSON.parse(text) as unknown) : null;

  if (!response.ok) {
    const message =
      data && typeof data === 'object' && 'error' in data
        ? String((data as { error: unknown }).error)
        : `Request failed with status ${response.status}.`;
    throw new AdminApiError(message, response.status);
  }

  return data as T;
}

function query(params: Record<string, string | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) search.set(key, value);
  }
  const serialized = search.toString();
  return serialized ? `?${serialized}` : '';
}

export const adminApi = {
  async listProspects(filter: { q?: string; vertical?: string; kind?: string; status?: string } = {}) {
    return request<{ prospects: AdminProspectSummary[] }>(`/api/admin/prospects${query(filter)}`);
  },
  async getProspect(slug: string) {
    return request<ProspectDetail>(`/api/admin/prospects/${encodeURIComponent(slug)}`);
  },
  async createProspect(body: unknown) {
    return request<{ ok: boolean; slug: string }>('/api/admin/prospects', {
      method: 'POST',
      body: JSON.stringify(body)
    });
  },
  async updateProspect(slug: string, patch: Record<string, unknown>) {
    return request<{ prospect: AdminProspectDetail }>(
      `/api/admin/prospects/${encodeURIComponent(slug)}`,
      { method: 'PATCH', body: JSON.stringify(patch) }
    );
  },
  async deleteProspect(slug: string) {
    return request<{ ok: boolean; deleted: string }>(
      `/api/admin/prospects/${encodeURIComponent(slug)}`,
      { method: 'DELETE' }
    );
  },

  async listAudits(businessId?: string) {
    return request<{ audits: AdminAudit[] }>(`/api/admin/audits${query({ business_id: businessId })}`);
  },
  async updateAudit(id: string, patch: Record<string, unknown>) {
    return request<{ audit: AdminAudit }>(`/api/admin/audits/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(patch)
    });
  },
  async deleteAudit(id: string) {
    return request<{ ok: boolean }>(`/api/admin/audits/${encodeURIComponent(id)}`, { method: 'DELETE' });
  },

  async listPitches(businessId?: string) {
    return request<{ pitches: AdminPitch[] }>(`/api/admin/pitches${query({ business_id: businessId })}`);
  },
  async updatePitch(id: string, patch: Record<string, unknown>) {
    return request<{ pitch: AdminPitch }>(`/api/admin/pitches/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(patch)
    });
  },
  async deletePitch(id: string) {
    return request<{ ok: boolean }>(`/api/admin/pitches/${encodeURIComponent(id)}`, { method: 'DELETE' });
  },

  async polishPitch(id: string, instruction?: string) {
    return request<{ pitch: AdminPitch }>(`/api/admin/pitches/${encodeURIComponent(id)}/polish`, {
      method: 'POST',
      body: JSON.stringify({ instruction })
    });
  },

  async listMockups(businessId?: string) {
    return request<{ mockups: AdminMockup[] }>(`/api/admin/mockups${query({ business_id: businessId })}`);
  },
  async updateMockup(id: string, patch: Record<string, unknown>) {
    return request<{ mockup: AdminMockup }>(`/api/admin/mockups/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(patch)
    });
  },
  async deleteMockup(id: string) {
    return request<{ ok: boolean }>(`/api/admin/mockups/${encodeURIComponent(id)}`, { method: 'DELETE' });
  },

  async listBookings() {
    return request<{ bookings: AdminBooking[] }>('/api/admin/bookings');
  },
  async updateBooking(id: string, patch: Record<string, unknown>) {
    return request<{ booking: AdminBooking }>(`/api/admin/bookings/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(patch)
    });
  },
  async deleteBooking(id: string) {
    return request<{ ok: boolean }>(`/api/admin/bookings/${encodeURIComponent(id)}`, { method: 'DELETE' });
  },

  async listJobRuns() {
    return request<{ jobRuns: AdminJobRun[] }>('/api/admin/job-runs');
  },

  async summary() {
    return request<{ summary: AdminSummary }>('/api/admin/summary');
  },

  async regenerate(id: string, kind: 'audit' | 'pitch' | 'mockup' | 'all') {
    return request<{ ok: boolean; outcome: RegenerateOutcome }>('/api/admin/regenerate', {
      method: 'POST',
      body: JSON.stringify({ id, kind })
    });
  }
};

/* --- Unified platform extensions (leads, comms, users, analytics) --------- */

export interface AdminLead {
  id: string;
  slug: string;
  name: string;
  industry: string;
  industry_kind: string;
  phone: string;
  address: string;
  website: string;
  email: string;
  rating: number | null;
  review_count: number | null;
  opportunity: number;
  need_score: number;
  value_score: number;
  site_health: number | null;
  classification: string;
  lifecycle_status: string;
  status: string;
  last_audited: string;
  created_at: string;
  updated_at: string;
}

export interface AdminLifecycleEvent {
  id: string;
  business_id: string;
  from_status: string;
  to_status: string;
  actor_id: string | null;
  note: string;
  created_at: string;
}

export interface AdminCommunication {
  id: string;
  business_id: string;
  business_name: string | null;
  business_slug: string | null;
  direction: 'outbound' | 'inbound';
  channel: string;
  subject: string;
  body: string;
  occurred_at: string | null;
  response_to: string | null;
  outcome: string;
  actor_id: string | null;
  created_at: string;
}

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: string;
  disabled: number | boolean;
  created_at: string;
  last_seen_at: string | null;
  lastSeenAt?: string | null;
}

export interface AnalyticsFunnelStage {
  lifecycle: string;
  count: number;
  estimatedValue: number;
}

export interface AdminAnalytics {
  leads: number;
  funnel: AnalyticsFunnelStage[];
  conversionRate: number;
  convertedCount: number;
  proposalsSent: number;
  contactSubmissionCount: number;
  outboundMessages: number;
  inboundResponses: number;
  responseRate: number;
  monthlyOutreach: Array<{ month: string; outbound: number; inbound: number; events: number }>;
  monthlyBookings: Array<{ month: string; count: number }>;
  deadSiteCount: number;
  noPresenceCount: number;
  averageSiteHealth: number | null;
  topOpportunities: Array<{ slug: string; name: string; industry: string; opportunity: number; lifecycle_status: string; website: string }>;
  staleContacts: number;
}

export const LEAD_LIFECYCLE_STATUSES = [
  'cold',
  'contacted',
  'audited',
  'proposal_sent',
  'converted',
  'rejected'
] as const;

export interface LeadDetail extends ProspectDetail {
  communications: AdminCommunication[];
  lifecycleEvents: AdminLifecycleEvent[];
}

export const adminLeadsApi = {
  async listLeads(filter: { q?: string; vertical?: string; kind?: string; lifecycle?: string; status?: string } = {}) {
    return request<{ leads: AdminLead[] }>(`/api/admin/leads${query(filter)}`);
  },
  async getLead(slug: string) {
    return request<LeadDetail>(`/api/admin/leads/${encodeURIComponent(slug)}`);
  },
  async createLead(body: unknown) {
    return request<{ lead: AdminProspectDetail }>('/api/admin/leads', {
      method: 'POST',
      body: JSON.stringify(body)
    });
  },
  async updateLead(slug: string, patch: Record<string, unknown>) {
    return request<{ lead: AdminProspectDetail }>(
      `/api/admin/leads/${encodeURIComponent(slug)}`,
      { method: 'PATCH', body: JSON.stringify(patch) }
    );
  },
  async deleteLead(slug: string) {
    return request<{ ok: boolean; deleted: string }>(
      `/api/admin/leads/${encodeURIComponent(slug)}`,
      { method: 'DELETE' }
    );
  },
  async transitionLifecycle(slug: string, lifecycle: string, note?: string) {
    return request<{ from: string; to: string }>(
      `/api/admin/leads/${encodeURIComponent(slug)}/lifecycle`,
      { method: 'POST', body: JSON.stringify({ lifecycle_status: lifecycle, note: note ?? '' }) }
    );
  }
};

export const adminCommsApi = {
  async list(filter: { business_id?: string; direction?: 'outbound' | 'inbound'; response_needed?: boolean; limit?: number } = {}) {
    return request<{ communications: AdminCommunication[] }>(`/api/admin/communications${query({
      business_id: filter.business_id,
      direction: filter.direction,
      response_needed: filter.response_needed ? '1' : undefined,
      limit: filter.limit ? String(filter.limit) : undefined
    })}`);
  },
  async create(body: unknown) {
    return request<{ communication: AdminCommunication }>('/api/admin/communications', {
      method: 'POST',
      body: JSON.stringify(body)
    });
  },
  async update(id: string, patch: Record<string, unknown>) {
    return request<{ communication: AdminCommunication }>(
      `/api/admin/communications/${encodeURIComponent(id)}`,
      { method: 'PATCH', body: JSON.stringify(patch) }
    );
  },
  async remove(id: string) {
    return request<{ ok: boolean; deleted: string }>(`/api/admin/communications/${encodeURIComponent(id)}`, {
      method: 'DELETE'
    });
  }
};

export const adminUsersApi = {
  async list() {
    return request<{ users: AdminUser[] }>('/api/admin/users');
  },
  async create(body: unknown) {
    return request<{ user: AdminUser }>('/api/admin/users', {
      method: 'POST',
      body: JSON.stringify(body)
    });
  },
  async update(id: string, patch: Record<string, unknown>) {
    return request<{ user: AdminUser }>(`/api/admin/users/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(patch)
    });
  },
  async remove(id: string) {
    return request<{ ok: boolean; deleted: string }>(`/api/admin/users/${encodeURIComponent(id)}`, {
      method: 'DELETE'
    });
  }
};

export const adminAnalyticsApi = {
  async summary() {
    return request<{ analytics: AdminAnalytics; launchPriceEstimate: number }>('/api/admin/analytics');
  }
};
