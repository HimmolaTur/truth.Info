CREATE TABLE IF NOT EXISTS forum_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    icon VARCHAR(50),
    color VARCHAR(50)
);

CREATE TABLE IF NOT EXISTS forum_topics (
    id SERIAL PRIMARY KEY,
    category_id INTEGER REFERENCES forum_categories(id),
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    author_name VARCHAR(100) DEFAULT 'Аноним',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS forum_comments (
    id SERIAL PRIMARY KEY,
    topic_id INTEGER REFERENCES forum_topics(id),
    content TEXT NOT NULL,
    author_name VARCHAR(100) DEFAULT 'Аноним',
    likes INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert initial data
INSERT INTO forum_categories (name, description, icon, color) VALUES
('Взаимопомощь', 'Поиск помощи, координация волонтеров и поддержка', 'Users', 'text-green-600'),
('Обсуждение новостей', 'Дискуссии о последних событиях и публикациях', 'MessageSquare', 'text-blue-600'),
('Юридическая поддержка', 'Консультации по правам, законам и безопасности', 'AlertCircle', 'text-amber-600'),
('Вопросы и ответы', 'Свободное общение и ответы на частые вопросы', 'HelpCircle', 'text-purple-600')
ON CONFLICT DO NOTHING;
