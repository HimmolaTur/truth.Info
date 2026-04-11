import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { isPresetAvatarUrl } from "@/lib/forumAvatars";
import { locales } from "@/navigation";

const LOCALE_SET = new Set(locales as readonly string[]);

export async function POST(req: Request) {
  try {
    const { username, password, avatar_url, preferred_locale } = await req.json();

    if (!username || !password) {
      return NextResponse.json({ error: "register_required_fields" }, { status: 400 });
    }

    if (username.length < 3) {
      return NextResponse.json({ error: "register_username_short" }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "register_password_short" }, { status: 400 });
    }

    const existingUser = await query("SELECT id FROM users WHERE username = $1", [username]);
    if (existingUser.rows.length > 0) {
      return NextResponse.json({ error: "register_username_taken" }, { status: 400 });
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const hash = crypto.createHash("sha256").update(username + "secret-salt").digest("hex").substring(0, 10);
    const display_name = `Anon_${hash}`;

    let finalAvatar = typeof avatar_url === "string" && isPresetAvatarUrl(avatar_url.trim())
      ? avatar_url.trim()
      : `/avatars/avatar${Math.floor(Math.random() * 10) + 1}.svg`;

    const loc =
      typeof preferred_locale === "string" && LOCALE_SET.has(preferred_locale.trim())
        ? preferred_locale.trim()
        : null;

    const result = await query(
      `INSERT INTO users (username, password_hash, avatar_url, display_name, role_id, role, preferred_locale)
       VALUES ($1, $2, $3, $4, (SELECT id FROM roles WHERE slug = 'user' LIMIT 1), 'user', $5)
       RETURNING id, username, display_name, avatar_url`,
      [username, password_hash, finalAvatar, display_name, loc]
    );

    const user = result.rows[0];

    return NextResponse.json({ success: true, user });
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json({ error: "register_server_error" }, { status: 500 });
  }
}
