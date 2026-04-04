import { ArrowLeft } from "lucide-react";
import { Link } from "@/navigation";
import { query } from "@/lib/db";
import { redirect, notFound } from "next/navigation";
import { getTranslations, getLocale } from "next-intl/server";
import { cookies } from "next/headers";
import { slugify } from "@/lib/utils";

export default async function EditForumThreadPage({ params }: { params: { id: string } }) {
  const t = await getTranslations("Forum");
  const locale = await getLocale();
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

  async function editTopic(formData: FormData) {
    "use server";
    const title = formData.get("title") as string;
    const content = formData.get("content") as string;
    const tagsStr = formData.get("tags") as string;
    const tags = tagsStr ? tagsStr.split(',').map(t => t.trim()).filter(Boolean) : [];
    
    const cookieStore = cookies();
    const sessionId = cookieStore.get('anon_session')?.value;

    if (!title || !content || !sessionId) return;
    
    // Повторная проверка прав перед сохранением
    const checkRes = await query('SELECT author_session_id FROM forum_topics WHERE id = $1', [topicId]);
    if (checkRes.rows.length === 0 || checkRes.rows[0].author_session_id !== sessionId) return;

    await query(
      'UPDATE forum_topics SET title = $1, content = $2, tags = $3 WHERE id = $4',
      [title, content, tags, topicId]
    );

    redirect(`/${locale}/forum/${topicId}-${slugify(title)}`);
  }

  return (
    <div className="max-w-3xl mx-auto w-full py-4 sm:py-8 px-4 sm:px-0">
      <Link href={`/forum/${topicId}-${slugify(topic.title)}`} className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4 sm:mb-6 font-medium">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Назад к теме
      </Link>

      <div className="bg-white dark:bg-neutral-900 rounded-xl border shadow-sm p-4 sm:p-8">
        <h1 className="text-2xl sm:text-3xl font-extrabold mb-6 sm:mb-8">Редактировать тему</h1>
        
        <form action={editTopic} className="space-y-4 sm:space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">Заголовок</label>
            <input 
              type="text" 
              name="title" 
              required
              defaultValue={topic.title}
              className="w-full border rounded-md px-4 py-2 bg-gray-50 dark:bg-neutral-800 focus:ring-2 focus:ring-blue-500 outline-none" 
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Содержание</label>
            <textarea 
              name="content" 
              required
              rows={8} 
              defaultValue={topic.content}
              className="w-full border rounded-md px-4 py-3 bg-gray-50 dark:bg-neutral-800 focus:ring-2 focus:ring-blue-500 outline-none" 
            ></textarea>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Теги (через запятую)</label>
            <input 
              type="text" 
              name="tags" 
              defaultValue={topic.tags ? topic.tags.join(', ') : ''}
              className="w-full border rounded-md px-4 py-2 bg-gray-50 dark:bg-neutral-800 focus:ring-2 focus:ring-blue-500 outline-none" 
            />
          </div>
          
          <button type="submit" className="w-full bg-blue-600 text-white px-4 py-3 rounded-md font-bold hover:bg-blue-700 transition">
            Сохранить изменения
          </button>
        </form>
      </div>
    </div>
  );
}