import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/admin/'],
      },
      {
        // Специальные правила для AI-ботов (разрешаем индексировать публичный контент для обучения/ответов)
        userAgent: ['GPTBot', 'ChatGPT-User', 'Google-Extended', 'Anthropic-ai', 'Claude-Web', 'PerplexityBot'],
        allow: ['/forum/', '/news/', '/factcheck/', '/timeline/', '/map/'],
        disallow: ['/api/', '/admin/'],
      }
    ],
    sitemap: 'https://pravda-info.local/sitemap.xml', // Замените на реальный домен
  };
}
