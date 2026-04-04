import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import bcrypt from "bcryptjs";
import { setSession } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json({ error: "Логин и пароль обязательны" }, { status: 400 });
    }

    // Ищем пользователя
    const result = await query("SELECT * FROM users WHERE username = $1", [username]);
    
    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Неверный логин или пароль" }, { status: 401 });
    }

    const user = result.rows[0];

    // Проверяем пароль
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return NextResponse.json({ error: "Неверный логин или пароль" }, { status: 401 });
    }

    // Устанавливаем сессию
    await setSession({
      id: user.id,
      username: user.username,
      display_name: user.display_name,
      avatar_url: user.avatar_url,
    });

    return NextResponse.json({ 
      success: true, 
      user: { id: user.id, username: user.username, display_name: user.display_name, avatar_url: user.avatar_url } 
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "Внутренняя ошибка сервера" }, { status: 500 });
  }
}
