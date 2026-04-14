-- Таблицы форума (категории, темы, комментарии, опросы, подписки, уведомления, профили сессий).
-- Зависит от существующей таблицы users.

CREATE TABLE IF NOT EXISTS forum_categories (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  color TEXT,
  CONSTRAINT forum_categories_name_unique UNIQUE (name)
);

CREATE TABLE IF NOT EXISTS forum_topics (
  id SERIAL PRIMARY KEY,
  category_id INTEGER NOT NULL REFERENCES forum_categories(id) ON DELETE RESTRICT,
  title TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  author_name TEXT NOT NULL DEFAULT '',
  tags TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  author_session_id TEXT,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  is_pinned BOOLEAN NOT NULL DEFAULT false,
  is_closed BOOLEAN NOT NULL DEFAULT false,
  views INTEGER NOT NULL DEFAULT 0,
  likes INTEGER NOT NULL DEFAULT 0,
  dislikes INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS forum_topics_category_id_idx ON forum_topics(category_id);
CREATE INDEX IF NOT EXISTS forum_topics_user_id_idx ON forum_topics(user_id);
CREATE INDEX IF NOT EXISTS forum_topics_created_at_idx ON forum_topics(created_at DESC);

CREATE TABLE IF NOT EXISTS forum_comments (
  id SERIAL PRIMARY KEY,
  topic_id INTEGER NOT NULL REFERENCES forum_topics(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  author_name TEXT NOT NULL DEFAULT '',
  parent_id INTEGER REFERENCES forum_comments(id) ON DELETE SET NULL,
  author_session_id TEXT,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  likes INTEGER NOT NULL DEFAULT 0,
  dislikes INTEGER NOT NULL DEFAULT 0,
  is_best_answer BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS forum_comments_topic_id_idx ON forum_comments(topic_id);

CREATE TABLE IF NOT EXISTS forum_polls (
  id SERIAL PRIMARY KEY,
  topic_id INTEGER NOT NULL REFERENCES forum_topics(id) ON DELETE CASCADE,
  question TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS forum_poll_options (
  id SERIAL PRIMARY KEY,
  poll_id INTEGER NOT NULL REFERENCES forum_polls(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  votes INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS forum_poll_votes (
  id SERIAL PRIMARY KEY,
  poll_id INTEGER NOT NULL REFERENCES forum_polls(id) ON DELETE CASCADE,
  option_id INTEGER NOT NULL REFERENCES forum_poll_options(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  CONSTRAINT forum_poll_votes_poll_session_unique UNIQUE (poll_id, session_id)
);

CREATE TABLE IF NOT EXISTS forum_subscriptions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  topic_id INTEGER NOT NULL REFERENCES forum_topics(id) ON DELETE CASCADE,
  CONSTRAINT forum_subscriptions_user_topic_unique UNIQUE (user_id, topic_id)
);

CREATE TABLE IF NOT EXISTS forum_notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  topic_id INTEGER NOT NULL REFERENCES forum_topics(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  session_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS forum_notifications_user_id_idx ON forum_notifications(user_id);

CREATE TABLE IF NOT EXISTS forum_reports (
  id SERIAL PRIMARY KEY,
  topic_id INTEGER NOT NULL REFERENCES forum_topics(id) ON DELETE CASCADE,
  comment_id INTEGER REFERENCES forum_comments(id) ON DELETE SET NULL,
  reporter_session_id TEXT,
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_profiles (
  session_id TEXT PRIMARY KEY,
  last_active_at TIMESTAMPTZ,
  karma INTEGER NOT NULL DEFAULT 0,
  ignored_sessions TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[]
);

INSERT INTO forum_categories (name, description, icon, color) VALUES
  ('Сообщество', 'Общение и знакомства', 'Users', 'text-indigo-600'),
  ('Обсуждения', 'Свободные темы', 'MessageSquare', 'text-blue-600'),
  ('Срочное', 'Важные объявления', 'AlertCircle', 'text-red-600'),
  ('Помощь', 'Вопросы и ответы', 'HelpCircle', 'text-green-600')
ON CONFLICT (name) DO NOTHING;
