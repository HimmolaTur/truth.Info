-- ЧАСТЬ 1: СХЕМА БАЗЫ ДАННЫХ

-- 1. Таблица пользователей (авторизация)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    display_name VARCHAR(100),
    avatar_url VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Профили анонимных сессий (для отслеживания онлайна, кармы и игнора)
CREATE TABLE IF NOT EXISTS user_profiles (
    session_id TEXT PRIMARY KEY,
    last_active_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_post_at TIMESTAMP WITH TIME ZONE,
    karma INTEGER DEFAULT 0,
    ignored_sessions TEXT[] DEFAULT '{}'
);

-- 3. Категории форума
CREATE TABLE IF NOT EXISTS forum_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    icon VARCHAR(50),
    color VARCHAR(50)
);

-- 4. Темы форума
CREATE TABLE IF NOT EXISTS forum_topics (
    id SERIAL PRIMARY KEY,
    category_id INTEGER REFERENCES forum_categories(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    author_session_id TEXT,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    author_name VARCHAR(100) DEFAULT 'Аноним',
    views INTEGER DEFAULT 0,
    likes INTEGER DEFAULT 0,
    dislikes INTEGER DEFAULT 0,
    is_pinned BOOLEAN DEFAULT false,
    is_closed BOOLEAN DEFAULT false,
    tags TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Комментарии (ответы)
CREATE TABLE IF NOT EXISTS forum_comments (
    id SERIAL PRIMARY KEY,
    topic_id INTEGER REFERENCES forum_topics(id) ON DELETE CASCADE,
    parent_id INTEGER REFERENCES forum_comments(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    author_session_id TEXT,
    content TEXT NOT NULL,
    author_name VARCHAR(100) DEFAULT 'Аноним',
    likes INTEGER DEFAULT 0,
    dislikes INTEGER DEFAULT 0,
    is_best_answer BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Опросы
CREATE TABLE IF NOT EXISTS forum_polls (
    id SERIAL PRIMARY KEY,
    topic_id INTEGER REFERENCES forum_topics(id) ON DELETE CASCADE,
    question VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. Варианты ответов в опросах
CREATE TABLE IF NOT EXISTS forum_poll_options (
    id SERIAL PRIMARY KEY,
    poll_id INTEGER REFERENCES forum_polls(id) ON DELETE CASCADE,
    text VARCHAR(255) NOT NULL,
    votes INTEGER DEFAULT 0
);

-- 8. Голоса пользователей в опросах
CREATE TABLE IF NOT EXISTS forum_poll_votes (
    id SERIAL PRIMARY KEY,
    poll_id INTEGER REFERENCES forum_polls(id) ON DELETE CASCADE,
    option_id INTEGER REFERENCES forum_poll_options(id) ON DELETE CASCADE,
    session_id TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(poll_id, session_id)
);

-- 9. Жалобы
CREATE TABLE IF NOT EXISTS forum_reports (
    id SERIAL PRIMARY KEY,
    topic_id INTEGER REFERENCES forum_topics(id) ON DELETE CASCADE,
    comment_id INTEGER REFERENCES forum_comments(id) ON DELETE CASCADE,
    reporter_session_id TEXT,
    reason TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 10. Уведомления
CREATE TABLE IF NOT EXISTS forum_notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    session_id TEXT,
    topic_id INTEGER REFERENCES forum_topics(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 11. Подписки на темы
CREATE TABLE IF NOT EXISTS forum_subscriptions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    topic_id INTEGER REFERENCES forum_topics(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, topic_id)
);

-- 12. Добавляем базовые категории
INSERT INTO forum_categories (name, description, icon, color) VALUES
('Обсуждение', 'Общие темы, вопросы и ответы на любые темы', 'Users', 'text-green-600'),
('Новости платформы', 'Важные анонсы и обновления: функционал, правила', 'MessageSquare', 'text-blue-600'),
('Срочные события', 'Публикация фактов, новостей и происшествий', 'AlertCircle', 'text-amber-600'),
('Вопросы и помощь', 'Взаимопомощь, советы по безопасности и связи', 'HelpCircle', 'text-purple-600')
ON CONFLICT DO NOTHING;

-- 13. Новости
CREATE TABLE IF NOT EXISTS news (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    category VARCHAR(100),
    tags TEXT[],
    is_important BOOLEAN DEFAULT false,
    image_url VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 14. Фактчекинг
CREATE TABLE IF NOT EXISTS factchecks (
    id SERIAL PRIMARY KEY,
    claim TEXT NOT NULL,
    truth TEXT NOT NULL,
    sources TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 15. Хронология
CREATE TABLE IF NOT EXISTS timeline_events (
    id SERIAL PRIMARY KEY,
    date_str VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    event_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 16. Истории пользователей
CREATE TABLE IF NOT EXISTS user_stories (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    sources TEXT,
    is_anonymous BOOLEAN DEFAULT true,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 17. События на карте
CREATE TABLE IF NOT EXISTS map_events (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    lat DOUBLE PRECISION NOT NULL,
    lng DOUBLE PRECISION NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);



-- Очистка таблиц перед вставкой (на всякий случай)
TRUNCATE TABLE map_events CASCADE;
TRUNCATE TABLE user_stories CASCADE;
TRUNCATE TABLE timeline_events CASCADE;
TRUNCATE TABLE factchecks CASCADE;
TRUNCATE TABLE news CASCADE;
TRUNCATE TABLE forum_subscriptions CASCADE;
TRUNCATE TABLE forum_notifications CASCADE;
TRUNCATE TABLE forum_reports CASCADE;
TRUNCATE TABLE forum_poll_votes CASCADE;
TRUNCATE TABLE forum_poll_options CASCADE;
TRUNCATE TABLE forum_polls CASCADE;
TRUNCATE TABLE forum_comments CASCADE;
TRUNCATE TABLE forum_topics CASCADE;
TRUNCATE TABLE forum_categories CASCADE;
TRUNCATE TABLE user_profiles CASCADE;
TRUNCATE TABLE users CASCADE;
