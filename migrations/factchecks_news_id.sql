-- Привязка разбора к новости (блок на странице /news/[id])
ALTER TABLE factchecks ADD COLUMN IF NOT EXISTS news_id INTEGER REFERENCES news(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_factchecks_news_id ON factchecks (news_id) WHERE news_id IS NOT NULL;
