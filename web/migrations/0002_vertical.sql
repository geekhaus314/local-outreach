-- Adds the matched vertical to each business. A new business only needs its
-- category matched; building a new vertical is a code change, adding a business
-- is not.

ALTER TABLE businesses ADD COLUMN vertical TEXT NOT NULL DEFAULT 'general';

CREATE INDEX IF NOT EXISTS idx_businesses_vertical ON businesses (vertical);
