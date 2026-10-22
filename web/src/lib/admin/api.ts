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
  summary: string;
  findings: string;
  site_health: number | null;
  created_at: string;
}

export interface AdminPitch {
  id: string;
  business_id: string;
  channel: string;
  body: string;
  status: string;
  created_at: string;
}

export interface AdminMockup {
  id: string;
  business_id: string;
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
