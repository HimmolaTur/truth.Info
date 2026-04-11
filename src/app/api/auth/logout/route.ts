import { NextResponse } from "next/server";
import { clearNextAuthCookies } from "@/lib/nextAuthCookies";

export async function POST(req: Request) {
  const res = NextResponse.json({ success: true });
  clearNextAuthCookies(res);

  if (req.headers.get("content-type")?.includes("application/x-www-form-urlencoded")) {
    const url = new URL(req.url);
    const redirectRes = NextResponse.redirect(new URL("/forum", url.origin), 303);
    clearNextAuthCookies(redirectRes);
    return redirectRes;
  }

  return res;
}
