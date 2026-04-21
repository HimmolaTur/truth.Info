import { queryWithTimeout } from "@/lib/db";
import { notFound } from "next/navigation";
import { Link } from "@/navigation";
import { ArrowLeft, CheckCircle, ChevronDown, FileText, Hash, HelpCircle, List, ShieldAlert } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { newsImageUrlFromRow, newsTagsForDisplay } from "@/lib/newsAdmin";
import { normalizeFactcheckSources } from "@/lib/factcheckSources";

const localeToDateLocale: Record<string, string> = {
  ru: "ru-RU",
  en: "en-GB",
  uk: "uk-UA",
  de: "de-DE",
};

function dateLocaleFor(uiLocale: string) {
  return localeToDateLocale[uiLocale] ?? "ru-RU";
}

export default async function NewsArticlePage({ params }: { params: { id: string } }) {
  const t = await getTranslations("News");
  const tc = await getTranslations("Common");
  const uiLocale = await getLocale();
  const dateLocale = dateLocaleFor(uiLocale);

  let result: Awaited<ReturnType<typeof queryWithTimeout>>;
  try {
    result = await queryWithTimeout("SELECT * FROM news WHERE id = $1", [params.id], 18_000);
  } catch {
    return (
      <div className="max-w-7xl mx-auto w-full py-8 px-4 sm:px-6 lg:px-8">
        <Link href="/news" className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-6 font-medium">
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t("backToNews")}
        </Link>
        <div
          role="alert"
          className="rounded-xl border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/30 px-6 py-8 text-red-800 dark:text-red-200"
        >
          {tc("dataLoadError")}
        </div>
      </div>
    );
  }

  if (result.rows.length === 0) {
    notFound();
  }

  const article = result.rows[0] as Record<string, unknown>;
  const displayTags = newsTagsForDisplay(article.tags);
  const articleImage =
    newsImageUrlFromRow(article) ||
    "/images/photo-1504711434969-e33886168f5c.jpg";

  const published = new Date(String(article.created_at));
  const dateStr = published.toLocaleDateString(dateLocale, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const faqItems = [
    { q: t("articleFaq1Q"), a: t("articleFaq1A") },
    { q: t("articleFaq2Q"), a: t("articleFaq2A") },
    { q: t("articleFaq3Q"), a: t("articleFaq3A") },
    { q: t("articleFaq4Q"), a: t("articleFaq4A") },
  ];

  let articleFactchecks: Record<string, unknown>[] = [];
  try {
    const fc = await queryWithTimeout(
      `SELECT id, claim, truth, sources FROM factchecks WHERE news_id = $1 ORDER BY created_at ASC`,
      [Number(params.id)],
      12_000
    );
    articleFactchecks = fc.rows as Record<string, unknown>[];
  } catch {
    articleFactchecks = [];
  }

  const navClass =
    "flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-200/80 dark:hover:bg-neutral-800 transition-colors border border-transparent hover:border-gray-200 dark:hover:border-neutral-700";

  return (
    <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
      <Link
        href="/news"
        className="inline-flex items-center text-blue-600 dark:text-blue-400 hover:underline mb-8 font-medium"
      >
        <ArrowLeft className="w-4 h-4 mr-2 shrink-0" />
        {t("backToNews")}
      </Link>

      <div className="flex flex-col lg:grid lg:grid-cols-[minmax(220px,280px)_minmax(0,1fr)] gap-10 lg:gap-14 items-start">
        <aside className="w-full lg:sticky lg:top-24 rounded-2xl border border-gray-200 dark:border-neutral-800 bg-gray-50 dark:bg-neutral-900/90 p-5 shadow-sm">
          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-3">
            <List className="w-4 h-4 shrink-0" aria-hidden />
            <h2 className="text-xs font-bold uppercase tracking-wider">{t("articleMenuTitle")}</h2>
          </div>
          <nav aria-label={t("articleMenuTitle")}>
            <ul className="space-y-0.5">
              <li>
                <a href="#article-post" className={navClass}>
                  <FileText className="w-4 h-4 shrink-0 opacity-70" aria-hidden />
                  {t("articleNavPost")}
                </a>
              </li>
              <li>
                <a href="#article-faq" className={navClass}>
                  <HelpCircle className="w-4 h-4 shrink-0 opacity-70" aria-hidden />
                  {t("articleNavFaq")}
                </a>
              </li>
              {articleFactchecks.length > 0 ? (
                <li>
                  <a href="#article-factcheck" className={navClass}>
                    <ShieldAlert className="w-4 h-4 shrink-0 opacity-70" aria-hidden />
                    {t("articleNavFactcheck")}
                  </a>
                </li>
              ) : null}
              <li>
                <a href="#article-tags" className={navClass}>
                  <Hash className="w-4 h-4 shrink-0 opacity-70" aria-hidden />
                  {t("articleNavTags")}
                </a>
              </li>
            </ul>
          </nav>
          <div className="mt-6 pt-5 border-t border-gray-200 dark:border-neutral-800">
            <Link
              href="/news"
              className="text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline"
            >
              {t("backToNews")}
            </Link>
          </div>
        </aside>

        <article className="min-w-0 w-full bg-white dark:bg-neutral-900 rounded-2xl border border-gray-200 dark:border-neutral-800 shadow-sm p-6 sm:p-10">
          <section id="article-post" className="scroll-mt-28">
            <div className="flex flex-wrap justify-between items-start gap-4 mb-6">
              <div className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                <time dateTime={published.toISOString()}>{dateStr}</time>
                <span className="mx-2" aria-hidden>
                  •
                </span>
                <span className="text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 px-3 py-1 rounded-full uppercase tracking-wider text-xs">
                  {String(article.category ?? "")}
                </span>
              </div>
              {Boolean(article.is_important) && (
                <span className="bg-red-600 text-white text-xs px-3 py-1 rounded-full font-bold shadow-sm uppercase tracking-wider shrink-0">
                  {t("important")}
                </span>
              )}
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold mb-8 leading-tight text-gray-900 dark:text-white">
              {String(article.title ?? "")}
            </h1>

            <div className="w-full h-56 sm:h-72 md:h-96 rounded-2xl overflow-hidden mb-10 shadow-lg border border-gray-100 dark:border-neutral-800">
              <img
                src={articleImage}
                alt={String(article.title ?? "")}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="prose dark:prose-invert max-w-none text-gray-800 dark:text-gray-200 whitespace-pre-wrap text-lg leading-relaxed">
              {String(article.content ?? "")}
            </div>
          </section>

          {articleFactchecks.length > 0 ? (
            <section
              id="article-factcheck"
              className="scroll-mt-28 mt-12 pt-10 border-t border-gray-200 dark:border-neutral-800"
              aria-labelledby="article-factcheck-heading"
            >
              <h2
                id="article-factcheck-heading"
                className="text-xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2"
              >
                <ShieldAlert className="w-6 h-6 text-amber-600 dark:text-amber-400 shrink-0" aria-hidden />
                {t("articleFactcheckTitle")}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 max-w-3xl">{t("articleFactcheckLead")}</p>
              <div className="space-y-8 max-w-3xl">
                {articleFactchecks.map((row) => {
                  const claim = String(row.claim ?? "");
                  const truth = String(row.truth ?? "");
                  const sourcesList = normalizeFactcheckSources(row.sources);
                  return (
                    <div
                      key={String(row.id)}
                      className="rounded-xl border border-gray-200 dark:border-neutral-700 overflow-hidden shadow-sm"
                    >
                      <div className="bg-red-50 dark:bg-red-950/30 border-b border-red-100 dark:border-red-900/40 p-5">
                        <div className="flex items-center gap-2 text-red-700 dark:text-red-300 font-bold text-sm mb-2">
                          <ShieldAlert className="w-4 h-4 shrink-0" aria-hidden />
                          {t("articleFactcheckClaim")}
                        </div>
                        <p className="text-gray-800 dark:text-gray-200 text-sm sm:text-base leading-relaxed">{claim}</p>
                      </div>
                      <div className="bg-green-50 dark:bg-green-950/20 p-5">
                        <div className="flex items-center gap-2 text-green-700 dark:text-green-300 font-bold text-sm mb-2">
                          <CheckCircle className="w-4 h-4 shrink-0" aria-hidden />
                          {t("articleFactcheckTruth")}
                        </div>
                        <p className="text-gray-800 dark:text-gray-200 text-sm sm:text-base leading-relaxed whitespace-pre-wrap">
                          {truth}
                        </p>
                        {sourcesList.length > 0 ? (
                          <div className="mt-4 pt-4 border-t border-green-200 dark:border-green-900/40">
                            <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">
                              {t("articleFactcheckSources")}
                            </p>
                            <ul className="list-disc list-inside text-sm text-blue-600 dark:text-blue-400 space-y-1">
                              {sourcesList.map((src) => (
                                <li key={src} className="break-all">
                                  {src.startsWith("http") ? (
                                    <a href={src} target="_blank" rel="noreferrer" className="hover:underline">
                                      {src}
                                    </a>
                                  ) : (
                                    src
                                  )}
                                </li>
                              ))}
                            </ul>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
              <p className="mt-6 text-xs text-gray-500 dark:text-gray-400 max-w-3xl">{t("articleFactcheckDisclaimer")}</p>
              <div className="mt-4">
                <Link
                  href="/factcheck"
                  className="text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                >
                  {t("articleFactcheckAll")}
                </Link>
              </div>
            </section>
          ) : null}

          <section
            id="article-faq"
            className="scroll-mt-28 mt-12 pt-10 border-t border-gray-200 dark:border-neutral-800"
            aria-labelledby="article-faq-heading"
          >
            <h2
              id="article-faq-heading"
              className="text-xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2"
            >
              <HelpCircle className="w-6 h-6 text-blue-600 dark:text-blue-400 shrink-0" aria-hidden />
              {t("articleFaqTitle")}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 max-w-3xl">{t("articleFaqLead")}</p>
            <div className="max-w-3xl space-y-3">
              {faqItems.map((item, i) => (
                <details
                  key={i}
                  className="group rounded-xl border border-gray-200 dark:border-neutral-700 bg-gray-50/80 dark:bg-neutral-800/40 overflow-hidden open:shadow-md transition-shadow"
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-left font-semibold text-gray-900 dark:text-white hover:bg-gray-100/90 dark:hover:bg-neutral-800/80 [&::-webkit-details-marker]:hidden">
                    <span className="leading-snug pr-2">{item.q}</span>
                    <ChevronDown
                      className="h-5 w-5 shrink-0 text-gray-500 dark:text-gray-400 transition-transform duration-200 group-open:rotate-180"
                      aria-hidden
                    />
                  </summary>
                  <div className="border-t border-gray-200 dark:border-neutral-700 px-5 pb-5 pt-4 text-sm sm:text-base leading-relaxed text-gray-600 dark:text-gray-300">
                    {item.a}
                  </div>
                </details>
              ))}
            </div>
          </section>

          <section
            id="article-tags"
            className="scroll-mt-28 mt-12 pt-10 border-t border-gray-200 dark:border-neutral-800"
            aria-labelledby="article-tags-heading"
          >
            <h2
              id="article-tags-heading"
              className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2"
            >
              <Hash className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" aria-hidden />
              {t("articleTagsHeading")}
            </h2>
            {displayTags.length > 0 ? (
              <ul className="flex flex-wrap gap-2 list-none p-0 m-0">
                {displayTags.map((tag: string, idx: number) => (
                  <li key={idx}>
                    <span className="inline-block bg-gray-100 dark:bg-neutral-800 text-gray-800 dark:text-gray-200 text-sm px-3 py-1.5 rounded-full border border-gray-200 dark:border-neutral-700">
                      #{tag}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-sm">{t("articleTagsEmpty")}</p>
            )}
          </section>
        </article>
      </div>
    </div>
  );
}
