"use client";

import { signOut } from "next-auth/react";
import { useLocale, useTranslations } from "next-intl";
import { LogOut } from "lucide-react";

export function SignOutButton({ label }: { label?: string }) {
  const locale = useLocale();
  const t = useTranslations("Navbar");
  const displayLabel = label ?? t("signOut");

  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: `/${locale}` })}
      className="w-full inline-flex items-center justify-center gap-2 bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40 px-4 py-2.5 rounded-xl font-bold transition border border-red-100 dark:border-red-900/30"
    >
      <LogOut className="w-4 h-4" />
      {displayLabel}
    </button>
  );
}

