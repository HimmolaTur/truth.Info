"use client";

import { Quote } from "lucide-react";
import { useTranslations } from "next-intl";

export function QuoteButton({ content, size = "md" }: { content: string; size?: "sm" | "md" }) {
  const t = useTranslations("Ui");
  const iconClass = size === "sm" ? "w-3 h-3" : "w-4 h-4";
  const textClass = size === "sm" ? "text-xs" : "text-sm";

  return (
    <button
      type="button"
      className={`flex items-center gap-1 text-gray-500 hover:text-blue-600 transition ${textClass}`}
      title={t("quoteTitle")}
      onClick={(e) => {
        e.preventDefault();
        const ta = document.getElementById("comment-textarea") as HTMLTextAreaElement;
        if (ta) {
          ta.value += "> " + content.split("\n").join("\n> ") + "\n\n";
          ta.focus();
        }
      }}
    >
      <Quote className={iconClass} />
    </button>
  );
}
