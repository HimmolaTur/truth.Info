import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import authOptions from "@/lib/authOptions";
import bcrypt from "bcryptjs";
import { query } from "@/lib/db";
import { isPresetAvatarUrl } from "@/lib/forumAvatars";
import { locales } from "@/navigation";

const LOCALE_SET = new Set(locales as readonly string[]);

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  const userId = Number(session.user.id);
  if (!Number.isFinite(userId)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, error: "bad_json" }, { status: 400 });
  }

  const action = String(body.action || "");

  function withLocaleCookie(json: Record<string, unknown>, locale: string) {
    const res = NextResponse.json(json);
    if (LOCALE_SET.has(locale)) {
      res.cookies.set("NEXT_LOCALE", locale, {
        path: "/",
        maxAge: 60 * 60 * 24 * 365,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
      });
    }
    return res;
  }

  if (action === "set_avatar") {
    const url = String(body.avatar_url || "").trim();
    if (!isPresetAvatarUrl(url)) {
      return NextResponse.json({ ok: false, error: "invalid_avatar" }, { status: 400 });
    }
    await query(`UPDATE users SET avatar_url = $1 WHERE id = $2`, [url, userId]);
    return NextResponse.json({ ok: true, avatar_url: url });
  }

  if (action === "change_password") {
    const current = String(body.current_password || "");
    const nextPwd = String(body.new_password || "");
    if (nextPwd.length < 6) {
      return NextResponse.json({ ok: false, error: "password_short" }, { status: 400 });
    }
    const r = await query(`SELECT password_hash FROM users WHERE id = $1`, [userId]);
    const hash = r.rows[0]?.password_hash;
    if (!hash || !(await bcrypt.compare(current, hash))) {
      return NextResponse.json({ ok: false, error: "current_password_wrong" }, { status: 400 });
    }
    const newHash = await bcrypt.hash(nextPwd, 10);
    await query(`UPDATE users SET password_hash = $1 WHERE id = $2`, [newHash, userId]);
    return NextResponse.json({ ok: true });
  }

  if (action === "set_locale") {
    const loc = String(body.locale || "").trim();
    if (!LOCALE_SET.has(loc)) {
      return NextResponse.json({ ok: false, error: "invalid_locale" }, { status: 400 });
    }
    await query(`UPDATE users SET preferred_locale = $1 WHERE id = $2`, [loc, userId]);
    return withLocaleCookie({ ok: true, preferred_locale: loc }, loc);
  }

  if (action === "reveal_account_info") {
    const password = String(body.password || "");
    if (!password) {
      return NextResponse.json({ ok: false, error: "password_required" }, { status: 400 });
    }
    const r = await query(`SELECT password_hash, username, created_at FROM users WHERE id = $1`, [userId]);
    const row = r.rows[0] as { password_hash: string; username: string; created_at: Date } | undefined;
    if (!row?.password_hash || !(await bcrypt.compare(password, row.password_hash))) {
      return NextResponse.json({ ok: false, error: "wrong_password" }, { status: 403 });
    }
    const created =
      row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at);
    return NextResponse.json({ ok: true, username: row.username, created_at: created });
  }

  return NextResponse.json({ ok: false, error: "unknown_action" }, { status: 400 });
}
