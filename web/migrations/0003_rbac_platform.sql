-- Unified platform additions: RBAC users/sessions, lead lifecycle tracking,
-- and the communication log. One migration, applied as one history step.
-- Existing tables keep their shape; businesses gains one column.

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL DEFAULT '',
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'viewer',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  last_seen_at TEXT,
  disabled INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  expires_at TEXT NOT NULL,
  last_seen_at TEXT,
  user_agent TEXT NOT NULL DEFAULT ''
);

CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions (user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expiry ON sessions (expires_at);

-- Lead lifecycle on the canonical business row. Values are validated in the API
-- layer (SQLite ALTER TABLE cannot attach a CHECK to an added column).
ALTER TABLE businesses ADD COLUMN lifecycle_status TEXT NOT NULL DEFAULT 'cold';
CREATE INDEX IF NOT EXISTS idx_businesses_lifecycle ON businesses (lifecycle_status);

-- Full transition history: reaching the analytics conversion rate and monthly
-- outreach performance requires when every status change happened, not just
-- the current value.
CREATE TABLE IF NOT EXISTS lifecycle_events (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL REFERENCES businesses (id) ON DELETE CASCADE,
  from_status TEXT NOT NULL DEFAULT '',
  to_status TEXT NOT NULL,
  actor_id TEXT,
  note TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_lifecycle_events_business ON lifecycle_events (business_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_lifecycle_events_status ON lifecycle_events (to_status, created_at DESC);

-- Communication log: outreach sent and responses received, optionally linked as
-- a reply thread. direction is 'outbound' (we sent it) or 'inbound' (they did).
CREATE TABLE IF NOT EXISTS communications (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL REFERENCES businesses (id) ON DELETE CASCADE,
  direction TEXT NOT NULL DEFAULT 'outbound',
  channel TEXT NOT NULL DEFAULT 'email',
  subject TEXT NOT NULL DEFAULT '',
  body TEXT NOT NULL,
  occurred_at TEXT,
  response_to TEXT REFERENCES communications (id) ON DELETE SET NULL,
  outcome TEXT NOT NULL DEFAULT '',
  actor_id TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_communications_business ON communications (business_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_communications_direction ON communications (direction, created_at DESC);
