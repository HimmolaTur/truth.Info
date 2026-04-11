"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "@/navigation";
import { type FormEvent, useState } from "react";

const ROLES_API = "/api/admin/roles";

export function AdminRoleCreateForm() {
  const t = useTranslations("Admin");
  const router = useRouter();
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr(null);
    const fd = new FormData(e.currentTarget);
    const slug = String(fd.get("slug") ?? "").trim();
    const name = String(fd.get("name") ?? "").trim();
    try {
      const res = await fetch(ROLES_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ action: "create", slug, name }),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; id?: number; error?: string };
      if (!res.ok || !data.ok || data.id == null) {
        if (data.error === "slug_taken") setErr(t("adminRolesSlugTaken"));
        else if (data.error === "invalid_slug") setErr(t("adminRolesInvalidSlug"));
        else setErr(t("adminRolesSaveError"));
        return;
      }
      router.push(`/admin/roles/edit/${data.id}`);
    } catch {
      setErr(t("adminRolesSaveError"));
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">{t("adminRolesSlug")}</label>
        <input
          name="slug"
          required
          pattern="[a-z0-9_-]{2,32}"
          className="w-full border rounded-md px-3 py-2 bg-gray-50 dark:bg-neutral-800 font-mono text-sm"
          placeholder="support_lead"
        />
        <p className="text-xs text-gray-500 mt-1">{t("adminRolesSlugHint")}</p>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">{t("adminRolesName")}</label>
        <input name="name" required className="w-full border rounded-md px-3 py-2 bg-gray-50 dark:bg-neutral-800" />
      </div>
      <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-md">
        {t("create")}
      </button>
      {err ? <p className="text-sm text-red-600">{err}</p> : null}
    </form>
  );
}
