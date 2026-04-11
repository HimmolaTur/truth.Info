-- RBAC: роли, права, связь пользователь → роль
-- После применения: перелогиньтесь, чтобы JWT обновился с permissions[].

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

-- Права по ролям (admin = всё)
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

-- Пользователь форума без панели
-- (у роли user нет строк в role_permissions)

ALTER TABLE users ADD COLUMN IF NOT EXISTS role_id INTEGER REFERENCES roles(id);

UPDATE users SET role_id = (SELECT id FROM roles WHERE slug = 'admin' LIMIT 1)
WHERE role_id IS NULL
  AND LOWER(COALESCE(NULLIF(TRIM(role), ''), 'user')) = 'admin';

UPDATE users SET role_id = (SELECT id FROM roles WHERE slug = 'user' LIMIT 1)
WHERE role_id IS NULL;

ALTER TABLE users ALTER COLUMN role_id SET NOT NULL;

-- Синхронизация legacy-колонки role со slug роли
UPDATE users u SET role = r.slug
FROM roles r
WHERE r.id = u.role_id;

CREATE INDEX IF NOT EXISTS idx_users_role_id ON users(role_id);
