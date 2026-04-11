import { ArrowLeft } from "lucide-react";
import { Link } from "@/navigation";
import { ForumEditTopicForm } from "@/components/forum/ForumEditTopicForm";
import { query } from "@/lib/db";
import { redirect, notFound } from "next/navigation";
import { getLocale } from "next-intl/server";
import { cookies } from "next/headers";
import { slugify } from "@/lib/utils";
import { getTranslations } from "next-intl/server";

export default async function EditForumThreadPage({ params }: { params: { id: string } }) {
  const locale = await getLocale();
  const t = await getTranslations("Forum");
  const topicId = parseInt(params.id, 10);
  
  if (isNaN(topicId)) {
    notFound();
  }

  const cookieStore = cookies();
  const currentSessionId = cookieStore.get('anon_session')?.value;

  const topicResult = await query('SELECT * FROM forum_topics WHERE id = $1', [topicId]);

  if (topicResult.rows.length === 0) {
    notFound();
  }

  const topic = topicResult.rows[0];

  // Проверка прав на редактирование
  if (!currentSessionId || topic.author_session_id !== currentSessionId) {
    redirect(`/${locale}/forum/${topicId}-${slugify(topic.title)}`);
  }

  return (
    <div className="max-w-3xl mx-auto w-full py-4 sm:py-8 px-4 sm:px-0">
      <Link href={`/forum/${topicId}-${slugify(topic.title)}`} className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4 sm:mb-6 font-medium">
        <ArrowLeft className="w-4 h-4 mr-2" />
        {t("editTopicBack")}
      </Link>

      <div className="bg-white dark:bg-neutral-900 rounded-xl border shadow-sm p-4 sm:p-8">
        <h1 className="text-2xl sm:text-3xl font-extrabold mb-6 sm:mb-8">{t("editTopicTitle")}</h1>
        
        <ForumEditTopicForm topicId={topicId} className="space-y-4 sm:space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">{t("editTopicHeading")}</label>
            <input 
              type="text" 
              name="title" 
              required
              defaultValue={topic.title}
              className="w-full border rounded-md px-4 py-2 bg-gray-50 dark:bg-neutral-800 focus:ring-2 focus:ring-blue-500 outline-none" 
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">{t("editTopicContent")}</label>
            <textarea 
              name="content" 
              required
              rows={8} 
              defaultValue={topic.content}
              className="w-full border rounded-md px-4 py-3 bg-gray-50 dark:bg-neutral-800 focus:ring-2 focus:ring-blue-500 outline-none" 
            ></textarea>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">{t("editTopicTags")}</label>
            <input 
              type="text" 
              name="tags" 
              defaultValue={topic.tags ? topic.tags.join(', ') : ''}
              className="w-full border rounded-md px-4 py-2 bg-gray-50 dark:bg-neutral-800 focus:ring-2 focus:ring-blue-500 outline-none" 
            />
          </div>
          
          <button type="submit" className="w-full bg-blue-600 text-white px-4 py-3 rounded-md font-bold hover:bg-blue-700 transition">
            {t("editTopicSave")}
          </button>
        </ForumEditTopicForm>
      </div>
    </div>
  );
}