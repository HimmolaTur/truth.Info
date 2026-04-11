import { query } from "@/lib/db";
import { PERMISSION_KEYS } from "@/lib/permissions";

export async function countUsersWithPermission(permissionKey: string): Promise<number> {
  const r = await query(
    `SELECT COUNT(*)::int AS c
     FROM users u
     WHERE EXISTS (
       SELECT 1 FROM role_permissions rp
       WHERE rp.role_id = u.role_id AND rp.permission_key = $1
     )`,
    [permissionKey]
  );
  return Number(r.rows[0]?.c ?? 0);
}

export async function roleHasPermission(roleId: number, permissionKey: string): Promise<boolean> {
  const r = await query(
    `SELECT 1 FROM role_permissions WHERE role_id = $1 AND permission_key = $2 LIMIT 1`,
    [roleId, permissionKey]
  );
  return r.rows.length > 0;
}

export type RoleRow = {
  id: number;
  slug: string;
  name: string;
  is_system: boolean;
};

export async function listRolesWithPermissions(): Promise<
  (RoleRow & { permissions: string[]; user_count: number })[]
> {
  const r = await query(`
    SELECT r.id, r.slug, r.name, r.is_system,
      COALESCE(
        (SELECT ARRAY_AGG(rp.permission_key ORDER BY rp.permission_key)
         FROM role_permissions rp WHERE rp.role_id = r.id),
        ARRAY[]::text[]
      ) AS permissions,
      (SELECT COUNT(*)::int FROM users u WHERE u.role_id = r.id) AS user_count
    FROM roles r
    ORDER BY r.id ASC
  `);
  return r.rows as (RoleRow & { permissions: string[]; user_count: number })[];
}

export async function getRoleById(
  id: number
): Promise<(RoleRow & { permissions: string[]; user_count: number }) | null> {
  const r = await query(
    `
    SELECT r.id, r.slug, r.name, r.is_system,
      COALESCE(
        (SELECT ARRAY_AGG(rp.permission_key ORDER BY rp.permission_key)
         FROM role_permissions rp WHERE rp.role_id = r.id),
        ARRAY[]::text[]
      ) AS permissions,
      (SELECT COUNT(*)::int FROM users u WHERE u.role_id = r.id) AS user_count
    FROM roles r
    WHERE r.id = $1
    `,
    [id]
  );
  if (r.rows.length === 0) return null;
  return r.rows[0] as RoleRow & { permissions: string[]; user_count: number };
}

export async function setRolePermissions(roleId: number, keys: string[]): Promise<void> {
  const valid = new Set<string>(PERMISSION_KEYS as unknown as string[]);
  const filtered = [...new Set(keys)].filter((k) => valid.has(k));
  await query(`DELETE FROM role_permissions WHERE role_id = $1`, [roleId]);
  for (const k of filtered) {
    await query(`INSERT INTO role_permissions (role_id, permission_key) VALUES ($1, $2) ON CONFLICT DO NOTHING`, [
      roleId,
      k,
    ]);
  }
}

/** Все права из справочника (для роли admin). */
export async function setRoleAllPermissions(roleId: number): Promise<void> {
  await query(`DELETE FROM role_permissions WHERE role_id = $1`, [roleId]);
  for (const k of PERMISSION_KEYS) {
    await query(`INSERT INTO role_permissions (role_id, permission_key) VALUES ($1, $2) ON CONFLICT DO NOTHING`, [
      roleId,
      k,
    ]);
  }
}

export async function clearRolePermissions(roleId: number): Promise<void> {
  await query(`DELETE FROM role_permissions WHERE role_id = $1`, [roleId]);
}

export async function createRole(slug: string, name: string): Promise<number> {
  const r = await query(
    `INSERT INTO roles (slug, name, is_system) VALUES ($1, $2, false) RETURNING id`,
    [slug, name]
  );
  return Number(r.rows[0].id);
}

export async function deleteRoleIfEmpty(roleId: number): Promise<boolean> {
  const check = await query(
    `SELECT is_system, (SELECT COUNT(*)::int FROM users WHERE role_id = $1) AS uc FROM roles WHERE id = $1`,
    [roleId]
  );
  if (check.rows.length === 0) return false;
  const row = check.rows[0] as { is_system: boolean; uc: number };
  if (row.is_system || row.uc > 0) return false;
  await query(`DELETE FROM roles WHERE id = $1`, [roleId]);
  return true;
}
