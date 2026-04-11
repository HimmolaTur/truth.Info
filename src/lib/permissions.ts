/** Все ключи прав в БД (порядок — в UI и в setRoleAllPermissions). */
export const PERMISSION_KEYS = [
  "panel.access",
  "content.news.read",
  "content.news.create",
  "content.news.update",
  "content.news.delete",
  "content.factcheck.read",
  "content.factcheck.create",
  "content.factcheck.update",
  "content.factcheck.delete",
  "forum.moderate.read",
  "forum.moderate.delete_post",
  "forum.moderate.delete_topic",
  "forum.moderate.pin_topic",
  "forum.moderate.unpin_topic",
  "forum.moderate.close_topic",
  "forum.moderate.open_topic",
  "reports.read",
  "users.read",
  "users.update",
  "roles.read",
  "roles.create",
  "roles.update",
  "roles.delete",
] as const;

export type PermissionKey = (typeof PERMISSION_KEYS)[number];

export function isPermissionKey(s: string): s is PermissionKey {
  return (PERMISSION_KEYS as readonly string[]).includes(s);
}

/** Есть ли хотя бы одно право с префиксом `section.` (например content.news). */
export function hasPermissionPrefix(perms: string[], sectionPrefix: string): boolean {
  const p = sectionPrefix.endsWith(".") ? sectionPrefix.slice(0, -1) : sectionPrefix;
  return perms.some((x) => x === p || x.startsWith(`${p}.`));
}
