"use client";

import { AlertCircle, RefreshCcw, Home } from "lucide-react";
import { useEffect, useLayoutEffect, useState } from "react";
import "@/app/globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ThemeToggle } from "@/components/ThemeToggle";
import { RootShellLangSwitcher } from "@/components/root/RootShellLangSwitcher";
import { rootShellCopy } from "@/lib/rootShellMessages";
import { defaultLocale, normalizeAppLocale, type AppLocale } from "@/navigation";

function readBrowserLocale(): AppLocale {
  if (typeof document === "undefined") return defaultLocale;
  const m = document.cookie.match(/(?:^|;\s*)NEXT_LOCALE=([^;]*)/);
  const raw = m?.[1] ? decodeURIComponent(m[1]) : "";
  return normalizeAppLocale(raw);
}

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [locale, setLocale] = useState<AppLocale>(defaultLocale);

  useLayoutEffect(() => {
    setLocale(readBrowserLocale());
  }, []);

  useEffect(() => {
    console.error(error);
  }, [error]);

  const t = rootShellCopy(locale).Error;

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className="min-h-screen flex flex-col bg-gray-50 dark:bg-neutral-950 text-gray-900 dark:text-gray-100">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <header className="w-full p-4 flex justify-end items-center gap-4 border-b border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
            <ThemeToggle />
            <RootShellLangSwitcher currentLocale={locale} />
          </header>
          <div className="flex flex-col items-center justify-center flex-1 px-4 text-center">
            <div className="bg-red-50 dark:bg-red-900/10 text-red-500 p-6 rounded-full mb-8">
              <AlertCircle className="w-20 h-20" />
            </div>
            <h1 className="text-6xl md:text-8xl font-extrabold text-gray-900 dark:text-white mb-4 tracking-tight">
              500
            </h1>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-gray-200 mb-4">{t.title}</h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-lg mb-10">{t.desc}</p>

            <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md justify-center">
              <button
                type="button"
                onClick={reset}
                className="flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition shadow-sm"
              >
                <RefreshCcw className="w-5 h-5" />
                {t.tryAgain}
              </button>
              <a
                href={`/${locale}`}
                className="flex items-center justify-center gap-2 bg-white dark:bg-neutral-800 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-neutral-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-neutral-700 transition shadow-sm"
              >
                <Home className="w-5 h-5" />
                {t.backHome}
              </a>
            </div>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
