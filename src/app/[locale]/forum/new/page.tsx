import { query } from "@/lib/db";
import { redirect } from "@/navigation";
import { getLocale } from "next-intl/server";
import { revalidatePath } from "next/cache";
import { Link } from "@/navigation";
import { ArrowLeft } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { cookies } from "next/headers";
import { FileUploadButton } from "@/components/FileUploadButton";
import { slugify } from "@/lib/utils";
import { getSession } from "@/lib/auth";

type ForumCategoryRow = { id: number; name: string };

export default async function NewTopicPage() {
  const t = await getTranslations("Forum");
  const userSession = await getSession();

  if (!userSession) {
    redirect("/forum/login");
  }

  const categoriesResult = await query('SELECT * FROM forum_categories ORDER BY id');
  const categories = categoriesResult.rows as ForumCategoryRow[];

  async function createTopic(formData: FormData) {
    "use server";
    const tForm = await getTranslations("Forum");
    const title = formData.get("title") as string;
    const content = formData.get("content") as string;
    const category_id = formData.get("category_id") as string;
    const tagsStr = formData.get("tags") as string;
    const tags = tagsStr ? tagsStr.split(',').map(t => t.trim()).filter(Boolean) : [];
    
    const pollQuestion = formData.get("poll_question") as string;
    const pollOptionsStr = formData.get("poll_options") as string;
    const pollOptions = pollOptionsStr ? pollOptionsStr.split('\n').map(o => o.trim()).filter(Boolean) : [];
    
    const cookieStore = cookies();
    const author_session_id = cookieStore.get('anon_session')?.value || null;

    const session = await getSession();
    if (!session) return;

    if (!title || !content || !category_id) return;

    const result = await query(
      'INSERT INTO forum_topics (category_id, title, content, author_name, tags, author_session_id, user_id) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id',
      [category_id, title, content, session.username, tags, author_session_id, session.id]
    );
    
    const newTopicId = result.rows[0].id;

    if (pollQuestion && pollOptions.length >= 2) {
      const pollRes = await query(
        'INSERT INTO forum_polls (topic_id, question) VALUES ($1, $2) RETURNING id',
        [newTopicId, pollQuestion]
      );
      const pollId = pollRes.rows[0].id;
      
      for (const option of pollOptions) {
        await query(
          'INSERT INTO forum_poll_options (poll_id, text) VALUES ($1, $2)',
          [pollId, option]
        );
      }
    }

    const locale = await getLocale();
    revalidatePath("/forum");
    redirect({ href: `/forum/${newTopicId}-${slugify(title)}`, locale: locale as any });
  }

  return (
    <div className="max-w-3xl mx-auto w-full py-4 sm:py-8 px-4 sm:px-0">
      <Link href="/forum" className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4 sm:mb-6 font-medium">
        <ArrowLeft className="w-4 h-4 mr-2" />
        {t("backToTopics")}
      </Link>
      <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6">{t("newTopicTitle")}</h1>
      
      <form action={createTopic} className="bg-white dark:bg-neutral-900 p-4 sm:p-8 rounded-xl border shadow-sm space-y-4 sm:space-y-6">
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
          <textarea id="topic-content" name="content" rows={6} required className="w-full border rounded-md px-4 py-2 bg-gray-50 dark:bg-neutral-800" placeholder={t("messagePlaceholder") + " (Поддерживается Markdown)"}></textarea>
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Теги (через запятую)</label>
          <input type="text" name="tags" className="w-full border rounded-md px-4 py-2 bg-gray-50 dark:bg-neutral-800" placeholder="новости, обсуждение, вопрос" />
        </div>
        
        <div className="border-t dark:border-neutral-800 pt-6">
          <h3 className="text-lg font-bold mb-4">Добавить опрос (необязательно)</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Вопрос</label>
              <input type="text" name="poll_question" className="w-full border rounded-md px-4 py-2 bg-gray-50 dark:bg-neutral-800" placeholder="Например: Какой фреймворк лучше?" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Варианты ответов (каждый с новой строки)</label>
              <textarea name="poll_options" rows={4} className="w-full border rounded-md px-4 py-2 bg-gray-50 dark:bg-neutral-800" placeholder="React&#10;Vue&#10;Angular"></textarea>
            </div>
          </div>
        </div>

        <button type="submit" className="w-full bg-blue-600 text-white px-4 py-3 rounded-md font-bold hover:bg-blue-700 transition">
          {t("publishTopic")}
        </button>
      </form>
    </div>
  );
}