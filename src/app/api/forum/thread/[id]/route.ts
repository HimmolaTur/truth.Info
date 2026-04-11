import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getServerSession, type Session } from "next-auth";
import authOptions from "@/lib/authOptions";
import { forumModerationFromPermissions } from "@/lib/forumModeration";
import { loadForumThreadPayload, type ForumUserSessionLite } from "@/lib/forumThreadData";

function parseTopicId(param: string): number {
  const n = parseInt(param, 10);
  return Number.isFinite(n) ? n : NaN;
}

function sessionLiteFromAuth(s: Session | null): ForumUserSessionLite | null {
  if (!s?.user?.id) return null;
  const id = Number(s.user.id);
  if (!Number.isFinite(id)) return null;
  return { id, username: s.user.name || "" };
}

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const topicId = parseTopicId(params.id);
  if (Number.isNaN(topicId)) {
    return NextResponse.json({ ok: false, error: "bad_id" }, { status: 400 });
  }

  const { searchParams } = new URL(req.url);
  const sort = searchParams.get("sort") || "oldest";
  if (!["oldest", "newest", "popular"].includes(sort)) {
    return NextResponse.json({ ok: false, error: "bad_sort" }, { status: 400 });
  }

  const cookieStore = cookies();
  const currentSessionId = cookieStore.get("anon_session")?.value ?? null;
  const authSession = await getServerSession(authOptions);
  const userSession = sessionLiteFromAuth(authSession);
  const modPerms = (Array.isArray(authSession?.user?.permissions)
    ? authSession.user.permissions
    : []) as string[];
  const forumModeration = forumModerationFromPermissions(modPerms);

  const data = await loadForumThreadPayload(topicId, sort, {
    bumpViews: false,
    userSession,
    currentSessionId,
    forumModeration,
  });

  if (!data) {
    return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true, data });
}
