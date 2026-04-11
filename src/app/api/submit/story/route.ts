import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const title = String(form.get("title") || "").trim();
    const content = String(form.get("content") || "");
    const sources = String(form.get("sources") || "");
    const is_anonymous = form.get("is_anonymous") === "on";

    if (!title || !content) {
      return NextResponse.json({ ok: false, error: "required" }, { status: 400 });
    }

    await query(
      "INSERT INTO user_stories (title, content, sources, is_anonymous) VALUES ($1, $2, $3, $4)",
      [title, content, sources, is_anonymous]
    );

    return NextResponse.json({ ok: true, redirect: "/submit?success=true" });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
