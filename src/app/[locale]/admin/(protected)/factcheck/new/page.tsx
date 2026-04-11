import { AdminFactcheckAjaxForm } from "@/components/admin/AdminFactcheckAjaxForm";
import { requireStaffPermission } from "@/lib/adminPageAuth";
import { getTranslations } from "next-intl/server";

export default async function AdminFactNew() {
  await requireStaffPermission("content.factcheck.create");
  const t = await getTranslations("Admin");

  return (
    <div className="max-w-3xl mx-auto w-full py-12 px-4">
      <h1 className="text-2xl font-bold mb-6">{t("createFact")}</h1>
      <AdminFactcheckAjaxForm mode="create" className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Claim</label>
          <input name="claim" className="w-full border rounded-md px-3 py-2 bg-gray-50 dark:bg-neutral-800" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Truth</label>
          <textarea name="truth" rows={6} className="w-full border rounded-md px-3 py-2 bg-gray-50 dark:bg-neutral-800" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Sources (comma separated)</label>
          <input name="sources" className="w-full border rounded-md px-3 py-2 bg-gray-50 dark:bg-neutral-800" />
        </div>
        <div>
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-md">{t("create")}</button>
        </div>
      </AdminFactcheckAjaxForm>
    </div>
  );
}
