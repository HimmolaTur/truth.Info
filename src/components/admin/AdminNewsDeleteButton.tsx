"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "@/navigation";
import { useState } from "react";

const NEWS_API = "/api/admin/news";

export function AdminNewsDeleteButton({ newsId }: { newsId: number }) {
  const t = useTranslations("Admin");
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleClick() {
    if (!window.confirm(t("adminNewsDeleteConfirm"))) return;
    setPending(true);
    const fd = new FormData();
    fd.set("action", "delete");
    fd.set("id", String(newsId));
    try {
      const res = await fetch(NEWS_API, {
        method: "POST",
        body: fd,
        credentials: "include",
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (res.ok && data.ok) {
        router.push("/admin/news");
      } else {
        window.alert(data.error || t("adminNewsSaveError"));
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      className="text-red-600 text-sm font-medium disabled:opacity-50"
    >
      {t("delete")}
    </button>
  );
}
