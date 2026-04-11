import { query } from "@/lib/db";
import { rootShellCopy } from "@/lib/rootShellMessages";
import { normalizeAppLocale } from "@/navigation";
import { slugify } from "@/lib/utils";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const locale = normalizeAppLocale(url.searchParams.get("locale"));
    const rssCopy = rootShellCopy(locale).RssForum;
    const origin = url.origin;

    const result = await query("SELECT * FROM forum_topics ORDER BY created_at DESC LIMIT 20");
    const topics = result.rows;

    const itemsXml = topics
      .map(
        (topic: { id: number; title: string; content: string; created_at: Date | string }) => `
      <item>
        <title><![CDATA[${topic.title}]]></title>
        <link>${origin}/${locale}/forum/${topic.id}-${slugify(topic.title)}</link>
        <description><![CDATA[${topic.content.substring(0, 300)}...]]></description>
        <pubDate>${new Date(topic.created_at).toUTCString()}</pubDate>
        <guid>${origin}/${locale}/forum/${topic.id}-${slugify(topic.title)}</guid>
      </item>
    `
      )
      .join("");

    const rss = `<?xml version="1.0" encoding="UTF-8" ?>
      <rss version="2.0">
        <channel>
          <title><![CDATA[${rssCopy.channelTitle}]]></title>
          <link>${origin}/${locale}/forum</link>
          <description><![CDATA[${rssCopy.channelDescription}]]></description>
          ${itemsXml}
        </channel>
      </rss>`;

    return new NextResponse(rss, {
      headers: {
        "Content-Type": "text/xml; charset=utf-8",
      },
    });
  } catch (error) {
    console.error(error);
    const url = new URL(request.url);
    const locale = normalizeAppLocale(url.searchParams.get("locale"));
    const errMsg = rootShellCopy(locale).RssForum.feedError;
    return new NextResponse(errMsg, { status: 500 });
  }
}
