import { AdminRoleCreateForm } from "@/components/admin/AdminRoleCreateForm";
import { requireStaffPermission } from "@/lib/adminPageAuth";
import { getTranslations } from "next-intl/server";
import { Link } from "@/navigation";

export default async function AdminRolesNewPage() {
  await requireStaffPermission("roles.create");
  const t = await getTranslations("Admin");

  return (
    <div className="max-w-lg mx-auto w-full py-12 px-4">
      <div className="flex items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold">{t("adminRolesCreate")}</h1>
        <Link href="/admin/roles" className="text-sm text-blue-600 font-medium">
          ← {t("adminRolesTitle")}
        </Link>
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">{t("adminRolesCreateHint")}</p>
      <AdminRoleCreateForm />
    </div>
  );
}
