import { getServerSession } from "next-auth";
import { getLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import authOptions from "@/lib/authOptions";

export async function getStaffPermissions(): Promise<string[]> {
  const s = await getServerSession(authOptions);
  const p = s?.user?.permissions;
  return Array.isArray(p) ? p.map(String) : [];
}

/** Доступ в раздел панели (layout) уже проверен; здесь — право на конкретный подраздел. */
export async function requireStaffPermission(permission: string) {
  const locale = await getLocale();
  const perms = await getStaffPermissions();
  if (!perms.includes(permission)) {
    redirect(`/${locale}/admin`);
  }
}
