import { NextResponse } from "next/server";
import { randomBytes } from "crypto";

export async function GET() {
  const token = randomBytes(24).toString("hex");
  const res = NextResponse.json({ csrfToken: token });
  res.headers.append("Set-Cookie", `csrf_token=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${60 * 30}`);
  return res;
}

