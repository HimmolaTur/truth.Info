-- Роль пользователя: user | admin (админка NextAuth только для role = admin)
ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'user';

COMMENT ON COLUMN users.role IS 'user — обычный пользователь форума; admin — доступ к /admin';

-- Пример назначения первого админа (подставьте свой username):
-- UPDATE users SET role = 'admin' WHERE username = 'ваш_логин';
