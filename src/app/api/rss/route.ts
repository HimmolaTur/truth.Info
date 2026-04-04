import { query } from "@/lib/db";
import { NextResponse } from "next/server";
import { slugify } from "@/lib/utils";

export async function GET() {
  try {
    const result = await query('SELECT * FROM forum_topics ORDER BY created_at DESC LIMIT 20');
    const topics = result.rows;

    const itemsXml = topics.map((topic: any) => `
      <item>
        <title><![CDATA[${topic.title}]]></title>
        <link>http://localhost:3000/ru/forum/${topic.id}-${slugify(topic.title)}</link>
        <description><![CDATA[${topic.content.substring(0, 300)}...]]></description>
        <pubDate>${new Date(topic.created_at).toUTCString()}</pubDate>
        <guid>http://localhost:3000/ru/forum/${topic.id}-${slugify(topic.title)}</guid>
      </item>
    `).join('');

    const rss = `<?xml version="1.0" encoding="UTF-8" ?>
      <rss version="2.0">
        <channel>
          <title>Анонимный Форум</title>
          <link>http://localhost:3000/forum</link>
          <description>Последние темы и обсуждения</description>
          ${itemsXml}
        </channel>
      </rss>`;

    return new NextResponse(rss, {
      headers: {
        'Content-Type': 'text/xml',
      },
    });
  } catch (error) {
    console.error(error);
    return new NextResponse('Error generating RSS feed', { status: 500 });
  }
}
