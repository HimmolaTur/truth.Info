import { NextResponse } from "next/server";
import { assertPermission } from "@/lib/adminAuthUtils";
import { query } from "@/lib/db";

const ACTION_PERM: Record<string, string> = {
  delete_post: "forum.moderate.delete_post",
  delete_topic: "forum.moderate.delete_topic",
  close_topic: "forum.moderate.close_topic",
  pin_topic: "forum.moderate.pin_topic",
  unpin_topic: "forum.moderate.unpin_topic",
  open_topic: "forum.moderate.open_topic",
};

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const action = String(form.get("action") || "");
    const perm = ACTION_PERM[action];
    if (!perm) {
      return NextResponse.json({ ok: false, error: "unknown action" }, { status: 400 });
    }
    const denied = await assertPermission(req, perm);
    if (denied) return denied;

    if (action === "delete_post") {
      const postId = form.get("post_id");
      if (postId) {
        await query("DELETE FROM forum_comments WHERE id = $1", [Number(postId)]);
      }
      return NextResponse.json({ ok: true });
    }

    if (action === "delete_topic") {
      const topicIdRaw = form.get("topic_id");
      if (!topicIdRaw) {
        return NextResponse.json({ ok: false, error: "missing topic_id" }, { status: 400 });
      }
      const tid = Number(topicIdRaw);
      if (!Number.isFinite(tid)) {
        return NextResponse.json({ ok: false, error: "bad topic_id" }, { status: 400 });
      }

      await query("DELETE FROM forum_reports WHERE topic_id = $1", [tid]);
      await query("DELETE FROM forum_notifications WHERE topic_id = $1", [tid]);
      await query("DELETE FROM forum_subscriptions WHERE topic_id = $1", [tid]);

      const pollsRes = await query("SELECT id FROM forum_polls WHERE topic_id = $1", [tid]);
      for (const row of pollsRes.rows as { id: number }[]) {
        const pid = row.id;
        await query("DELETE FROM forum_poll_votes WHERE poll_id = $1", [pid]);
        await query("DELETE FROM forum_poll_options WHERE poll_id = $1", [pid]);
      }
      await query("DELETE FROM forum_polls WHERE topic_id = $1", [tid]);
      await query("DELETE FROM forum_comments WHERE topic_id = $1", [tid]);
      await query("DELETE FROM forum_topics WHERE id = $1", [tid]);

      return NextResponse.json({ ok: true });
    }

    if (action === "close_topic") {
      const topicId = form.get("topic_id");
      if (topicId) {
        await query("UPDATE forum_topics SET is_closed = true WHERE id = $1", [Number(topicId)]);
      }
      return NextResponse.json({ ok: true });
    }

    if (action === "open_topic") {
      const topicId = form.get("topic_id");
      if (topicId) {
        await query("UPDATE forum_topics SET is_closed = false WHERE id = $1", [Number(topicId)]);
      }
      return NextResponse.json({ ok: true });
    }

    if (action === "pin_topic") {
      const topicId = form.get("topic_id");
      if (topicId) {
        await query("UPDATE forum_topics SET is_pinned = true WHERE id = $1", [Number(topicId)]);
      }
      return NextResponse.json({ ok: true });
    }

    if (action === "unpin_topic") {
      const topicId = form.get("topic_id");
      if (topicId) {
        await query("UPDATE forum_topics SET is_pinned = false WHERE id = $1", [Number(topicId)]);
      }
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: false, error: "unknown action" }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
