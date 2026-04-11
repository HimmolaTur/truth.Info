import Link from "next/link";
import { getStaffPermissions } from "@/lib/adminPageAuth";
import { hasPermissionPrefix } from "@/lib/permissions";
import { getTranslations, getLocale } from "next-intl/server";
import React from "react";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const t = await getTranslations("Admin");
  const locale = await getLocale();
  const perms = await getStaffPermissions();
  const can = (p: string) => perms.includes(p);
  const canSection = (prefix: string) => hasPermissionPrefix(perms, prefix);

  return (
    <div className="max-w-5xl mx-auto w-full py-12 px-4">
      <h1 className="text-3xl font-bold mb-6">{t("title")}</h1>
      <p className="text-gray-600 dark:text-gray-400 mb-8">{t("desc")}</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {canSection("content.news") ? (
          <Link
            href={`/${locale}/admin/news`}
            className="block p-6 bg-white dark:bg-neutral-900 rounded-xl shadow hover:shadow-lg transition"
          >
            <h2 className="text-xl font-bold mb-2">{t("news")}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">{t("newsDesc")}</p>
          </Link>
        ) : null}

        {canSection("content.factcheck") ? (
          <Link
            href={`/${locale}/admin/factcheck`}
            className="block p-6 bg-white dark:bg-neutral-900 rounded-xl shadow hover:shadow-lg transition"
          >
            <h2 className="text-xl font-bold mb-2">{t("factcheck")}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">{t("factcheckDesc")}</p>
          </Link>
        ) : null}

        {canSection("forum.moderate") ? (
          <Link
            href={`/${locale}/admin/forum`}
            className="block p-6 bg-white dark:bg-neutral-900 rounded-xl shadow hover:shadow-lg transition"
          >
            <h2 className="text-xl font-bold mb-2">{t("forum")}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">{t("forumDesc")}</p>
          </Link>
        ) : null}

        {can("reports.read") ? (
          <Link
            href={`/${locale}/admin/reports`}
            className="block p-6 bg-white dark:bg-neutral-900 rounded-xl shadow hover:shadow-lg transition"
          >
            <h2 className="text-xl font-bold mb-2">{t("reports")}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">{t("reportsDesc")}</p>
          </Link>
        ) : null}

        {canSection("users") ? (
          <Link
            href={`/${locale}/admin/users`}
            className="block p-6 bg-white dark:bg-neutral-900 rounded-xl shadow hover:shadow-lg transition"
          >
            <h2 className="text-xl font-bold mb-2">{t("adminUsersTitle")}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">{t("adminUsersDesc")}</p>
          </Link>
        ) : null}

        {canSection("roles") ? (
          <Link
            href={`/${locale}/admin/roles`}
            className="block p-6 bg-white dark:bg-neutral-900 rounded-xl shadow hover:shadow-lg transition"
          >
            <h2 className="text-xl font-bold mb-2">{t("adminRolesTitle")}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">{t("adminRolesDesc")}</p>
          </Link>
        ) : null}
      </div>

      {!canSection("content.news") &&
      !canSection("content.factcheck") &&
      !canSection("forum.moderate") &&
      !can("reports.read") &&
      !canSection("users") &&
      !canSection("roles") ? (
        <p className="text-sm text-amber-800 dark:text-amber-200 mt-6">{t("adminNoSectionPermissions")}</p>
      ) : null}
    </div>
  );
}
