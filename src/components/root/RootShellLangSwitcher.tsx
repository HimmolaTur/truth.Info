"use client";

import { Globe } from "lucide-react";
import { useState } from "react";
import type { AppLocale } from "@/navigation";

const localeList: { code: AppLocale; name: string }[] = [
  { code: "ru", name: "Русский" },
  { code: "en", name: "English" },
  { code: "uk", name: "Українська" },
  { code: "de", name: "Deutsch" },
];

export function RootShellLangSwitcher({ currentLocale }: { currentLocale: AppLocale }) {
  const [open, setOpen] = useState(false);

  return (
    <div
      className="relative group"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        className="flex items-center gap-1 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors text-sm font-medium text-gray-700 dark:text-gray-300 uppercase"
      >
        <Globe className="w-4 h-4" />
        <span>{currentLocale}</span>
      </button>
      <div
        className={`absolute right-0 top-full pt-2 transition-all duration-200 z-50 ${open ? "opacity-100 visible" : "opacity-0 invisible"}`}
      >
        <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-lg shadow-lg overflow-hidden min-w-[120px] py-1">
          {localeList.map((l) => (
            <a
              key={l.code}
              href={`/${l.code}`}
              className="block w-full text-left px-4 py-2 text-sm transition-colors text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-800"
            >
              {l.name}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
