import { LocaleGetSearchForm } from "@/components/LocaleGetSearchForm";
import { queryWithTimeout } from "@/lib/db";
import { Link } from "@/navigation";
import { Search, ChevronLeft, ChevronRight, LayoutList, LayoutGrid, AlignJustify } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { newsImageUrlFromRow, newsTagsForDisplay } from "@/lib/newsAdmin";

const NEWS_HERO_IMAGE =
  "/images/photo-1504711434969-e33886168f5c.jpg";

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
  searchParams: { q?: string; page?: string; limit?: string; view?: string };
}) {
  const t = await getTranslations("News");
  const tc = await getTranslations("Common");
  const locale = await getLocale();
  const q = searchParams.q || "";
  const page = parseInt(searchParams.page || "1", 10);
  const limit = parseInt(searchParams.limit || "5", 10);
  const view = searchParams.view || "list"; // list, grid, compact
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

  let news: NewsRow[] = [];
  let totalItems = 0;
  let totalPages = 0;
  let dbError = false;

  try {
    const [newsResult, countResult] = await Promise.all([
      queryWithTimeout(newsQuery, params, 18_000),
      queryWithTimeout(countQuery, countParams, 18_000),
    ]);
    news = newsResult.rows as NewsRow[];
    totalItems = parseInt(String(countResult.rows[0].count), 10);
    totalPages = Math.ceil(totalItems / limit);
  } catch {
    dbError = true;
  }

  const buildUrl = (newParams: Record<string, string | number | null>) => {
    const urlParams = new URLSearchParams();
    if (q) urlParams.set("q", q);
    if (limit !== 5) urlParams.set("limit", limit.toString());
    if (page !== 1) urlParams.set("page", page.toString());
    if (view !== "list") urlParams.set("view", view);

    Object.entries(newParams).forEach(([key, value]) => {
      if (value === null || value === undefined || value === "") {
        urlParams.delete(key);
      } else {
        urlParams.set(key, value.toString());
      }
    });

    const queryString = urlParams.toString();
    return `/news${queryString ? `?${queryString}` : ""}`;
  };

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

      <div className="max-w-5xl mx-auto w-full py-12 px-4 sm:px-6 lg:px-8">
        {dbError && (
          <div
            role="alert"
            className="mb-8 rounded-xl border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/30 px-4 py-3 text-red-800 dark:text-red-200"
          >
            {tc("dataLoadError")}
          </div>
        )}
        <div className="flex flex-col md:flex-row gap-4 mb-10">
          <LocaleGetSearchForm basePath="/news" className="flex-1 flex flex-col sm:flex-row gap-3">
            {limit !== 5 && <input type="hidden" name="limit" value={limit} />}
            {view !== "list" && <input type="hidden" name="view" value={view} />}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                name="q"
                defaultValue={q}
                placeholder={t("searchPlaceholder")}
                className="w-full border rounded-md pl-10 pr-4 py-3 bg-white dark:bg-neutral-900 focus:ring-2 focus:ring-blue-500 outline-none shadow-sm"
              />
            </div>
            <button
              type="submit"
              className="bg-blue-600 text-white px-6 py-3 rounded-md font-medium hover:bg-blue-700 transition shadow-sm w-full sm:w-auto"
            >
              {t("searchBtn")}
            </button>
          </LocaleGetSearchForm>

          <div className="flex flex-wrap items-center gap-4 shrink-0">
            {/* View Toggle */}
            <div className="flex bg-gray-100 dark:bg-neutral-800 p-1 rounded-lg shadow-sm">
              <Link 
                href={buildUrl({ view: 'list', page: 1 })}
                className={`p-2 rounded-md transition ${view === 'list' ? 'bg-white dark:bg-neutral-700 shadow-sm text-blue-600 dark:text-blue-400' : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-300'}`}
                title={tc("viewList")}
              >
                <AlignJustify className="w-5 h-5" />
              </Link>
              <Link 
                href={buildUrl({ view: 'grid', page: 1 })}
                className={`p-2 rounded-md transition ${view === 'grid' ? 'bg-white dark:bg-neutral-700 shadow-sm text-blue-600 dark:text-blue-400' : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-300'}`}
                title={tc("viewGrid")}
              >
                <LayoutGrid className="w-5 h-5" />
              </Link>
              <Link 
                href={buildUrl({ view: 'compact', page: 1 })}
                className={`p-2 rounded-md transition ${view === 'compact' ? 'bg-white dark:bg-neutral-700 shadow-sm text-blue-600 dark:text-blue-400' : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-300'}`}
                title={tc("viewCompact")}
              >
                <LayoutList className="w-5 h-5" />
              </Link>
            </div>

            {/* Limit Selector */}
            <div className="flex items-center gap-3 bg-white dark:bg-neutral-900 border rounded-md px-4 py-2 shadow-sm h-full">
              <span className="text-sm text-gray-500 hidden sm:inline">{tc("showAs")}</span>
              <div className="flex gap-2">
                {[5, 10, 20].map(l => (
                  <Link 
                    key={l} 
                    href={buildUrl({ limit: l, page: 1 })}
                    className={`px-2 py-1 text-sm rounded transition ${limit === l ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 font-bold' : 'hover:bg-gray-100 dark:hover:bg-neutral-800 text-gray-600 dark:text-gray-400'}`}
                  >
                    {l}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className={
          view === 'grid' 
            ? "grid grid-cols-1 md:grid-cols-2 gap-6 mb-8" 
            : view === 'compact' 
              ? "space-y-4 mb-8" 
              : "space-y-6 mb-8"
        }>
          {news.length === 0 ? (
            <div className="text-center text-gray-500 py-8 border rounded-xl bg-white dark:bg-neutral-900 shadow-sm col-span-full">
              {dbError ? tc("dataLoadError") : t("noResults")}
            </div>
          ) : (
            news.map((item) => {
              const rowTags = newsTagsForDisplay(item.tags);
              return (
              <article
                key={item.id}
                className={`bg-white dark:bg-neutral-900 rounded-xl border shadow-sm ${view === 'grid' ? 'flex flex-col h-full' : ''} ${view === 'compact' ? 'p-4' : 'p-6'}`}
              >
                <div className={`flex justify-between items-center ${view === 'compact' ? 'mb-1' : 'mb-2'}`}>
                  <div className="text-sm text-gray-500 font-medium">
                    {new Date(item.created_at).toLocaleDateString(locale)} •{" "}
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
                <Link href={`/news/${item.id}`} className={`block group ${view === 'compact' ? 'mt-2' : 'mt-4'} ${view === 'grid' ? 'flex-1 flex flex-col' : ''}`}>
                  {view !== 'compact' && (
                    <div className="h-64 w-full mb-6 rounded-xl overflow-hidden relative">
                      <img
                        src={
                          newsImageUrlFromRow(item as Record<string, unknown>) ||
                          "/images/photo-1504711434969-e33886168f5c.jpg"
                        }
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                  )}
                  <h2 className={`${view === 'compact' ? 'text-lg' : 'text-2xl'} font-bold mb-3 group-hover:text-blue-600 transition-colors`}>
                    {item.title}
                  </h2>
                  <p className={`text-gray-600 dark:text-gray-400 whitespace-pre-wrap ${view === 'compact' ? 'line-clamp-2 text-sm mb-0' : 'line-clamp-3 text-lg leading-relaxed mb-6'} ${view === 'grid' ? 'flex-1' : ''}`}>
                    {item.content}
                  </p>
                </Link>
                {view !== "compact" && rowTags.length > 0 && (
                  <div className="flex gap-2 mt-auto pt-4">
                    {rowTags.map((tag: string, idx: number) => (
                      <span
                        key={idx}
                        className="bg-gray-100 dark:bg-neutral-800 text-xs px-2 py-1 rounded"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </article>
            );
            })
          )}
        </div>

        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-4">
            {page > 1 ? (
              <Link
                href={buildUrl({ page: page - 1 })}
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
                href={buildUrl({ page: page + 1 })}
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
