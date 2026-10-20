-- Local outreach pipeline schema.
-- One business row is the source of truth for a prospect. Audit, pitch and mockup
-- rows keep history instead of overwriting, so a re-run never destroys evidence.

CREATE TABLE IF NOT EXISTS businesses (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  industry TEXT NOT NULL DEFAULT '',
  industry_kind TEXT NOT NULL DEFAULT 'general',
  phone TEXT NOT NULL DEFAULT '',
  address TEXT NOT NULL DEFAULT '',
  website TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  traffic_tier TEXT NOT NULL DEFAULT '',
  decision_maker TEXT NOT NULL DEFAULT '',
  classification TEXT NOT NULL DEFAULT '',
  opportunity INTEGER NOT NULL DEFAULT 0,
  need_score INTEGER NOT NULL DEFAULT 0,
  value_score INTEGER NOT NULL DEFAULT 0,
  site_health INTEGER,
  rating REAL,
  review_count INTEGER,
  audit_summary TEXT NOT NULL DEFAULT '',
  pitch_facts TEXT NOT NULL DEFAULT '[]',
  sources TEXT NOT NULL DEFAULT '[]',
  source_ids TEXT NOT NULL DEFAULT '',
  low_confidence INTEGER NOT NULL DEFAULT 0,
  maps_url TEXT NOT NULL DEFAULT '',
  last_audited TEXT NOT NULL DEFAULT '',
  persona TEXT NOT NULL DEFAULT '',
  template TEXT NOT NULL DEFAULT 'general',
  theme TEXT NOT NULL DEFAULT 'premium-luxury',
  hostnames TEXT NOT NULL DEFAULT '[]',
  indexable INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'new',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_businesses_kind ON businesses (industry_kind);
CREATE INDEX IF NOT EXISTS idx_businesses_status ON businesses (status);
CREATE INDEX IF NOT EXISTS idx_businesses_opportunity ON businesses (opportunity DESC);

CREATE TABLE IF NOT EXISTS audits (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL REFERENCES businesses (id) ON DELETE CASCADE,
  summary TEXT NOT NULL DEFAULT '',
  findings TEXT NOT NULL DEFAULT '[]',
  site_health INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_audits_business ON audits (business_id, created_at DESC);

CREATE TABLE IF NOT EXISTS pitches (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL REFERENCES businesses (id) ON DELETE CASCADE,
  channel TEXT NOT NULL DEFAULT 'email',
  body TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_pitches_business ON pitches (business_id, created_at DESC);

CREATE TABLE IF NOT EXISTS mockups (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL REFERENCES businesses (id) ON DELETE CASCADE,
  template TEXT NOT NULL,
  theme TEXT NOT NULL,
  content_version INTEGER NOT NULL DEFAULT 1,
  preview_host TEXT NOT NULL,
  is_indexable INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_mockups_business ON mockups (business_id, created_at DESC);

CREATE TABLE IF NOT EXISTS bookings (
  id TEXT PRIMARY KEY,
  business_id TEXT,
  business_slug TEXT NOT NULL DEFAULT '',
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL DEFAULT '',
  service TEXT NOT NULL DEFAULT '',
  message TEXT NOT NULL DEFAULT '',
  consent INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'received',
  idempotency_key TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_bookings_business ON bookings (business_id, created_at DESC);

CREATE TABLE IF NOT EXISTS job_runs (
  id TEXT PRIMARY KEY,
  kind TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued',
  attempts INTEGER NOT NULL DEFAULT 0,
  payload TEXT NOT NULL DEFAULT '{}',
  error TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_job_runs_status ON job_runs (status, created_at);
