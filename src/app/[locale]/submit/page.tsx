import { CheckCircle } from "lucide-react";
import { SubmitStoryForm } from "@/components/submit/SubmitStoryForm";
import { getTranslations } from "next-intl/server";
import { Link } from "@/navigation";

export default async function SubmitPage({ searchParams }: { searchParams: { success?: string } }) {
  const t = await getTranslations("Submit");

  if (searchParams.success) {
    return (
      <div className="max-w-2xl mx-auto w-full py-20 text-center">
        <div className="bg-green-100 text-green-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-bold mb-4">{t("successTitle")}</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          {t("successDesc")}
        </p>
        <Link href="/" className="bg-blue-600 text-white px-6 py-3 rounded-md font-bold hover:bg-blue-700 transition">
          {t("backHome")}
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto w-full py-12">
      <h1 className="text-3xl font-bold mb-4">{t("title")}</h1>
      <p className="text-gray-600 dark:text-gray-400 mb-8">
        {t("desc")}
      </p>
      
      <SubmitStoryForm className="bg-white dark:bg-neutral-900 p-8 rounded-xl border shadow-sm space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2">{t("titleLabel")}</label>
          <input type="text" name="title" required className="w-full border rounded-md px-4 py-2 bg-gray-50 dark:bg-neutral-800" placeholder={t("titlePlaceholder")} />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">{t("storyLabel")}</label>
          <textarea name="content" required rows={6} className="w-full border rounded-md px-4 py-2 bg-gray-50 dark:bg-neutral-800" placeholder={t("storyPlaceholder")}></textarea>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">{t("linksLabel")}</label>
          <input type="text" name="sources" className="w-full border rounded-md px-4 py-2 bg-gray-50 dark:bg-neutral-800" placeholder="https://..." />
        </div>

        <div className="flex items-center gap-2">
          <input type="checkbox" name="is_anonymous" id="anon" defaultChecked className="rounded" />
          <label htmlFor="anon" className="text-sm">{t("anonLabel")}</label>
        </div>

        <button type="submit" className="w-full bg-blue-600 text-white px-4 py-3 rounded-md font-bold hover:bg-blue-700 transition">
          {t("send")}
        </button>
      </SubmitStoryForm>
    </div>
  );
}