-- Детальные права: чтение / создание / правка / удаление по разделам + расширенная модерация форума.
-- После применения: npm run db:migrate и перелогин.

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

-- Администратор: все права
INSERT INTO role_permissions (role_id, permission_key)
SELECT r.id, p.key
FROM roles r
CROSS JOIN permissions p
WHERE r.slug = 'admin'
ON CONFLICT DO NOTHING;

-- Редактор: панель + полный CRUD новостей и фактчекинга
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

-- Модератор: панель + форум (все подправа) + чтение жалоб
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
