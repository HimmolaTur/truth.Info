import { AdminRolePermissionsForm } from "@/components/admin/AdminRolePermissionsForm";
import { requireStaffPermission } from "@/lib/adminPageAuth";
import { getRoleById } from "@/lib/rbacQueries";
import { getTranslations } from "next-intl/server";
import { Link } from "@/navigation";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AdminRoleEditPage({ params }: { params: { id: string } }) {
  await requireStaffPermission("roles.update");

  const t = await getTranslations("Admin");
  const idNum = parseInt(params.id, 10);
  if (!Number.isFinite(idNum) || idNum < 1) notFound();

  const role = await getRoleById(idNum);
  if (!role) notFound();

  const locked = role.slug === "admin" || role.slug === "user";

  return (
    <div className="max-w-3xl mx-auto w-full py-12 px-4">
      <div className="flex items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold">
          {t("adminRolesEditTitle")}: {role.name}
        </h1>
        <Link href="/admin/roles" className="text-sm text-blue-600 font-medium">
          ← {t("adminRolesTitle")}
        </Link>
      </div>

      <p className="text-sm text-gray-500 mb-2 font-mono">
        {role.slug} · {t("adminRolesUserCount")}: {role.user_count}
      </p>

      <h2 className="text-lg font-semibold mb-3">{t("adminRolesPermissions")}</h2>
      <AdminRolePermissionsForm
        roleId={role.id}
        slug={role.slug}
        initialKeys={role.permissions}
        locked={locked}
      />
    </div>
  );
}
