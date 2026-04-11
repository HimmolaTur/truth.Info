import type { ReactNode } from "react";
import { getLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import { AdminBreadcrumbs } from "@/components/admin/AdminBreadcrumbs";
import { getAdminJwtSession } from "@/lib/adminSession";

export default async function AdminProtectedLayout({
  children,
}: {
  children: ReactNode;
}) {
  const locale = await getLocale();
  const session = await getAdminJwtSession();
  if (!session) {
    redirect(`/${locale}`);
  }
  return (
    <>
      <div className="border-b border-gray-200 dark:border-neutral-800 bg-gray-50/90 dark:bg-neutral-900/60">
        <div className="max-w-5xl mx-auto w-full px-4 py-3">
          <AdminBreadcrumbs />
        </div>
      </div>
      {children}
    </>
  );
}
