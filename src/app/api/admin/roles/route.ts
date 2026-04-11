import { NextResponse } from "next/server";
import { assertPermission } from "@/lib/adminAuthUtils";
import { PERMISSION_KEYS } from "@/lib/permissions";
import {
  listRolesWithPermissions,
  getRoleById,
  setRolePermissions,
  setRoleAllPermissions,
  clearRolePermissions,
  createRole,
  deleteRoleIfEmpty,
} from "@/lib/rbacQueries";

function normalizeKeys(keys: string[]): string[] {
  const valid = new Set<string>(PERMISSION_KEYS as unknown as string[]);
  const u = [...new Set(keys)].filter((k) => valid.has(k));
  if (u.length > 0 && !u.includes("panel.access")) {
    u.push("panel.access");
  }
  return [...u].sort();
}

export async function GET(req: Request) {
  const denied = await assertPermission(req, "roles.read");
  if (denied) return denied;
  try {
    const roles = await listRolesWithPermissions();
    return NextResponse.json({ ok: true, roles, permissionCatalog: [...PERMISSION_KEYS] });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
    if (!body?.action) {
      return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
    }

    const action = String(body.action);

    if (action === "update_permissions") {
      const denied = await assertPermission(req, "roles.update");
      if (denied) return denied;
      const roleId = Number(body.role_id);
      if (!Number.isFinite(roleId) || roleId < 1) {
        return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
      }
      const role = await getRoleById(roleId);
      if (!role) {
        return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
      }
      if (role.slug === "admin") {
        await setRoleAllPermissions(roleId);
      } else if (role.slug === "user") {
        await clearRolePermissions(roleId);
      } else {
        const keys = Array.isArray(body.permission_keys) ? (body.permission_keys as unknown[]).map(String) : [];
        await setRolePermissions(roleId, normalizeKeys(keys));
      }
      return NextResponse.json({ ok: true });
    }

    if (action === "create") {
      const denied = await assertPermission(req, "roles.create");
      if (denied) return denied;
      const slug = String(body.slug ?? "")
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9_-]/g, "");
      if (!/^[a-z0-9_-]{2,32}$/.test(slug)) {
        return NextResponse.json({ ok: false, error: "invalid_slug" }, { status: 400 });
      }
      const name = String(body.name ?? "").trim();
      if (name.length < 1) {
        return NextResponse.json({ ok: false, error: "invalid_name" }, { status: 400 });
      }
      try {
        const id = await createRole(slug, name);
        return NextResponse.json({ ok: true, id });
      } catch {
        return NextResponse.json({ ok: false, error: "slug_taken" }, { status: 400 });
      }
    }

    if (action === "delete") {
      const denied = await assertPermission(req, "roles.delete");
      if (denied) return denied;
      const roleId = Number(body.role_id);
      if (!Number.isFinite(roleId) || roleId < 1) {
        return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
      }
      const ok = await deleteRoleIfEmpty(roleId);
      if (!ok) {
        return NextResponse.json({ ok: false, error: "delete_forbidden" }, { status: 400 });
      }
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: false, error: "unknown_action" }, { status: 400 });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
