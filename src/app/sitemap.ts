import { MetadataRoute } from 'next';
import { query } from '@/lib/db';
import { slugify } from '@/lib/utils';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://pravda-info.local'; // Замените на реальный домен
  const locales = ['ru', 'en', 'uk', 'de'];

  // Получаем динамические темы форума
  let topics: any[] = [];
  try {
    const topicsResult = await query('SELECT id, title, created_at FROM forum_topics ORDER BY created_at DESC LIMIT 1000');
    topics = topicsResult.rows;
  } catch (e) {
    console.error("Failed to fetch topics for sitemap", e);
  }

  const sitemap: MetadataRoute.Sitemap = [];

  locales.forEach((locale) => {
    // Статические страницы
    ['', '/forum', '/news', '/factcheck', '/timeline', '/map'].forEach((route) => {
      sitemap.push({
        url: `${baseUrl}/${locale}${route}`,
        lastModified: new Date(),
        changeFrequency: route === '' ? 'daily' : 'hourly',
        priority: route === '' ? 1 : 0.8,
      });
    });

    // Динамические страницы форума
    topics.forEach((topic) => {
      sitemap.push({
        url: `${baseUrl}/${locale}/forum/${topic.id}-${slugify(topic.title)}`,
        lastModified: new Date(topic.created_at),
        changeFrequency: 'always', // Форум часто обновляется
        priority: 0.6,
      });
    });
  });

  return sitemap;
}
