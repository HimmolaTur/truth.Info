import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";

export type AdminGateDenied = { denied: true; response: NextResponse };
export type AdminGateOk = { denied: false; actorId: string };
export type AdminGateResult = AdminGateDenied | AdminGateOk;

function tokenPermissions(token: unknown): string[] {
  const raw = (token as { permissions?: unknown } | null)?.permissions;
  if (Array.isArray(raw)) {
    return raw.map(String);
  }
  if (typeof raw === "string") {
    try {
      const p = JSON.parse(raw) as unknown;
      return Array.isArray(p) ? p.map(String) : [];
    } catch {
      return [];
    }
  }
  return [];
}

/** Проверка одного права по JWT (API routes). */
export async function gatePermission(req: Request, required: string): Promise<AdminGateResult> {
  const secret = process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET;
  if (!secret) {
    return {
      denied: true,
      response: NextResponse.json({ ok: false, error: "NEXTAUTH_SECRET missing" }, { status: 500 }),
    };
  }
  const token = await getToken({ req: req as unknown as Parameters<typeof getToken>[0]["req"], secret });
  if (!token || token.sub == null) {
    return {
      denied: true,
      response: NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 }),
    };
  }
  const perms = tokenPermissions(token);
  if (!perms.includes(required)) {
    return {
      denied: true,
      response: NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 }),
    };
  }
  return { denied: false, actorId: String(token.sub) };
}

export async function assertPermission(req: Request, required: string): Promise<NextResponse | null> {
  const g = await gatePermission(req, required);
  return g.denied ? g.response : null;
}

export async function assertAnyPermission(req: Request, required: string[]): Promise<NextResponse | null> {
  const secret = process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET;
  if (!secret) {
    return NextResponse.json({ ok: false, error: "NEXTAUTH_SECRET missing" }, { status: 500 });
  }
  const token = await getToken({ req: req as unknown as Parameters<typeof getToken>[0]["req"], secret });
  if (!token || token.sub == null) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  const perms = tokenPermissions(token);
  if (!required.some((r) => perms.includes(r))) {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }
  return null;
}

/** @deprecated Используйте assertPermission(req, 'panel.access'). */
export async function assertAdminApi(req: Request): Promise<NextResponse | null> {
  return assertPermission(req, "panel.access");
}
