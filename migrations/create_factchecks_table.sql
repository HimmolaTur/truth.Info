-- Публичный раздел /factcheck и админка content.factcheck
CREATE TABLE IF NOT EXISTS factchecks (
  id SERIAL PRIMARY KEY,
  claim TEXT NOT NULL DEFAULT '',
  truth TEXT NOT NULL DEFAULT '',
  sources TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
