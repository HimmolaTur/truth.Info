import { AdminUserEditForm } from "@/components/admin/AdminUserEditForm";
import { requireStaffPermission } from "@/lib/adminPageAuth";
import { getTranslations } from "next-intl/server";
import { query } from "@/lib/db";
import { Link } from "@/navigation";
import Image from "next/image";

export default async function AdminUserEditPage({ params }: { params: { id: string } }) {
  await requireStaffPermission("users.update");

  const t = await getTranslations("Admin");
  const idNum = parseInt(params.id, 10);
  if (!Number.isFinite(idNum) || idNum < 1) {
    return <div className="p-8">Not found</div>;
  }

  const result = await query(
    `SELECT u.id, u.display_name, u.avatar_url, u.role_id
     FROM users u
     WHERE u.id = $1`,
    [idNum]
  );
  const row = result.rows[0] as
    | {
        id: number;
        display_name: string;
        avatar_url: string | null;
        role_id: number;
      }
    | undefined;

  if (!row) {
    return <div className="p-8">Not found</div>;
  }

  const rolesRes = await query(`SELECT id, slug, name FROM roles ORDER BY id ASC`);
  const roles = rolesRes.rows as { id: number; slug: string; name: string }[];

  const avatarSrc = row.avatar_url?.trim() || "/avatars/avatar1.svg";

  return (
    <div className="max-w-3xl mx-auto w-full py-12 px-4">
      <div className="flex items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold">{t("adminUserEditTitle")}</h1>
        <Link href="/admin/users" className="text-sm text-blue-600 font-medium hover:underline">
          ← {t("adminUsersTitle")}
        </Link>
      </div>

      <p className="text-xs text-amber-800 dark:text-amber-200 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 rounded-md px-3 py-2 mb-6">
        {t("adminUserLoginHidden")}
      </p>

      <div className="flex items-center gap-4 mb-6 p-4 rounded-xl border bg-white dark:bg-neutral-900 shadow-sm">
        <div className="relative w-16 h-16 shrink-0 rounded-full overflow-hidden bg-gray-100 dark:bg-neutral-800 border">
          <Image
            src={avatarSrc}
            alt=""
            fill
            sizes="64px"
            className="object-cover"
            unoptimized={/^https?:\/\//i.test(avatarSrc)}
          />
        </div>
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">{t("adminUserInternalId")}</p>
          <p className="text-lg font-semibold font-mono">{row.id}</p>
        </div>
      </div>

      <AdminUserEditForm
        userId={row.id}
        displayNameReadonly={String(row.display_name ?? "")}
        defaultAvatarUrl={row.avatar_url?.trim() ?? ""}
        roles={roles}
        defaultRoleId={row.role_id}
      />
    </div>
  );
}
