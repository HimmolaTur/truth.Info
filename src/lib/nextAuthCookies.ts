import type { NextResponse } from "next/server";

const NEXT_AUTH_COOKIE_NAMES = [
  "next-auth.session-token",
  "__Secure-next-auth.session-token",
  "__Host-next-auth.session-token",
  "next-auth.csrf-token",
  "__Host-next-auth.csrf-token",
  "__Secure-next-auth.csrf-token",
  "next-auth.callback-url",
  "__Secure-next-auth.callback-url",
] as const;

/** Clears NextAuth cookies on a response (logout / invalid session). */
export function clearNextAuthCookies(res: NextResponse) {
  const secure = process.env.NODE_ENV === "production";
  for (const name of NEXT_AUTH_COOKIE_NAMES) {
    res.cookies.set(name, "", {
      path: "/",
      maxAge: 0,
      httpOnly: true,
      sameSite: "lax",
      secure,
    });
  }
}
