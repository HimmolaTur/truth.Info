import { AdminFactcheckAjaxForm } from "@/components/admin/AdminFactcheckAjaxForm";
import { AdminFactcheckDeleteButton } from "@/components/admin/AdminFactcheckDeleteButton";
import { getStaffPermissions, requireStaffPermission } from "@/lib/adminPageAuth";
import { getTranslations } from "next-intl/server";
import { query } from "@/lib/db";

export default async function AdminFactEdit({ params }: { params: { id: string } }) {
  await requireStaffPermission("content.factcheck.update");
  const staffPerms = await getStaffPermissions();
  const canDelete = staffPerms.includes("content.factcheck.delete");
  const t = await getTranslations("Admin");
  const res = await query("SELECT * FROM factchecks WHERE id = $1", [params.id]);
  const item = res.rows[0];
  if (!item) return <div className="p-8">Not found</div>;

  return (
    <div className="max-w-3xl mx-auto w-full py-12 px-4">
      <h1 className="text-2xl font-bold mb-6">{t("editFact")}</h1>
      <AdminFactcheckAjaxForm mode="update" factId={String(item.id)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Claim</label>
          <input name="claim" defaultValue={item.claim} className="w-full border rounded-md px-3 py-2 bg-gray-50 dark:bg-neutral-800" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Truth</label>
          <textarea name="truth" defaultValue={item.truth} rows={6} className="w-full border rounded-md px-3 py-2 bg-gray-50 dark:bg-neutral-800" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Sources (comma separated)</label>
          <input name="sources" defaultValue={item.sources || ""} className="w-full border rounded-md px-3 py-2 bg-gray-50 dark:bg-neutral-800" />
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-md">
            {t("save")}
          </button>
          {canDelete ? <AdminFactcheckDeleteButton factId={Number(item.id)} /> : null}
        </div>
      </AdminFactcheckAjaxForm>
    </div>
  );
}

