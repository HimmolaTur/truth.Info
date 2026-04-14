-- Первая миграция приложения (дубликат логики /migrations для `supabase db push`).
-- Не создаём supabase_migrations вручную — этим занимается Supabase CLI.

-- --- create_news_table.sql ---
CREATE TABLE IF NOT EXISTS news (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  image_url TEXT,
  category TEXT DEFAULT 'Общее',
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  is_important BOOLEAN NOT NULL DEFAULT false,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- --- add_users_role.sql ---
ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'user';
COMMENT ON COLUMN users.role IS 'user — обычный пользователь форума; admin — доступ к /admin';

-- --- create_forum_bans.sql ---
CREATE TABLE IF NOT EXISTS forum_bans (
  id SERIAL PRIMARY KEY,
  session_id TEXT NOT NULL,
  reason TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- --- news_admin_fields.sql ---
ALTER TABLE news ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE news ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'Общее';
ALTER TABLE news ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE news ADD COLUMN IF NOT EXISTS is_important BOOLEAN DEFAULT false;
ALTER TABLE news ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;
ALTER TABLE news ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'news' AND column_name = 'image'
  ) THEN
    UPDATE news
    SET image_url = NULLIF(TRIM(image::text), '')
    WHERE (image_url IS NULL OR TRIM(image_url) = '')
      AND image IS NOT NULL
      AND TRIM(image::text) <> '';
  END IF;
END $$;

-- --- news_image_url_local.sql ---
UPDATE news
SET image_url = '/images/photo-' || (regexp_match(image_url, 'photo-(\d+-[a-zA-Z0-9]+)'))[1] || '.jpg'
WHERE image_url IS NOT NULL
  AND TRIM(image_url) <> ''
  AND image_url ~* 'unsplash\.com'
  AND regexp_match(image_url, 'photo-(\d+-[a-zA-Z0-9]+)') IS NOT NULL;

-- --- roles_permissions.sql ---
CREATE TABLE IF NOT EXISTS permissions (
  key TEXT PRIMARY KEY,
  sort_order INT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS roles (
  id SERIAL PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  is_system BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS role_permissions (
  role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_key TEXT NOT NULL REFERENCES permissions(key) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_key)
);

INSERT INTO permissions (key, sort_order) VALUES
  ('panel.access', 0),
  ('content.news', 10),
  ('content.factcheck', 20),
  ('forum.moderate', 30),
  ('reports.view', 40),
  ('users.manage', 50),
  ('roles.manage', 60)
ON CONFLICT (key) DO NOTHING;

INSERT INTO roles (slug, name, is_system) VALUES
  ('user', 'Пользователь', true),
  ('editor', 'Редактор', true),
  ('moderator', 'Модератор', true),
  ('admin', 'Администратор', true)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO role_permissions (role_id, permission_key)
SELECT r.id, p.key
FROM roles r
CROSS JOIN permissions p
WHERE r.slug = 'admin'
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role_id, permission_key)
SELECT r.id, v.key
FROM roles r
CROSS JOIN (VALUES
  ('panel.access'),
  ('content.news'),
  ('content.factcheck')
) AS v(key)
WHERE r.slug = 'editor'
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role_id, permission_key)
SELECT r.id, v.key
FROM roles r
CROSS JOIN (VALUES
  ('panel.access'),
  ('forum.moderate'),
  ('reports.view')
) AS v(key)
WHERE r.slug = 'moderator'
ON CONFLICT DO NOTHING;

ALTER TABLE users ADD COLUMN IF NOT EXISTS role_id INTEGER REFERENCES roles(id);

UPDATE users SET role_id = (SELECT id FROM roles WHERE slug = 'admin' LIMIT 1)
WHERE role_id IS NULL
  AND LOWER(COALESCE(NULLIF(TRIM(role), ''), 'user')) = 'admin';

UPDATE users SET role_id = (SELECT id FROM roles WHERE slug = 'user' LIMIT 1)
WHERE role_id IS NULL;

ALTER TABLE users ALTER COLUMN role_id SET NOT NULL;

UPDATE users u SET role = r.slug
FROM roles r
WHERE r.id = u.role_id;

CREATE INDEX IF NOT EXISTS idx_users_role_id ON users(role_id);

-- --- roles_granular_permissions.sql ---
DELETE FROM role_permissions;

DELETE FROM permissions
WHERE key IN (
  'panel.access',
  'content.news',
  'content.factcheck',
  'forum.moderate',
  'reports.view',
  'users.manage',
  'roles.manage'
);

INSERT INTO permissions (key, sort_order) VALUES
  ('panel.access', 0),
  ('content.news.read', 10),
  ('content.news.create', 11),
  ('content.news.update', 12),
  ('content.news.delete', 13),
  ('content.factcheck.read', 20),
  ('content.factcheck.create', 21),
  ('content.factcheck.update', 22),
  ('content.factcheck.delete', 23),
  ('forum.moderate.read', 30),
  ('forum.moderate.delete_post', 31),
  ('forum.moderate.delete_topic', 32),
  ('forum.moderate.pin_topic', 33),
  ('forum.moderate.unpin_topic', 34),
  ('forum.moderate.close_topic', 35),
  ('forum.moderate.open_topic', 36),
  ('reports.read', 40),
  ('users.read', 50),
  ('users.update', 51),
  ('roles.read', 60),
  ('roles.create', 61),
  ('roles.update', 62),
  ('roles.delete', 63)
ON CONFLICT (key) DO UPDATE SET sort_order = EXCLUDED.sort_order;

INSERT INTO role_permissions (role_id, permission_key)
SELECT r.id, p.key
FROM roles r
CROSS JOIN permissions p
WHERE r.slug = 'admin'
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role_id, permission_key)
SELECT r.id, v.key
FROM roles r
CROSS JOIN (VALUES
  ('panel.access'),
  ('content.news.read'),
  ('content.news.create'),
  ('content.news.update'),
  ('content.news.delete'),
  ('content.factcheck.read'),
  ('content.factcheck.create'),
  ('content.factcheck.update'),
  ('content.factcheck.delete')
) AS v(key)
WHERE r.slug = 'editor'
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role_id, permission_key)
SELECT r.id, v.key
FROM roles r
CROSS JOIN (VALUES
  ('panel.access'),
  ('forum.moderate.read'),
  ('forum.moderate.delete_post'),
  ('forum.moderate.delete_topic'),
  ('forum.moderate.pin_topic'),
  ('forum.moderate.unpin_topic'),
  ('forum.moderate.close_topic'),
  ('forum.moderate.open_topic'),
  ('reports.read')
) AS v(key)
WHERE r.slug = 'moderator'
ON CONFLICT DO NOTHING;

-- --- user_preferred_locale.sql ---
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS preferred_locale VARCHAR(8) DEFAULT NULL;
