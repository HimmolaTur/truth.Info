"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/navigation";
import { ChevronRight } from "lucide-react";
import { getAdminBreadcrumbTrail } from "@/lib/adminBreadcrumbs";

export function AdminBreadcrumbs() {
  const pathname = usePathname() || "";
  const t = useTranslations("Admin");
  const items = getAdminBreadcrumbTrail(pathname, t as (key: string) => string);

  if (items.length === 0) {
    return null;
  }

  return (
    <nav aria-label={t("adminBreadcrumbAriaLabel")} className="text-sm">
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
        {items.map((item, idx) => {
          const isLast = idx === items.length - 1;
          return (
            <li key={`${item.href}-${idx}`} className="flex items-center gap-2 min-w-0">
              {idx > 0 ? (
                <ChevronRight className="w-4 h-4 shrink-0 text-gray-400 dark:text-gray-500" aria-hidden />
              ) : null}
              {isLast ? (
                <span className="font-medium text-gray-900 dark:text-gray-100 truncate">{item.label}</span>
              ) : (
                <Link
                  href={item.href}
                  className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition truncate"
                >
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
