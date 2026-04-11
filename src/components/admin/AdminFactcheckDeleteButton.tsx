"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "@/navigation";
import { useState } from "react";

const API = "/api/admin/factcheck";

export function AdminFactcheckDeleteButton({ factId }: { factId: number }) {
  const t = useTranslations("Admin");
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleClick() {
    if (!window.confirm(t("adminFactDeleteConfirm"))) return;
    setPending(true);
    const fd = new FormData();
    fd.set("action", "delete");
    fd.set("id", String(factId));
    try {
      const res = await fetch(API, {
        method: "POST",
        body: fd,
        credentials: "include",
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (res.ok && data.ok) {
        router.push("/admin/factcheck");
      } else {
        window.alert(data.error || t("adminFactSaveError"));
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
      className="text-red-600 text-sm disabled:opacity-50"
    >
      {t("delete")}
    </button>
  );
}
