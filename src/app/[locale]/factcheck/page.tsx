import { ShieldAlert, CheckCircle, Search, ChevronLeft, ChevronRight, LayoutList, LayoutGrid, AlignJustify } from "lucide-react";
import { HeroBackdrop } from "@/components/HeroBackdrop";
import { LocaleGetSearchForm } from "@/components/LocaleGetSearchForm";
import { query } from "@/lib/db";
import { getTranslations } from "next-intl/server";
import { Link } from "@/navigation";
import { normalizeFactcheckSources } from "@/lib/factcheckSources";

const FACTCHECK_HERO_IMG =
  "/images/photo-1503694978374-8a2fa686963a.jpg";

type FactcheckRow = {
  id: number;
  claim: string;
  truth: string;
  sources: string | string[] | null;
};

export default async function FactcheckPage({
  searchParams,
}: {
  searchParams: { q?: string; page?: string; limit?: string; view?: string };
}) {
  const t = await getTranslations("Factcheck");
  const tc = await getTranslations("Common");
  const q = searchParams.q || "";
  const page = parseInt(searchParams.page || "1", 10);
  const limit = parseInt(searchParams.limit || "10", 10);
  const view = searchParams.view || "list"; // list, grid, compact
  const offset = (page - 1) * limit;

  let factcheckQuery = "SELECT * FROM factchecks";
  let countQuery = "SELECT COUNT(*) FROM factchecks";
  const params: unknown[] = [];

  if (q) {
    factcheckQuery += " WHERE claim ILIKE $1 OR truth ILIKE $1";
    countQuery += " WHERE claim ILIKE $1 OR truth ILIKE $1";
    params.push(`%${q}%`);
  }

  factcheckQuery += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;

  const countParams = [...params];
  params.push(limit, offset);

  const [factchecksResult, countResult] = await Promise.all([
    query(factcheckQuery, params),
    query(countQuery, countParams),
  ]);

  const factchecks = factchecksResult.rows as FactcheckRow[];
  const totalItems = parseInt(String(countResult.rows[0].count), 10);
  const totalPages = Math.ceil(totalItems / limit);

  const buildUrl = (newParams: Record<string, string | number | null>) => {
    const urlParams = new URLSearchParams();
    if (q) urlParams.set("q", q);
    if (limit !== 10) urlParams.set("limit", limit.toString());
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
    return `/factcheck${queryString ? `?${queryString}` : ""}`;
  };

  return (
    <div className="flex flex-col w-full">
      {/* Full-width Hero for Factcheck */}
      <section className="relative w-full py-24 bg-black text-white overflow-hidden">
        <HeroBackdrop imageUrl={FACTCHECK_HERO_IMG} className="opacity-30" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl md:text-6xl font-extrabold mb-6 drop-shadow-lg">{t("title")}</h1>
          <p className="text-xl text-gray-300 font-medium">{t("desc")}</p>
        </div>
      </section>

      <div className="max-w-5xl mx-auto w-full py-12 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row gap-4 mb-10">
          <LocaleGetSearchForm basePath="/factcheck" className="flex-1 flex flex-col sm:flex-row gap-3">
            {limit !== 10 && <input type="hidden" name="limit" value={limit} />}
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
            ? "grid grid-cols-1 md:grid-cols-2 gap-6" 
            : view === 'compact' 
              ? "space-y-4" 
              : "space-y-10"
        }>
          {factchecks.length === 0 ? (
            <div className="text-center text-gray-500 py-8 col-span-full">{t("noFactchecks")}</div>
          ) : (
            factchecks.map((item) => {
              const sourcesList = normalizeFactcheckSources(item.sources);
              return (
            <div key={item.id} className={`bg-white dark:bg-neutral-900 rounded-xl border overflow-hidden shadow-sm ${view === 'grid' ? 'flex flex-col h-full' : ''}`}>
              <div className={`bg-red-50 dark:bg-red-900/20 border-b border-red-100 dark:border-red-900/30 ${view === 'compact' ? 'p-4' : 'p-6'}`}>
                <div className={`flex items-center gap-2 text-red-600 dark:text-red-400 font-bold ${view === 'compact' ? 'mb-1 text-sm' : 'mb-2'}`}>
                  <ShieldAlert className={view === 'compact' ? 'w-4 h-4' : 'w-5 h-5'} />
                  {t("fake")}
                </div>
                <p className={`text-gray-700 dark:text-gray-300 font-medium ${view === 'compact' ? 'text-sm line-clamp-2' : ''}`}>
                  {item.claim}
                </p>
              </div>
              <div className={`bg-green-50 dark:bg-green-900/10 ${view === 'compact' ? 'p-4' : 'p-6'} ${view === 'grid' ? 'flex-1 flex flex-col' : ''}`}>
                <div className={`flex items-center gap-2 text-green-600 dark:text-green-400 font-bold ${view === 'compact' ? 'mb-1 text-sm' : 'mb-2'}`}>
                  <CheckCircle className={view === 'compact' ? 'w-4 h-4' : 'w-5 h-5'} />
                  {t("refutation")}
                </div>
                <p className={`text-gray-700 dark:text-gray-300 whitespace-pre-wrap ${view === 'compact' ? 'text-sm line-clamp-3 mb-0' : 'mb-4'} ${view === 'grid' ? 'flex-1' : ''}`}>
                  {item.truth}
                </p>
                {sourcesList.length > 0 && view !== 'compact' && (
                  <div className="mt-4 pt-4 border-t border-green-200 dark:border-green-900/30">
                    <h4 className="font-bold text-sm mb-2">{t("sources")}</h4>
                    <ul className="list-disc list-inside text-sm text-blue-600 dark:text-blue-400 ml-4">
                      {sourcesList.map((source: string, idx: number) => (
                        <li key={idx} className="truncate">
                          {source.startsWith('http') ? (
                            <a href={source} target="_blank" rel="noreferrer" className="hover:underline">{source}</a>
                          ) : (
                            <span>{source}</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
            );
            })
          )}
        </div>

        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-4 mt-12">
            {page > 1 ? (
              <Link
                href={buildUrl({ page: page - 1 })}
                className="flex items-center gap-1 px-4 py-2 border rounded-md hover:bg-gray-50 dark:hover:bg-neutral-800 transition bg-white dark:bg-neutral-900"
              >
                <ChevronLeft className="w-4 h-4" /> {tc("paginationPrev")}
              </Link>
            ) : (
              <div className="flex items-center gap-1 px-4 py-2 border rounded-md opacity-50 cursor-not-allowed bg-white dark:bg-neutral-900">
                <ChevronLeft className="w-4 h-4" /> {tc("paginationPrev")}
              </div>
            )}

            <span className="text-sm font-medium text-gray-500">
              {tc("paginationPage", { page, totalPages })}
            </span>

            {page < totalPages ? (
              <Link
                href={buildUrl({ page: page + 1 })}
                className="flex items-center gap-1 px-4 py-2 border rounded-md hover:bg-gray-50 dark:hover:bg-neutral-800 transition bg-white dark:bg-neutral-900"
              >
                {tc("paginationNext")} <ChevronRight className="w-4 h-4" />
              </Link>
            ) : (
              <div className="flex items-center gap-1 px-4 py-2 border rounded-md opacity-50 cursor-not-allowed bg-white dark:bg-neutral-900">
                {tc("paginationNext")} <ChevronRight className="w-4 h-4" />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}