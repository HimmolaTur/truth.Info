import { query } from "@/lib/db";
import { Link } from "@/navigation";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import { getTranslations } from "next-intl/server";

const NEWS_HERO_IMAGE =
  "https://images.unsplash.com/photo-1584483766114-2cea6facdf57?q=80&w=2500&auto=format&fit=crop";

type NewsRow = {
  id: number;
  title: string;
  content: string;
  category: string | null;
  tags: string[] | null;
  is_important: boolean;
  image_url: string | null;
  created_at: Date | string;
};

export default async function NewsPage({
  searchParams,
}: {
  searchParams: { q?: string; page?: string };
}) {
  const t = await getTranslations("News");
  const q = searchParams.q || "";
  const page = parseInt(searchParams.page || "1", 10);
  const limit = 5;
  const offset = (page - 1) * limit;

  let newsQuery = "SELECT * FROM news";
  let countQuery = "SELECT COUNT(*) FROM news";
  const params: unknown[] = [];

  if (q) {
    newsQuery += " WHERE title ILIKE $1 OR content ILIKE $1";
    countQuery += " WHERE title ILIKE $1 OR content ILIKE $1";
    params.push(`%${q}%`);
  }

  newsQuery += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;

  const countParams = [...params];
  params.push(limit, offset);

  const [newsResult, countResult] = await Promise.all([
    query(newsQuery, params),
    query(countQuery, countParams),
  ]);

  const news = newsResult.rows as NewsRow[];
  const totalItems = parseInt(String(countResult.rows[0].count), 10);
  const totalPages = Math.ceil(totalItems / limit);

  return (
    <div className="flex flex-col w-full">
      <section className="relative w-full py-24 bg-black text-white overflow-hidden">
        <div
          className="absolute inset-0 opacity-30 bg-cover bg-center"
          style={{ backgroundImage: `url(${NEWS_HERO_IMAGE})` }}
          aria-hidden
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl md:text-6xl font-extrabold mb-6 drop-shadow-lg">
            {t("title")}
          </h1>
          <p className="text-xl text-gray-300 font-medium">
            {t("desc")}
          </p>
        </div>
      </section>

      <div className="max-w-4xl mx-auto w-full py-12 px-4 sm:px-6 lg:px-8">
        <form method="GET" action="/news" className="mb-12 flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              name="q"
              defaultValue={q}
              placeholder={t("searchPlaceholder")}
              className="w-full border rounded-md pl-10 pr-4 py-2 bg-white dark:bg-neutral-900 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <button
            type="submit"
            className="bg-blue-600 text-white px-6 py-2 rounded-md font-medium hover:bg-blue-700 transition"
          >
            {t("searchBtn")}
          </button>
        </form>

        <div className="space-y-6 mb-8">
          {news.length === 0 ? (
            <div className="text-center text-gray-500 py-8 border rounded-xl bg-white dark:bg-neutral-900 shadow-sm">
              {t("noResults")}
            </div>
          ) : (
            news.map((item) => (
              <article
                key={item.id}
                className="bg-white dark:bg-neutral-900 p-6 rounded-xl border shadow-sm"
              >
                <div className="flex justify-between items-center mb-2">
                  <div className="text-sm text-gray-500 font-medium">
                    {new Date(item.created_at).toLocaleDateString("ru-RU")} •{" "}
                    <span className="text-blue-600 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded-full text-xs uppercase tracking-wider">
                      {item.category}
                    </span>
                  </div>
                  {item.is_important && (
                    <span className="bg-red-600 text-white text-xs px-3 py-1 rounded-full font-bold shadow-sm uppercase tracking-wider">
                      {t("important")}
                    </span>
                  )}
                </div>
                <Link href={`/news/${item.id}`} className="block group mt-4">
                  <div className="h-64 w-full mb-6 rounded-xl overflow-hidden relative">
                    <img
                      src={
                        item.image_url ||
                        "https://images.unsplash.com/photo-1504711434969-e33886168f5c?q=80&w=1000&auto=format&fit=crop"
                      }
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <h2 className="text-2xl font-bold mb-3 group-hover:text-blue-600 transition-colors">
                    {item.title}
                  </h2>
                </Link>
                <p className="text-gray-600 dark:text-gray-400 mb-6 whitespace-pre-wrap line-clamp-3 text-lg leading-relaxed">
                  {item.content}
                </p>
                <div className="flex gap-2">
                  {item.tags &&
                    item.tags.map((tag: string, idx: number) => (
                      <span
                        key={idx}
                        className="bg-gray-100 dark:bg-neutral-800 text-xs px-2 py-1 rounded"
                      >
                        #{tag}
                      </span>
                    ))}
                </div>
              </article>
            ))
          )}
        </div>

        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-4">
            {page > 1 ? (
              <Link
                href={`/news?page=${page - 1}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
                className="flex items-center gap-1 px-4 py-2 border rounded-md hover:bg-gray-50 dark:hover:bg-neutral-800 transition bg-white dark:bg-neutral-900"
              >
                <ChevronLeft className="w-4 h-4" /> {t("back")}
              </Link>
            ) : (
              <div className="flex items-center gap-1 px-4 py-2 border rounded-md opacity-50 cursor-not-allowed bg-white dark:bg-neutral-900">
                <ChevronLeft className="w-4 h-4" /> {t("back")}
              </div>
            )}

            <span className="text-sm font-medium">
              {t("page", { page, totalPages })}
            </span>

            {page < totalPages ? (
              <Link
                href={`/news?page=${page + 1}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
                className="flex items-center gap-1 px-4 py-2 border rounded-md hover:bg-gray-50 dark:hover:bg-neutral-800 transition bg-white dark:bg-neutral-900"
              >
                {t("forward")} <ChevronRight className="w-4 h-4" />
              </Link>
            ) : (
              <div className="flex items-center gap-1 px-4 py-2 border rounded-md opacity-50 cursor-not-allowed bg-white dark:bg-neutral-900">
                {t("forward")} <ChevronRight className="w-4 h-4" />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
