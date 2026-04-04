import { NextResponse } from "next/server";
import { clearSession } from "@/lib/auth";

export async function POST(req: Request) {
  clearSession();
  
  // Если запрос пришел из формы (x-www-form-urlencoded), делаем редирект
  if (req.headers.get("content-type")?.includes("application/x-www-form-urlencoded")) {
    const url = new URL(req.url);
    return NextResponse.redirect(new URL("/forum", url.origin), 303);
  }
  
  return NextResponse.json({ success: true });
}
