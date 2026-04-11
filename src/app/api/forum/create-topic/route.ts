import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { cookies } from "next/headers";
import authOptions from "@/lib/authOptions";
import { query } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { slugify } from "@/lib/utils";

export async function POST(req: Request) {
  try {
    const s = await getServerSession(authOptions);
    if (!s?.user?.id) {
      return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }
    const userId = Number(s.user.id);
    if (!Number.isFinite(userId)) {
      return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }
    const username = s.user.name || "";

    const form = await req.formData();
    const title = String(form.get("title") || "");
    const content = String(form.get("content") || "");
    const category_id = String(form.get("category_id") || "");
    const tagsStr = String(form.get("tags") || "");
    const tags = tagsStr ? tagsStr.split(",").map((t) => t.trim()).filter(Boolean) : [];
    const pollQuestion = String(form.get("poll_question") || "");
    const pollOptionsStr = String(form.get("poll_options") || "");
    const pollOptions = pollOptionsStr ? pollOptionsStr.split("\n").map((o) => o.trim()).filter(Boolean) : [];

    if (!title || !content || !category_id) {
      return NextResponse.json({ ok: false, error: "required" }, { status: 400 });
    }

    const cookieStore = cookies();
    const author_session_id = cookieStore.get("anon_session")?.value || null;

    const result = await query(
      "INSERT INTO forum_topics (category_id, title, content, author_name, tags, author_session_id, user_id) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id",
      [category_id, title, content, username, tags, author_session_id, userId]
    );
    const newTopicId = result.rows[0].id as number;

    if (pollQuestion && pollOptions.length >= 2) {
      const pollRes = await query(
        "INSERT INTO forum_polls (topic_id, question) VALUES ($1, $2) RETURNING id",
        [newTopicId, pollQuestion]
      );
      const pollId = pollRes.rows[0].id;
      for (const option of pollOptions) {
        await query("INSERT INTO forum_poll_options (poll_id, text) VALUES ($1, $2)", [pollId, option]);
      }
    }

    revalidatePath("/forum");
    const href = `/forum/${newTopicId}-${slugify(title)}`;
    return NextResponse.json({ ok: true, redirect: href });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
