import { AdminNewsAjaxForm } from "@/components/admin/AdminNewsAjaxForm";
import { requireStaffPermission } from "@/lib/adminPageAuth";
import { getTranslations } from "next-intl/server";

export default async function AdminNewsNew() {
  await requireStaffPermission("content.news.create");
  const t = await getTranslations("Admin");

  return (
    <div className="max-w-3xl mx-auto w-full py-12 px-4">
      <h1 className="text-2xl font-bold mb-6">{t("createNews")}</h1>

      <AdminNewsAjaxForm mode="create" className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">{t("newsTitle")}</label>
          <input name="title" required className="w-full border rounded-md px-3 py-2 bg-gray-50 dark:bg-neutral-800" />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">{t("content")}</label>
          <textarea name="content" rows={8} className="w-full border rounded-md px-3 py-2 bg-gray-50 dark:bg-neutral-800" />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">{t("imageUrl")}</label>
          <input
            name="image_url"
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

        <div>
          <label className="block text-sm font-medium mb-1">{t("newsCategory")}</label>
          <input
            name="category"
            defaultValue="Общее"
            className="w-full border rounded-md px-3 py-2 bg-gray-50 dark:bg-neutral-800"
          />
          <p className="text-xs text-gray-500 mt-1">{t("newsCategoryHint")}</p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">{t("newsTags")}</label>
          <input
            name="tags"
            placeholder={t("newsTagsPlaceholder")}
            className="w-full border rounded-md px-3 py-2 bg-gray-50 dark:bg-neutral-800"
          />
          <p className="text-xs text-gray-500 mt-1">{t("newsTagsHint")}</p>
        </div>

        <div className="flex items-center gap-2">
          <input type="checkbox" id="is_important" name="is_important" className="rounded border-gray-300" />
          <label htmlFor="is_important" className="text-sm font-medium">
            {t("newsImportant")}
          </label>
        </div>

        <div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="is_featured" name="is_featured" className="rounded border-gray-300" />
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
            className="w-full border rounded-md px-3 py-2 bg-gray-50 dark:bg-neutral-800"
          />
          <p className="text-xs text-gray-500 mt-1">{t("newsPublishedAtHint")}</p>
        </div>

        <div>
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-md">
            {t("create")}
          </button>
        </div>
      </AdminNewsAjaxForm>
    </div>
  );
}
