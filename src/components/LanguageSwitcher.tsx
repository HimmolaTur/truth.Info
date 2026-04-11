"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/navigation";
import { Globe } from "lucide-react";
import { useSession } from "next-auth/react";

const locales = [
  { code: "ru", name: "Русский" },
  { code: "en", name: "English" },
  { code: "uk", name: "Українська" },
  { code: "de", name: "Deutsch" },
];

export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const { status, update } = useSession();

  const changeLanguage = async (nextLocale: string) => {
    router.replace(pathname, { locale: nextLocale as typeof locale });
    if (status === "authenticated") {
      const res = await fetch("/api/forum/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ action: "set_locale", locale: nextLocale }),
      });
      if (res.ok) await update({ preferred_locale: nextLocale });
    }
  };

  return (
    <div className="relative group">
      <button
        className="flex items-center gap-1 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors text-sm font-medium text-gray-700 dark:text-gray-300 uppercase"
        aria-label="Select language"
      >
        <Globe className="w-4 h-4" />
        <span>{locale}</span>
      </button>

      {/* Dropdown menu */}
      <div className="absolute right-0 top-full pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
        <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-lg shadow-lg overflow-hidden min-w-[120px] py-1">
          {locales.map((l) => (
            <button
              key={l.code}
              onClick={() => changeLanguage(l.code)}
              className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                locale === l.code
                  ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-bold"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-800"
              }`}
            >
              {l.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
