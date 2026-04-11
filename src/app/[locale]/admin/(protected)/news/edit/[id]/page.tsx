import { getTranslations } from "next-intl/server";
import { getStaffPermissions, requireStaffPermission } from "@/lib/adminPageAuth";
import { AdminNewsAjaxForm } from "@/components/admin/AdminNewsAjaxForm";
import { AdminNewsDeleteButton } from "@/components/admin/AdminNewsDeleteButton";
import { query } from "@/lib/db";
import {
  formatNewsDatetimeLocalInput,
  newsTagsToInputValue,
} from "@/lib/newsAdmin";

export default async function AdminNewsEdit({ params }: { params: { id: string } }) {
  await requireStaffPermission("content.news.update");
  const staffPerms = await getStaffPermissions();
  const canDelete = staffPerms.includes("content.news.delete");
  const t = await getTranslations("Admin");
  const result = await query("SELECT * FROM news WHERE id = $1", [params.id]);
  const item = result.rows[0] as Record<string, unknown> | undefined;

  if (!item) {
    return <div className="p-8">Not found</div>;
  }

  const imageUrl =
    (typeof item.image_url === "string" && item.image_url) ||
    (typeof item.image === "string" && item.image) ||
    "";

  return (
    <div className="max-w-3xl mx-auto w-full py-12 px-4">
      <h1 className="text-2xl font-bold mb-6">{t("editNews")}</h1>

      <AdminNewsAjaxForm mode="update" newsId={String(item.id)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">{t("newsTitle")}</label>
          <input
            name="title"
            required
            defaultValue={String(item.title ?? "")}
            className="w-full border rounded-md px-3 py-2 bg-gray-50 dark:bg-neutral-800"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">{t("content")}</label>
          <textarea
            name="content"
            rows={8}
            defaultValue={String(item.content ?? "")}
            className="w-full border rounded-md px-3 py-2 bg-gray-50 dark:bg-neutral-800"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">{t("imageUrl")}</label>
          <input
            name="image_url"
            defaultValue={imageUrl}
            placeholder="https://…"
            className="w-full border rounded-md px-3 py-2 bg-gray-50 dark:bg-neutral-800"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">{t("newsImageFile")}</label>
          <input
            type="file"
            name="image_file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            className="block w-full text-sm text-gray-600 dark:text-gray-300 file:mr-3 file:py-2 file:px-3 file:rounded-md file:border-0 file:bg-blue-600 file:text-white file:text-sm file:font-medium"
          />
          <p className="text-xs text-gray-500 mt-1">{t("newsImageFileHint")}</p>
        </div>

        {imageUrl ? (
          <div className="rounded-md border border-gray-200 dark:border-neutral-700 overflow-hidden max-w-md">
            <img src={imageUrl} alt="" className="w-full h-auto max-h-48 object-cover" />
          </div>
        ) : null}

        <div>
          <label className="block text-sm font-medium mb-1">{t("newsCategory")}</label>
          <input
            name="category"
            defaultValue={String(item.category ?? "Общее")}
            className="w-full border rounded-md px-3 py-2 bg-gray-50 dark:bg-neutral-800"
          />
          <p className="text-xs text-gray-500 mt-1">{t("newsCategoryHint")}</p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">{t("newsTags")}</label>
          <input
            name="tags"
            defaultValue={newsTagsToInputValue(item.tags)}
            placeholder={t("newsTagsPlaceholder")}
            className="w-full border rounded-md px-3 py-2 bg-gray-50 dark:bg-neutral-800"
          />
          <p className="text-xs text-gray-500 mt-1">{t("newsTagsHint")}</p>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="is_important"
            name="is_important"
            defaultChecked={Boolean(item.is_important)}
            className="rounded border-gray-300"
          />
          <label htmlFor="is_important" className="text-sm font-medium">
            {t("newsImportant")}
          </label>
        </div>

        <div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_featured"
              name="is_featured"
              defaultChecked={Boolean(item.is_featured)}
              className="rounded border-gray-300"
            />
            <label htmlFor="is_featured" className="text-sm font-medium">
              {t("newsFeatured")}
            </label>
          </div>
          <p className="text-xs text-gray-500 mt-1 ml-6">{t("newsFeaturedHint")}</p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">{t("newsPublishedAt")}</label>
          <input
            type="datetime-local"
            name="created_at"
            defaultValue={formatNewsDatetimeLocalInput(item.created_at)}
            className="w-full border rounded-md px-3 py-2 bg-gray-50 dark:bg-neutral-800"
          />
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-md">
            {t("save")}
          </button>
          {canDelete ? <AdminNewsDeleteButton newsId={Number(item.id)} /> : null}
        </div>
      </AdminNewsAjaxForm>
    </div>
  );
}
