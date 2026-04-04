CREATE TABLE IF NOT EXISTS news (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    category VARCHAR(100),
    tags TEXT[],
    is_important BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS factchecks (
    id SERIAL PRIMARY KEY,
    claim TEXT NOT NULL,
    truth TEXT NOT NULL,
    sources TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS timeline_events (
    id SERIAL PRIMARY KEY,
    date_str VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    event_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_stories (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    sources TEXT,
    is_anonymous BOOLEAN DEFAULT true,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS map_events (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    lat DOUBLE PRECISION NOT NULL,
    lng DOUBLE PRECISION NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert initial seed data
INSERT INTO news (title, content, category, tags, is_important) VALUES
('Запуск независимой платформы Правда.Инфо', 'Сегодня состоялся запуск новой платформы для сбора и проверки информации. Наша цель — предоставить объективную картину происходящего.', 'Общество', '{"запуск", "платформа"}', true),
('Новый закон о цифровой безопасности: что нужно знать', 'Разбираем основные положения нового законопроекта и как он повлияет на обычных пользователей интернета.', 'Политика', '{"законы", "интернет"}', false),
('Волонтеры организовали новую точку сбора помощи', 'В центре города открылся новый пункт приема гуманитарной помощи. Требуются медикаменты и теплые вещи.', 'Общество', '{"волонтеры", "помощь"}', false)
ON CONFLICT DO NOTHING;

INSERT INTO factchecks (claim, truth, sources) VALUES
('В социальных сетях массово распространяется видео, на котором якобы запечатлены недавние события в городе N.', 'На самом деле это видео было снято в 2018 году в совершенно другом регионе. Анализ метаданных и обратный поиск по изображениям это подтверждают.', '{"https://example.com/original-video-2018", "Анализ независимых экспертов Bellingcat"}'),
('Появилась информация о закрытии всех выездов из города.', 'Официальные источники и очевидцы на местах подтверждают, что трассы М-4 и А-105 открыты для движения гражданского транспорта.', '{"Трансляции с дорожных камер", "Свидетельства волонтеров на местах"}')
ON CONFLICT DO NOTHING;

INSERT INTO timeline_events (date_str, title, description, event_date) VALUES
('Апрель 2026', 'Запуск платформы', 'Команда представила первую версию антивоенного сайта для агрегации проверенной информации.', '2026-04-03'),
('Март 2026', 'Подготовка к проекту', 'Сбор данных, интервью с экспертами по цифровой безопасности и планирование архитектуры.', '2026-03-15'),
('Февраль 2026', 'Идея создания', 'Возникла необходимость в единой платформе для фактчекинга на фоне роста дезинформации.', '2026-02-10')
ON CONFLICT DO NOTHING;

INSERT INTO map_events (title, description, lat, lng) VALUES
('Пункт сбора помощи', 'Работает ежедневно с 10:00 до 20:00. Нужны медикаменты.', 55.7558, 37.6173),
('Перекрытая трасса', 'Движение временно ограничено из-за ремонтных работ.', 55.8000, 37.5000),
('Центр координации волонтеров', 'Главный штаб распределения задач.', 55.7000, 37.7000)
ON CONFLICT DO NOTHING;
