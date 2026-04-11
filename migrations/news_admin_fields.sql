-- Поля новостей для сайта и админки
ALTER TABLE news ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE news ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'Общее';
ALTER TABLE news ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE news ADD COLUMN IF NOT EXISTS is_important BOOLEAN DEFAULT false;
ALTER TABLE news ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;
ALTER TABLE news ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;

-- Перенос из колонки image → image_url (если image ещё есть)
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
