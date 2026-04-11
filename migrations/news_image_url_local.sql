-- Заменить внешние URL Unsplash в news.image_url на локальные пути /images/photo-*.jpg
UPDATE news
SET image_url = '/images/photo-' || (regexp_match(image_url, 'photo-(\d+-[a-zA-Z0-9]+)'))[1] || '.jpg'
WHERE image_url IS NOT NULL
  AND TRIM(image_url) <> ''
  AND image_url ~* 'unsplash\.com'
  AND regexp_match(image_url, 'photo-(\d+-[a-zA-Z0-9]+)') IS NOT NULL;
