"use client";

import { RandomPreloader } from "@/components/ui/RandomPreloader";

export default function LocaleLoading() {
  return (
    <div className="max-w-5xl mx-auto w-full px-4 sm:px-6 py-12" aria-busy="true" aria-label="Loading">
      <RandomPreloader className="mb-8" />
      <div className="space-y-4 animate-pulse">
        <div className="h-10 w-48 bg-gray-200 dark:bg-neutral-700 rounded-md" />
        <div className="h-32 bg-gray-100 dark:bg-neutral-800 rounded-xl border border-gray-200 dark:border-neutral-700" />
        <div className="h-32 bg-gray-100 dark:bg-neutral-800 rounded-xl border border-gray-200 dark:border-neutral-700" />
        <div className="h-32 bg-gray-100 dark:bg-neutral-800 rounded-xl border border-gray-200 dark:border-neutral-700" />
      </div>
    </div>
  );
}
