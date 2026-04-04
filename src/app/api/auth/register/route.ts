import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import bcrypt from "bcryptjs";
import { setSession } from "@/lib/auth";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const { username, password, avatar_url } = await req.json();

    if (!username || !password) {
      return NextResponse.json({ error: "Логин и пароль обязательны" }, { status: 400 });
    }

    if (username.length < 3) {
      return NextResponse.json({ error: "Логин должен быть не менее 3 символов" }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Пароль должен быть не менее 6 символов" }, { status: 400 });
    }

    // Проверяем, существует ли пользователь
    const existingUser = await query("SELECT id FROM users WHERE username = $1", [username]);
    if (existingUser.rows.length > 0) {
      return NextResponse.json({ error: "Пользователь с таким логином уже существует" }, { status: 400 });
    }

    // Хешируем пароль
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    // Генерируем зашифрованный display_name (шифр)
    const hash = crypto.createHash('sha256').update(username + 'secret-salt').digest('hex').substring(0, 10);
    const display_name = `Anon_${hash}`;

    // Генерируем аватарку, если не выбрана
    const finalAvatar = avatar_url || `/avatars/avatar${Math.floor(Math.random() * 10) + 1}.svg`;

    // Создаем пользователя
    const result = await query(
      "INSERT INTO users (username, password_hash, avatar_url, display_name) VALUES ($1, $2, $3, $4) RETURNING id, username, display_name, avatar_url",
      [username, password_hash, finalAvatar, display_name]
    );

    const user = result.rows[0];

    // Устанавливаем сессию
    await setSession({
      id: user.id,
      username: user.username,
      display_name: user.display_name,
      avatar_url: user.avatar_url,
    });

    return NextResponse.json({ success: true, user });
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json({ error: "Внутренняя ошибка сервера" }, { status: 500 });
  }
}
