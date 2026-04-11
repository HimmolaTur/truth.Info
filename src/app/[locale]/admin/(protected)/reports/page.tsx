import { AdminForumModerateButton } from "@/components/admin/AdminForumModerateButton";
import { LocaleGetSearchForm } from "@/components/LocaleGetSearchForm";
import { getStaffPermissions, requireStaffPermission } from "@/lib/adminPageAuth";
import { forumModerationFromPermissions } from "@/lib/forumModeration";
import { getTranslations, getLocale } from "next-intl/server";
import { queryWithTimeout } from "@/lib/db";
import { Link } from "@/navigation";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import { slugify } from "@/lib/utils";

export const dynamic = "force-dynamic";

type ReportRow = {
  id: number;
  topic_id: number;
  comment_id: number | null;
  reason: string;
  created_at: string;
  topic_title: string | null;
  is_pinned: boolean;
  is_closed: boolean;
};

export default async function AdminReportsPage({
  searchParams,
}: {
  searchParams: { q?: string; page?: string; limit?: string };
}) {
  await requireStaffPermission("reports.read");

  const locale = await getLocale();
  const staffPerms = await getStaffPermissions();
  const mod = forumModerationFromPermissions(staffPerms);
  const t = await getTranslations("Admin");
  const tNews = await getTranslations("News");

  const q = (searchParams.q || "").trim();
  const page = Math.max(1, parseInt(searchParams.page || "1", 10) || 1);
  const limitRaw = parseInt(searchParams.limit || "10", 10) || 10;
  const limit = Math.min(50, Math.max(5, limitRaw));

  const baseFrom = `FROM forum_reports r LEFT JOIN forum_topics t ON r.topic_id = t.id`;
  const searchWhere = q
    ? ` WHERE (
      COALESCE(t.title, '') ILIKE $1 OR r.reason ILIKE $1
      OR CAST(r.id AS TEXT) ILIKE $1 OR CAST(r.topic_id AS TEXT) ILIKE $1
      OR CAST(COALESCE(r.comment_id, 0) AS TEXT) ILIKE $1
    )`
    : "";

  const countQuery = `SELECT COUNT(*)::int AS count ${baseFrom}${searchWhere}`;
  const countParams = q ? [`%${q}%`] : [];

  let totalItems = 0;
  let reports: ReportRow[] = [];
  let dbError: string | null = null;
  let totalPages = 1;
  let safePage = 1;

  try {
    const countResult = await queryWithTimeout(countQuery, countParams);
    totalItems = Number(countResult.rows[0]?.count ?? 0);
    totalPages = Math.max(1, Math.ceil(totalItems / limit));
    safePage = Math.min(Math.max(1, page), totalPages);
    const offset = (safePage - 1) * limit;
    const dataParams = q ? [`%${q}%`, limit, offset] : [limit, offset];

    const listQueryFinal = `SELECT r.id, r.topic_id, r.comment_id, r.reason, r.created_at, t.title AS topic_title,
      COALESCE(t.is_pinned, false) AS is_pinned, COALESCE(t.is_closed, false) AS is_closed
      ${baseFrom}${searchWhere} ORDER BY r.created_at DESC LIMIT $${q ? 2 : 1} OFFSET $${q ? 3 : 2}`;
    const rowsResult = await queryWithTimeout(listQueryFinal, dataParams);
    reports = rowsResult.rows as ReportRow[];
  } catch (e) {
    dbError = e instanceof Error ? e.message : String(e);
    totalItems = 0;
    reports = [];
    totalPages = 1;
    safePage = 1;
  }

  const from = totalItems === 0 ? 0 : (safePage - 1) * limit + 1;
  const to = totalItems === 0 ? 0 : Math.min(safePage * limit, totalItems);

  const buildUrl = (newParams: Record<string, string | number | null | undefined>) => {
    const urlParams = new URLSearchParams();
    if (q) urlParams.set("q", q);
    if (limit !== 10) urlParams.set("limit", String(limit));
    if (safePage !== 1) urlParams.set("page", String(safePage));
    Object.entries(newParams).forEach(([key, value]) => {
      if (value === null || value === undefined || value === "") urlParams.delete(key);
      else urlParams.set(key, String(value));
    });
    const qs = urlParams.toString();
    return `/admin/reports${qs ? `?${qs}` : ""}`;
  };

  return (
    <div className="max-w-5xl mx-auto w-full py-12 px-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold">{t("reports")}</h1>
        <Link href="/admin/forum" className="text-sm text-blue-600 font-medium hover:underline">
          {t("forumModeration")}
        </Link>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <LocaleGetSearchForm basePath="/admin/reports" className="flex-1 flex flex-col sm:flex-row gap-3">
          {limit !== 10 && <input type="hidden" name="limit" value={limit} />}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="search"
              name="q"
              defaultValue={q}
              placeholder={t("adminReportsSearchPlaceholder")}
              className="w-full border rounded-md pl-10 pr-4 py-2.5 bg-white dark:bg-neutral-900 focus:ring-2 focus:ring-blue-500 outline-none shadow-sm"
            />
          </div>
          <button
            type="submit"
            className="bg-blue-600 text-white px-5 py-2.5 rounded-md font-medium hover:bg-blue-700 transition shadow-sm w-full sm:w-auto"
          >
            {tNews("searchBtn")}
          </button>
        </LocaleGetSearchForm>

        <div className="flex flex-wrap items-center gap-3 bg-white dark:bg-neutral-900 border rounded-lg px-4 py-2 shadow-sm">
          <span className="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">{t("adminNewsPerPage")}</span>
          <div className="flex gap-2">
            {[5, 10, 20, 50].map((l) => (
              <Link
                key={l}
                href={buildUrl({ limit: l, page: 1 })}
                className={`px-2.5 py-1 text-sm rounded-md transition ${
                  limit === l
                    ? "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200 font-semibold"
                    : "hover:bg-gray-100 dark:hover:bg-neutral-800 text-gray-600 dark:text-gray-400"
                }`}
              >
                {l}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        {t("adminNewsMeta", { total: totalItems, from, to, page: safePage, totalPages })}
      </p>

      {dbError && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/40 px-4 py-3 text-sm text-red-800 dark:text-red-200">
          {dbError}
        </div>
      )}

      <div className="space-y-4">
        {reports.length === 0 ? (
          <div className="text-center text-gray-500 py-12 border rounded-xl bg-white dark:bg-neutral-900 shadow-sm">
            {q ? tNews("noResults") : t("adminReportsEmpty")}
          </div>
        ) : (
          reports.map((r) => (
            <div
              key={r.id}
              className="bg-white dark:bg-neutral-900 p-4 rounded-xl border shadow-sm flex flex-col sm:flex-row sm:justify-between gap-4"
            >
              <div className="min-w-0 flex-1">
                <div className="text-xs text-gray-400">{new Date(r.created_at).toLocaleString(locale)}</div>
                <div className="font-bold text-lg break-words mt-1">{r.topic_title || `Topic #${r.topic_id}`}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mt-2 break-words">{r.reason}</div>
                <div className="text-xs text-gray-400 mt-2 space-y-1">
                  {r.comment_id != null && <div>Comment id: {r.comment_id}</div>}
                  <Link
                    href={`/forum/${r.topic_id}-${slugify(r.topic_title || `topic-${r.topic_id}`)}`}
                    className="inline-block text-sm text-blue-600 font-medium hover:underline"
                  >
                    {t("adminForumViewTopic")}
                  </Link>
                </div>
              </div>

              <div className="flex flex-row flex-wrap sm:flex-col gap-2 sm:items-end shrink-0">
                {!r.is_closed && mod.close_topic ? (
                  <AdminForumModerateButton
                    action="close_topic"
                    topicId={String(r.topic_id)}
                    className="text-yellow-600 text-sm text-left"
                  >
                    {t("modCloseTopic")}
                  </AdminForumModerateButton>
                ) : null}
                {r.is_closed && mod.open_topic ? (
                  <AdminForumModerateButton
                    action="open_topic"
                    topicId={String(r.topic_id)}
                    className="text-green-600 text-sm text-left"
                  >
                    {t("modOpenTopic")}
                  </AdminForumModerateButton>
                ) : null}
                {!r.is_pinned && mod.pin_topic ? (
                  <AdminForumModerateButton
                    action="pin_topic"
                    topicId={String(r.topic_id)}
                    className="text-blue-600 text-sm text-left"
                  >
                    {t("modPinTopic")}
                  </AdminForumModerateButton>
                ) : null}
                {r.is_pinned && mod.unpin_topic ? (
                  <AdminForumModerateButton
                    action="unpin_topic"
                    topicId={String(r.topic_id)}
                    className="text-blue-600 text-sm text-left"
                  >
                    {t("modUnpinTopic")}
                  </AdminForumModerateButton>
                ) : null}
              </div>
            </div>
          ))
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 mt-10">
          {safePage > 1 ? (
            <Link
              href={buildUrl({ page: safePage - 1 })}
              className="flex items-center gap-1 px-4 py-2 border rounded-md hover:bg-gray-50 dark:hover:bg-neutral-800 transition bg-white dark:bg-neutral-900 text-sm"
            >
              <ChevronLeft className="w-4 h-4" />
              {tNews("back")}
            </Link>
          ) : (
            <div className="flex items-center gap-1 px-4 py-2 border rounded-md opacity-50 cursor-not-allowed bg-white dark:bg-neutral-900 text-sm">
              <ChevronLeft className="w-4 h-4" />
              {tNews("back")}
            </div>
          )}
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {tNews("page", { page: safePage, totalPages })}
          </span>
          {safePage < totalPages ? (
            <Link
              href={buildUrl({ page: safePage + 1 })}
              className="flex items-center gap-1 px-4 py-2 border rounded-md hover:bg-gray-50 dark:hover:bg-neutral-800 transition bg-white dark:bg-neutral-900 text-sm"
            >
              {tNews("forward")}
              <ChevronRight className="w-4 h-4" />
            </Link>
          ) : (
            <div className="flex items-center gap-1 px-4 py-2 border rounded-md opacity-50 cursor-not-allowed bg-white dark:bg-neutral-900 text-sm">
              {tNews("forward")}
              <ChevronRight className="w-4 h-4" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
