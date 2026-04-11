import { getStaffPermissions, requireStaffPermission } from "@/lib/adminPageAuth";
import { listRolesWithPermissions } from "@/lib/rbacQueries";
import { getTranslations } from "next-intl/server";
import { Link } from "@/navigation";

export const dynamic = "force-dynamic";

export default async function AdminRolesPage() {
  await requireStaffPermission("roles.read");

  const staffPerms = await getStaffPermissions();
  const canCreate = staffPerms.includes("roles.create");
  const canUpdate = staffPerms.includes("roles.update");
  const t = await getTranslations("Admin");
  let roles: Awaited<ReturnType<typeof listRolesWithPermissions>> = [];
  let err: string | null = null;
  try {
    roles = await listRolesWithPermissions();
  } catch (e) {
    err = e instanceof Error ? e.message : String(e);
  }

  return (
    <div className="max-w-5xl mx-auto w-full py-12 px-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold">{t("adminRolesTitle")}</h1>
        <div className="flex gap-3">
          {canCreate ? (
            <Link href="/admin/roles/new" className="inline-flex bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium">
              {t("adminRolesCreate")}
            </Link>
          ) : null}
          <Link href="/admin" className="text-sm text-blue-600 font-medium self-center">
            ← {t("title")}
          </Link>
        </div>
      </div>

      <p className="text-gray-600 dark:text-gray-400 mb-6 text-sm">{t("adminRolesDesc")}</p>

      {err ? (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{err}</div>
      ) : null}

      <div className="space-y-3">
        {roles.map((r) => (
          <div
            key={r.id}
            className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 rounded-xl border bg-white dark:bg-neutral-900 shadow-sm"
          >
            <div>
              <p className="font-bold text-lg">
                {r.name}{" "}
                <span className="text-sm font-mono font-normal text-gray-500">({r.slug})</span>
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {t("adminRolesUserCount")}: {r.user_count} · {t("adminRolesPermCount")}: {r.permissions.length}
              </p>
            </div>
            {canUpdate ? (
              <Link href={`/admin/roles/edit/${r.id}`} className="text-sm text-blue-600 font-medium shrink-0">
                {t("edit")}
              </Link>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
