-- Базовая таблица новостей (если таблицу удалили — создаётся заново)
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
-- Индекс отдельно не создаём здесь: на занятой таблице CREATE INDEX может долго ждать блокировку при открытом dev-сервере.
