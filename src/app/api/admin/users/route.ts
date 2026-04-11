import { NextResponse } from "next/server";
import { gatePermission } from "@/lib/adminAuthUtils";
import { adminApplyUserUpdate } from "@/lib/adminUsersUpdate";

export async function POST(req: Request) {
  const g = await gatePermission(req, "users.update");
  if (g.denied) return g.response;

  try {
    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
    if (!body || body.action !== "update") {
      return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
    }

    const idRaw = body.id;
    const id = typeof idRaw === "number" ? idRaw : parseInt(String(idRaw ?? ""), 10);
    if (!Number.isFinite(id) || id < 1) {
      return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
    }

    const roleIdRaw = body.role_id;
    const role_id =
      typeof roleIdRaw === "number" ? roleIdRaw : parseInt(String(roleIdRaw ?? ""), 10);
    if (!Number.isFinite(role_id) || role_id < 1) {
      return NextResponse.json({ ok: false, error: "invalid_role" }, { status: 400 });
    }

    const avatar_url =
      body.avatar_url === null || body.avatar_url === undefined
        ? null
        : String(body.avatar_url);
    const new_password =
      body.new_password === null || body.new_password === undefined
        ? null
        : String(body.new_password);

    const result = await adminApplyUserUpdate(id, {
      role_id,
      avatar_url,
      new_password,
    });

    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.code }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
