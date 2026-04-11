import { query } from "@/lib/db";
import { redirect } from "@/navigation";
import { getLocale } from "next-intl/server";
import { Link } from "@/navigation";
import { ArrowLeft } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { FileUploadButton } from "@/components/FileUploadButton";
import { ForumCreateTopicForm } from "@/components/forum/ForumCreateTopicForm";
import { getSession } from "@/lib/auth";

type ForumCategoryRow = { id: number; name: string };

export default async function NewTopicPage() {
  const t = await getTranslations("Forum");
  const userSession = await getSession();

  if (!userSession) {
    const locale = await getLocale();
    redirect({ href: "/forum/login", locale: locale as any });
  }

  const categoriesResult = await query('SELECT * FROM forum_categories ORDER BY id');
  const categories = categoriesResult.rows as ForumCategoryRow[];

  return (
    <div className="max-w-3xl mx-auto w-full py-4 sm:py-8 px-4 sm:px-0">
      <Link href="/forum" className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4 sm:mb-6 font-medium">
        <ArrowLeft className="w-4 h-4 mr-2" />
        {t("backToTopics")}
      </Link>
      <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6">{t("newTopicTitle")}</h1>
      
      <ForumCreateTopicForm className="bg-white dark:bg-neutral-900 p-4 sm:p-8 rounded-xl border shadow-sm space-y-4 sm:space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2">{t("categoryLabel")}</label>
          <select name="category_id" required className="w-full border rounded-md px-4 py-2 bg-gray-50 dark:bg-neutral-800">
            <option value="">{t("categoryPlaceholder")}</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">{t("topicTitleLabel")}</label>
          <input type="text" name="title" required className="w-full border rounded-md px-4 py-2 bg-gray-50 dark:bg-neutral-800" placeholder={t("topicTitlePlaceholder")} />
        </div>
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-medium">{t("messageLabel")}</label>
            <FileUploadButton targetId="topic-content" />
          </div>
            <textarea id="topic-content" name="content" rows={6} required className="w-full border rounded-md px-4 py-2 bg-gray-50 dark:bg-neutral-800" placeholder={t("messagePlaceholder") + t("markdownSupported")}></textarea>
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">{t("newTopicTagsLabel")}</label>
          <input type="text" name="tags" className="w-full border rounded-md px-4 py-2 bg-gray-50 dark:bg-neutral-800" placeholder={t("newTopicTagsPlaceholder")} />
        </div>
        
        <div className="border-t dark:border-neutral-800 pt-6">
          <h3 className="text-lg font-bold mb-4">{t("newTopicPollSection")}</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">{t("newTopicPollQuestion")}</label>
              <input type="text" name="poll_question" className="w-full border rounded-md px-4 py-2 bg-gray-50 dark:bg-neutral-800" placeholder={t("newTopicPollQuestionPlaceholder")} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">{t("newTopicPollOptions")}</label>
              <textarea name="poll_options" rows={4} className="w-full border rounded-md px-4 py-2 bg-gray-50 dark:bg-neutral-800" placeholder={t("newTopicPollOptionsPlaceholder")}></textarea>
            </div>
          </div>
        </div>

        <button type="submit" className="w-full bg-blue-600 text-white px-4 py-3 rounded-md font-bold hover:bg-blue-700 transition">
          {t("publishTopic")}
        </button>
      </ForumCreateTopicForm>
    </div>
  );
}