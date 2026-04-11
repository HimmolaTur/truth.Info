import { LocaleGetSearchForm } from "@/components/LocaleGetSearchForm";
import { getStaffPermissions, requireStaffPermission } from "@/lib/adminPageAuth";
import { getLocale, getTranslations } from "next-intl/server";
import { queryWithTimeout } from "@/lib/db";
import { Link } from "@/navigation";
import { Search, ChevronLeft, ChevronRight, Shield } from "lucide-react";

export const dynamic = "force-dynamic";

type UserRow = {
  id: number;
  display_name: string;
  avatar_url: string | null;
  created_at: string;
  role_slug: string;
  role_name: string;
};

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: { q?: string; page?: string; limit?: string };
}) {
  await requireStaffPermission("users.read");

  const locale = await getLocale();
  const staffPerms = await getStaffPermissions();
  const canUpdate = staffPerms.includes("users.update");
  const t = await getTranslations("Admin");
  const tNews = await getTranslations("News");

  const q = (searchParams.q || "").trim();
  const page = Math.max(1, parseInt(searchParams.page || "1", 10) || 1);
  const limitRaw = parseInt(searchParams.limit || "10", 10) || 10;
  const limit = Math.min(50, Math.max(5, limitRaw));

  let totalItems = 0;
  let users: UserRow[] = [];
  let dbError: string | null = null;
  let totalPages = 1;
  let safePage = 1;

  try {
    const like = `%${q}%`;
    const countResult = q
      ? await queryWithTimeout(
          `SELECT COUNT(*)::int AS count FROM users u
           WHERE u.display_name ILIKE $1 OR CAST(u.id AS TEXT) = $2`,
          [like, q]
        )
      : await queryWithTimeout(`SELECT COUNT(*)::int AS count FROM users`, []);
    totalItems = Number(countResult.rows[0]?.count ?? 0);
    totalPages = Math.max(1, Math.ceil(totalItems / limit));
    safePage = Math.min(Math.max(1, page), totalPages);
    const offset = (safePage - 1) * limit;

    const usersResult = q
      ? await queryWithTimeout(
          `SELECT u.id, u.display_name, u.avatar_url, u.created_at,
                  r.slug AS role_slug, r.name AS role_name
           FROM users u
           JOIN roles r ON r.id = u.role_id
           WHERE u.display_name ILIKE $1 OR CAST(u.id AS TEXT) = $2
           ORDER BY u.id ASC LIMIT $3 OFFSET $4`,
          [like, q, limit, offset]
        )
      : await queryWithTimeout(
          `SELECT u.id, u.display_name, u.avatar_url, u.created_at,
                  r.slug AS role_slug, r.name AS role_name
           FROM users u
           JOIN roles r ON r.id = u.role_id
           ORDER BY u.id ASC LIMIT $1 OFFSET $2`,
          [limit, offset]
        );
    users = usersResult.rows as UserRow[];
  } catch (e) {
    dbError = e instanceof Error ? e.message : String(e);
    totalItems = 0;
    users = [];
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
      if (value === null || value === undefined || value === "") {
        urlParams.delete(key);
      } else {
        urlParams.set(key, String(value));
      }
    });

    const qs = urlParams.toString();
    return `/admin/users${qs ? `?${qs}` : ""}`;
  };

  return (
    <div className="max-w-5xl mx-auto w-full py-12 px-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold">{t("adminUsersTitle")}</h1>
        <Link href="/admin" className="text-sm text-blue-600 font-medium hover:underline">
          ← {t("title")}
        </Link>
      </div>

      <p className="text-gray-600 dark:text-gray-400 mb-2 text-sm">{t("adminUsersDesc")}</p>
      <p className="text-xs text-amber-800 dark:text-amber-200 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 rounded-md px-3 py-2 mb-6">
        {t("adminUsersPrivacyNote")}
      </p>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <LocaleGetSearchForm basePath="/admin/users" className="flex-1 flex flex-col sm:flex-row gap-3">
          {limit !== 10 && <input type="hidden" name="limit" value={limit} />}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="search"
              name="q"
              defaultValue={q}
              placeholder={t("adminUsersSearchPlaceholder")}
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
        {t("adminUsersMeta", { total: totalItems, from, to, page: safePage, totalPages })}
      </p>

      {dbError && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/40 px-4 py-3 text-sm text-red-800 dark:text-red-200">
          {dbError}
        </div>
      )}

      <div className="space-y-4">
        {users.length === 0 ? (
          <div className="text-center text-gray-500 py-12 border rounded-xl bg-white dark:bg-neutral-900 shadow-sm">
            {q ? tNews("noResults") : t("adminUsersEmpty")}
          </div>
        ) : (
          users.map((u) => {
            const isAdminLike = u.role_slug === "admin";
            return (
              <div
                key={u.id}
                className="bg-white dark:bg-neutral-900 p-4 rounded-xl border shadow-sm flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-bold text-lg break-words font-mono">{u.display_name}</h3>
                    {isAdminLike ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-100 px-2 py-0.5 rounded">
                        <Shield className="w-3 h-3" />
                        {u.role_name}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded bg-gray-100 dark:bg-neutral-800">
                        {u.role_name}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-2">
                    {t("adminUserInternalId")}: {u.id} · {new Date(u.created_at).toLocaleString(locale)}
                  </p>
                </div>
                <div className="shrink-0">
                  {canUpdate ? (
                    <Link href={`/admin/users/edit/${u.id}`} className="text-sm text-blue-600 font-medium">
                      {t("edit")}
                    </Link>
                  ) : null}
                </div>
              </div>
            );
          })
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
