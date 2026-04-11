"use client";

import { AlertTriangle, Home, Search } from "lucide-react";
import "@/app/globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ThemeToggle } from "@/components/ThemeToggle";
import { RootShellLangSwitcher } from "@/components/root/RootShellLangSwitcher";
import { rootShellCopy } from "@/lib/rootShellMessages";
import type { AppLocale } from "@/navigation";

export function GlobalNotFoundClient({ locale }: { locale: AppLocale }) {
  const t = rootShellCopy(locale).NotFound;

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
              <AlertTriangle className="w-20 h-20" />
            </div>
            <h1 className="text-6xl md:text-8xl font-extrabold text-gray-900 dark:text-white mb-4 tracking-tight">
              404
            </h1>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-gray-200 mb-4">{t.title}</h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-lg mb-10">{t.desc}</p>

            <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md justify-center">
              <a
                href={`/${locale}`}
                className="flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition shadow-sm"
              >
                <Home className="w-5 h-5" />
                {t.backHome}
              </a>
              <a
                href={`/${locale}/news`}
                className="flex items-center justify-center gap-2 bg-white dark:bg-neutral-800 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-neutral-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-neutral-700 transition shadow-sm"
              >
                <Search className="w-5 h-5" />
                {t.search}
              </a>
            </div>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
