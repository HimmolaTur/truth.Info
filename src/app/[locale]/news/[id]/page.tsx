import { query } from "@/lib/db";
import { notFound } from "next/navigation";
import { Link } from "@/navigation";
import { ArrowLeft } from "lucide-react";
import { getTranslations } from "next-intl/server";

export default async function NewsArticlePage({ params }: { params: { id: string } }) {
  const t = await getTranslations("News");
  const result = await query('SELECT * FROM news WHERE id = $1', [params.id]);
  
  if (result.rows.length === 0) {
    notFound();
  }
  
  const article = result.rows[0];

  return (
    <div className="max-w-3xl mx-auto w-full py-8">
      <Link href="/news" className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-6 font-medium">
        <ArrowLeft className="w-4 h-4 mr-2" />
        {t("backToNews")}
      </Link>
      
      <article className="bg-white dark:bg-neutral-900 p-8 rounded-xl border shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <div className="text-sm text-gray-500 font-medium">
            {new Date(article.created_at).toLocaleDateString('ru-RU')} • <span className="text-blue-600 bg-blue-50 dark:bg-blue-900/30 px-3 py-1 rounded-full uppercase tracking-wider">{article.category}</span>
          </div>
          {article.is_important && (
            <span className="bg-red-600 text-white text-xs px-3 py-1 rounded-full font-bold shadow-sm uppercase tracking-wider">{t("important")}</span>
          )}
        </div>
        
        <h1 className="text-4xl md:text-5xl font-extrabold mb-8 leading-tight">{article.title}</h1>
        
        <div className="w-full h-64 md:h-96 rounded-2xl overflow-hidden mb-10 shadow-lg">
          <img 
            src={article.image_url || '/images/photo-1504711434969-e33886168f5c.svg'} 
            alt={article.title}
            className="w-full h-full object-cover"
          />
        </div>

        <div className="prose dark:prose-invert max-w-none text-gray-800 dark:text-gray-200 whitespace-pre-wrap mb-12 text-xl leading-relaxed">
          {article.content}
        </div>
        
        {article.tags && article.tags.length > 0 && (
          <div className="pt-6 border-t dark:border-neutral-800">
            <div className="text-sm text-gray-500 mb-2">{t("tags")}</div>
            <div className="flex flex-wrap gap-2">
              {article.tags.map((tag: string, idx: number) => (
                <span key={idx} className="bg-gray-100 dark:bg-neutral-800 text-sm px-3 py-1 rounded-full">
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </article>
    </div>
  );
}