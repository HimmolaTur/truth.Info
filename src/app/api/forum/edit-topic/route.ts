import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { query } from "@/lib/db";
import { slugify } from "@/lib/utils";
import { revalidateForumTopicPath } from "@/lib/forumRevalidate";

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const topicId = parseInt(String(form.get("topic_id") || ""), 10);
    const title = String(form.get("title") || "");
    const content = String(form.get("content") || "");
    const tagsStr = String(form.get("tags") || "");
    const tags = tagsStr ? tagsStr.split(",").map((t) => t.trim()).filter(Boolean) : [];

    if (Number.isNaN(topicId) || !title || !content) {
      return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
    }

    const cookieStore = cookies();
    const sessionId = cookieStore.get("anon_session")?.value;
    if (!sessionId) {
      return NextResponse.json({ ok: false, error: "session" }, { status: 403 });
    }

    const checkRes = await query("SELECT author_session_id FROM forum_topics WHERE id = $1", [topicId]);
    if (checkRes.rows.length === 0 || checkRes.rows[0].author_session_id !== sessionId) {
      return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
    }

    await query("UPDATE forum_topics SET title = $1, content = $2, tags = $3 WHERE id = $4", [
      title,
      content,
      tags,
      topicId,
    ]);

    await revalidateForumTopicPath(topicId);
    const href = `/forum/${topicId}-${slugify(title)}`;
    return NextResponse.json({ ok: true, redirect: href });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
