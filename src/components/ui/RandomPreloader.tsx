"use client";

import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

const PRELOADER_KEYS = ["preloader0", "preloader1", "preloader2", "preloader3", "preloader4", "preloader5"] as const;

type Props = {
  className?: string;
  /** compact inline row */
  size?: "sm" | "md";
};

export function RandomPreloader({ className, size = "md" }: Props) {
  const t = useTranslations("Ui");
  const [preloaderKey] = useState(() => PRELOADER_KEYS[Math.floor(Math.random() * PRELOADER_KEYS.length)]);
  const message = t(preloaderKey);
  const isSm = size === "sm";

  return (
    <div
      className={`flex items-center gap-3 text-gray-600 dark:text-gray-300 ${isSm ? "text-sm" : "text-base"} ${className ?? ""}`}
      role="status"
      aria-live="polite"
    >
      <Loader2 className={`${isSm ? "w-4 h-4" : "w-6 h-6"} animate-spin shrink-0 text-blue-600 dark:text-blue-400`} />
      <span className="font-medium">{message}</span>
    </div>
  );
}

/** Full-area overlay for in-place refetch */
export function RandomPreloaderOverlay({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/70 dark:bg-neutral-950/60 backdrop-blur-[2px] rounded-[inherit]">
      <div className="rounded-xl border border-gray-200 dark:border-neutral-700 bg-white/95 dark:bg-neutral-900/95 px-6 py-4 shadow-lg">
        <RandomPreloader />
      </div>
    </div>
  );
}
