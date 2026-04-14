-- Сырой импорт материалов Meduza (отдельно от редакционной таблицы news)
CREATE TABLE IF NOT EXISTS meduza_import (
  id BIGSERIAL PRIMARY KEY,
  url TEXT NOT NULL,
  guid TEXT,
  section TEXT,
  feeds TEXT,
  title TEXT,
  pub_date TIMESTAMPTZ,
  description_html TEXT,
  body_html TEXT,
  image_url TEXT,
  json_ld JSONB,
  kind TEXT NOT NULL DEFAULT 'rss',
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT meduza_import_url_unique UNIQUE (url)
);

CREATE INDEX IF NOT EXISTS meduza_import_pub_date_idx ON meduza_import (pub_date DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS meduza_import_section_idx ON meduza_import (section);
