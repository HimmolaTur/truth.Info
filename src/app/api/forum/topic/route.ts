import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { cookies } from "next/headers";
import authOptions from "@/lib/authOptions";
import { query } from "@/lib/db";
import { revalidateForumTopicPath } from "@/lib/forumRevalidate";

type UserSession = { id: number; username: string };

async function getForumSession(): Promise<UserSession | null> {
  const s = await getServerSession(authOptions);
  if (!s?.user?.id) return null;
  const id = Number(s.user.id);
  if (!Number.isFinite(id)) return null;
  return { id, username: s.user.name || "" };
}

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const action = String(form.get("forum_action") || "");
    const topicIdRaw = form.get("topic_id");
    const topicId = topicIdRaw != null ? parseInt(String(topicIdRaw), 10) : NaN;
    if (!action || Number.isNaN(topicId)) {
      return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
    }

    const cookieStore = cookies();
    const anonSessionId = cookieStore.get("anon_session")?.value || null;

    if (action === "toggle_subscription") {
      const session = await getForumSession();
      if (!session) {
        return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
      }
      const subRes = await query("SELECT id FROM forum_subscriptions WHERE user_id = $1 AND topic_id = $2", [
        session.id,
        topicId,
      ]);
      if (subRes.rows.length > 0) {
        await query("DELETE FROM forum_subscriptions WHERE user_id = $1 AND topic_id = $2", [session.id, topicId]);
      } else {
        await query("INSERT INTO forum_subscriptions (user_id, topic_id) VALUES ($1, $2)", [session.id, topicId]);
      }
      await revalidateForumTopicPath(topicId);
      return NextResponse.json({ ok: true });
    }

    if (action === "add_comment") {
      const session = await getForumSession();
      if (!session) {
        return NextResponse.json({
          ok: false,
          needLogin: true,
        });
      }
      const content = String(form.get("content") || "");
      const parentRaw = form.get("parent_id");
      const parent_id = parentRaw ? parseInt(String(parentRaw), 10) : null;
      const author_name = session.username;
      const author_session_id = anonSessionId;

      if (!content) {
        return NextResponse.json({ ok: false, error: "empty" }, { status: 400 });
      }

      const blacklist = ["спам", "реклама", "viagra", "казино"];
      const lowerContent = content.toLowerCase();
      for (const word of blacklist) {
        if (lowerContent.includes(word)) {
          return NextResponse.json({ ok: true });
        }
      }

      await query(
        "INSERT INTO forum_comments (topic_id, content, author_name, parent_id, author_session_id, user_id) VALUES ($1, $2, $3, $4, $5, $6)",
        [topicId, content, author_name, parent_id, author_session_id, session.id]
      );

      const subsRes = await query("SELECT user_id FROM forum_subscriptions WHERE topic_id = $1", [topicId]);
      for (const sub of subsRes.rows as { user_id: number }[]) {
        if (sub.user_id !== session.id) {
          await query(
            "INSERT INTO forum_notifications (user_id, topic_id, message) VALUES ($1, $2, $3)",
            [sub.user_id, topicId, `Новый ответ в теме от ${author_name}`]
          );
        }
      }

      await revalidateForumTopicPath(topicId);
      return NextResponse.json({ ok: true });
    }

    if (action === "like_topic") {
      await query("UPDATE forum_topics SET likes = likes + 1 WHERE id = $1", [topicId]);
      const topicRes = await query("SELECT author_session_id FROM forum_topics WHERE id = $1", [topicId]);
      if (topicRes.rows.length > 0 && topicRes.rows[0].author_session_id) {
        await query("UPDATE user_profiles SET karma = karma + 1 WHERE session_id = $1", [
          topicRes.rows[0].author_session_id,
        ]);
      }
      await revalidateForumTopicPath(topicId);
      return NextResponse.json({ ok: true });
    }

    if (action === "dislike_topic") {
      await query("UPDATE forum_topics SET dislikes = dislikes + 1 WHERE id = $1", [topicId]);
      const topicRes = await query("SELECT author_session_id FROM forum_topics WHERE id = $1", [topicId]);
      if (topicRes.rows.length > 0 && topicRes.rows[0].author_session_id) {
        await query("UPDATE user_profiles SET karma = karma - 1 WHERE session_id = $1", [
          topicRes.rows[0].author_session_id,
        ]);
      }
      await revalidateForumTopicPath(topicId);
      return NextResponse.json({ ok: true });
    }

    if (action === "like_comment") {
      const commentId = form.get("comment_id");
      if (!commentId) return NextResponse.json({ ok: false, error: "missing comment" }, { status: 400 });
      await query("UPDATE forum_comments SET likes = likes + 1 WHERE id = $1", [commentId]);
      const commentRes = await query("SELECT author_session_id FROM forum_comments WHERE id = $1", [commentId]);
      if (commentRes.rows.length > 0 && commentRes.rows[0].author_session_id) {
        await query("UPDATE user_profiles SET karma = karma + 1 WHERE session_id = $1", [
          commentRes.rows[0].author_session_id,
        ]);
      }
      await revalidateForumTopicPath(topicId);
      return NextResponse.json({ ok: true });
    }

    if (action === "dislike_comment") {
      const commentId = form.get("comment_id");
      if (!commentId) return NextResponse.json({ ok: false, error: "missing comment" }, { status: 400 });
      await query("UPDATE forum_comments SET dislikes = dislikes + 1 WHERE id = $1", [commentId]);
      const commentRes = await query("SELECT author_session_id FROM forum_comments WHERE id = $1", [commentId]);
      if (commentRes.rows.length > 0 && commentRes.rows[0].author_session_id) {
        await query("UPDATE user_profiles SET karma = karma - 1 WHERE session_id = $1", [
          commentRes.rows[0].author_session_id,
        ]);
      }
      await revalidateForumTopicPath(topicId);
      return NextResponse.json({ ok: true });
    }

    if (action === "report_content") {
      const commentId = form.get("comment_id") as string | null;
      const reason = String(form.get("reason") || "");
      if (!reason) return NextResponse.json({ ok: false, error: "reason" }, { status: 400 });
      const sessionId = anonSessionId;
      await query(
        "INSERT INTO forum_reports (topic_id, comment_id, reporter_session_id, reason) VALUES ($1, $2, $3, $4)",
        [topicId, commentId || null, sessionId, reason]
      );
      return NextResponse.json({ ok: true });
    }

    if (action === "delete_comment") {
      const commentId = form.get("comment_id");
      if (!commentId) return NextResponse.json({ ok: false, error: "missing comment" }, { status: 400 });
      const session = await getForumSession();
      if (!session) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
      const commentRes = await query("SELECT user_id FROM forum_comments WHERE id = $1", [commentId]);
      if (commentRes.rows.length === 0 || commentRes.rows[0].user_id !== session.id) {
        return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
      }
      await query("DELETE FROM forum_comments WHERE id = $1", [commentId]);
      await revalidateForumTopicPath(topicId);
      return NextResponse.json({ ok: true });
    }

    if (action === "toggle_pin") {
      const session = await getForumSession();
      const topicRes = await query("SELECT user_id FROM forum_topics WHERE id = $1", [topicId]);
      if (!session || topicRes.rows.length === 0 || topicRes.rows[0].user_id !== session.id) {
        return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
      }
      await query("UPDATE forum_topics SET is_pinned = NOT is_pinned WHERE id = $1", [topicId]);
      await revalidateForumTopicPath(topicId);
      return NextResponse.json({ ok: true });
    }

    if (action === "toggle_close") {
      const session = await getForumSession();
      const topicRes = await query("SELECT user_id FROM forum_topics WHERE id = $1", [topicId]);
      if (!session || topicRes.rows.length === 0 || topicRes.rows[0].user_id !== session.id) {
        return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
      }
      await query("UPDATE forum_topics SET is_closed = NOT is_closed WHERE id = $1", [topicId]);
      await revalidateForumTopicPath(topicId);
      return NextResponse.json({ ok: true });
    }

    if (action === "move_topic") {
      const session = await getForumSession();
      const topicRes = await query("SELECT user_id FROM forum_topics WHERE id = $1", [topicId]);
      if (!session || topicRes.rows.length === 0 || topicRes.rows[0].user_id !== session.id) {
        return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
      }
      const newCategoryId = form.get("category_id");
      if (!newCategoryId) return NextResponse.json({ ok: false, error: "category" }, { status: 400 });
      await query("UPDATE forum_topics SET category_id = $1 WHERE id = $2", [newCategoryId, topicId]);
      await revalidateForumTopicPath(topicId);
      return NextResponse.json({ ok: true });
    }

    if (action === "toggle_best_answer") {
      const commentId = form.get("comment_id");
      if (!commentId) return NextResponse.json({ ok: false, error: "missing comment" }, { status: 400 });
      const session = await getForumSession();
      if (!session) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
      const topicRes = await query("SELECT user_id FROM forum_topics WHERE id = $1", [topicId]);
      if (topicRes.rows.length === 0 || topicRes.rows[0].user_id !== session.id) {
        return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
      }
      await query("UPDATE forum_comments SET is_best_answer = false WHERE topic_id = $1", [topicId]);
      await query("UPDATE forum_comments SET is_best_answer = true WHERE id = $1", [commentId]);
      await revalidateForumTopicPath(topicId);
      return NextResponse.json({ ok: true });
    }

    if (action === "ignore_user") {
      const targetSessionId = String(form.get("target_session_id") || "");
      if (!targetSessionId) return NextResponse.json({ ok: false, error: "target" }, { status: 400 });
      const sessionId = anonSessionId;
      if (!sessionId) return NextResponse.json({ ok: false, error: "session" }, { status: 400 });
      await query(
        `INSERT INTO user_profiles (session_id, ignored_sessions) 
         VALUES ($1, ARRAY[$2]::text[]) 
         ON CONFLICT (session_id) 
         DO UPDATE SET ignored_sessions = array_append(user_profiles.ignored_sessions, $2)
         WHERE NOT ($2 = ANY(user_profiles.ignored_sessions))`,
        [sessionId, targetSessionId]
      );
      await revalidateForumTopicPath(topicId);
      return NextResponse.json({ ok: true });
    }

    if (action === "vote_poll") {
      const optionId = form.get("option_id");
      const pollId = form.get("poll_id");
      if (!optionId || !pollId) return NextResponse.json({ ok: false, error: "poll" }, { status: 400 });
      const sessionId = anonSessionId;
      if (!sessionId) return NextResponse.json({ ok: false, error: "session" }, { status: 400 });
      try {
        await query("INSERT INTO forum_poll_votes (poll_id, option_id, session_id) VALUES ($1, $2, $3)", [
          pollId,
          optionId,
          sessionId,
        ]);
        await query("UPDATE forum_poll_options SET votes = votes + 1 WHERE id = $1", [optionId]);
      } catch {
        // already voted
      }
      await revalidateForumTopicPath(topicId);
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: false, error: "unknown_action" }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
