CREATE TABLE IF NOT EXISTS timeline_events (
  id SERIAL PRIMARY KEY,
  event_date DATE,
  date_str TEXT NOT NULL DEFAULT '',
  title TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  news_id INTEGER REFERENCES news(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_timeline_events_date ON timeline_events (event_date DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_timeline_events_news_id ON timeline_events (news_id) WHERE news_id IS NOT NULL;
