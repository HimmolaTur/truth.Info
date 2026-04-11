import bcrypt from "bcryptjs";
import { query } from "@/lib/db";
import { isPresetAvatarUrl } from "@/lib/forumAvatars";
import { countUsersWithPermission, roleHasPermission } from "@/lib/rbacQueries";

export type AdminUserUpdateInput = {
  role_id: number;
  avatar_url: string | null;
  new_password?: string | null;
};

export async function adminApplyUserUpdate(
  targetId: number,
  input: AdminUserUpdateInput
): Promise<{ ok: true } | { ok: false; code: string }> {
  const roleCheck = await query(`SELECT id FROM roles WHERE id = $1`, [input.role_id]);
  if (roleCheck.rows.length === 0) {
    return { ok: false, code: "invalid_role" };
  }

  const existing = await query(`SELECT id, role_id FROM users WHERE id = $1`, [targetId]);
  if (existing.rows.length === 0) {
    return { ok: false, code: "not_found" };
  }

  const oldRoleId = Number((existing.rows[0] as { role_id: number }).role_id);

  const oldHasRolesManage = await roleHasPermission(oldRoleId, "roles.update");
  const newHasRolesManage = await roleHasPermission(input.role_id, "roles.update");
  if (oldHasRolesManage && !newHasRolesManage) {
    const n = await countUsersWithPermission("roles.update");
    if (n <= 1) {
      return { ok: false, code: "last_roles_manager" };
    }
  }

  const avatar =
    input.avatar_url != null && String(input.avatar_url).trim() !== ""
      ? String(input.avatar_url).trim()
      : null;

  if (avatar != null && !isPresetAvatarUrl(avatar)) {
    return { ok: false, code: "invalid_avatar" };
  }

  const pw = input.new_password != null ? String(input.new_password) : "";
  if (pw.length > 0 && pw.length < 6) {
    return { ok: false, code: "password_short" };
  }

  await query(
    `UPDATE users u SET
       avatar_url = $1,
       role_id = $2,
       role = (SELECT slug FROM roles WHERE id = $2)
     WHERE u.id = $3`,
    [avatar, input.role_id, targetId]
  );

  if (pw.length > 0) {
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(pw, salt);
    await query(`UPDATE users SET password_hash = $1 WHERE id = $2`, [password_hash, targetId]);
  }

  return { ok: true };
}
