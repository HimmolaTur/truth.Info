"use client";

import { AlertCircle, RefreshCcw, Home, Globe } from 'lucide-react';
import { useEffect, useState } from 'react';
import './globals.css';
import { ThemeProvider } from "@/components/ThemeProvider";
import { ThemeToggle } from "@/components/ThemeToggle";

function GlobalLangSwitcher() {
  const [open, setOpen] = useState(false);
  const locales = [
    { code: "ru", name: "Русский" },
    { code: "en", name: "English" },
    { code: "uk", name: "Українська" },
    { code: "de", name: "Deutsch" },
  ];

  return (
    <div className="relative group" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <button className="flex items-center gap-1 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors text-sm font-medium text-gray-700 dark:text-gray-300 uppercase">
        <Globe className="w-4 h-4" />
        <span>RU</span>
      </button>
      <div className={`absolute right-0 top-full pt-2 transition-all duration-200 z-50 ${open ? 'opacity-100 visible' : 'opacity-0 invisible'}`}>
        <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-lg shadow-lg overflow-hidden min-w-[120px] py-1">
          {locales.map((l) => (
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

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html suppressHydrationWarning>
      <body className="min-h-screen flex flex-col bg-gray-50 dark:bg-neutral-950 text-gray-900 dark:text-gray-100">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <header className="w-full p-4 flex justify-end items-center gap-4 border-b border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
            <ThemeToggle />
            <GlobalLangSwitcher />
          </header>
          <div className="flex flex-col items-center justify-center flex-1 px-4 text-center">
            <div className="bg-red-50 dark:bg-red-900/10 text-red-500 p-6 rounded-full mb-8">
              <AlertCircle className="w-20 h-20" />
            </div>
            <h1 className="text-6xl md:text-8xl font-extrabold text-gray-900 dark:text-white mb-4 tracking-tight">
              500
            </h1>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-gray-200 mb-4">
              Что-то пошло не так
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-lg mb-10">
              Произошла непредвиденная ошибка на сервере. Мы уже работаем над её устранением.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md justify-center">
              <button 
                onClick={reset}
                className="flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition shadow-sm"
              >
                <RefreshCcw className="w-5 h-5" />
                Попробовать снова
              </button>
              <a 
                href="/ru" 
                className="flex items-center justify-center gap-2 bg-white dark:bg-neutral-800 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-neutral-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-neutral-700 transition shadow-sm"
              >
                <Home className="w-5 h-5" />
                На главную
              </a>
            </div>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
