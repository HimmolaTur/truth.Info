import { NextRequest, NextResponse } from "next/server";
import { clearNextAuthCookies } from "@/lib/nextAuthCookies";

function safeCallbackPath(raw: string | null): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return "/";
  return raw;
}

/** Clears NextAuth cookies and redirects (e.g. account removed from DB). */
export async function GET(req: NextRequest) {
  const next = safeCallbackPath(req.nextUrl.searchParams.get("callbackUrl"));
  const res = NextResponse.redirect(new URL(next, req.url));
  clearNextAuthCookies(res);
  return res;
}
