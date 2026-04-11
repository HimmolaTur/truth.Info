"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "@/navigation";
import { type FormEvent, type ReactNode, useState } from "react";

const API = "/api/admin/factcheck";

type Props = {
  mode: "create" | "update";
  factId?: string;
  className?: string;
  children: ReactNode;
  afterCreate?: "list" | "stay";
};

export function AdminFactcheckAjaxForm({
  mode,
  factId,
  className,
  children,
  afterCreate = "list",
}: Props) {
  const t = useTranslations("Admin");
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "saving" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("saving");
    setErrorMessage(null);
    const form = e.currentTarget;
    const fd = new FormData(form);

    try {
      const res = await fetch(API, {
        method: "POST",
        body: fd,
        credentials: "include",
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setStatus("error");
        setErrorMessage(data.error || t("adminFactSaveError"));
        return;
      }
      setStatus("success");
      if (mode === "create" && afterCreate === "list") {
        router.push("/admin/factcheck");
      }
      router.refresh();
    } catch {
      setStatus("error");
      setErrorMessage(t("adminFactSaveError"));
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={`${className ?? ""}${status === "saving" ? " opacity-70 pointer-events-none" : ""}`}
    >
      <input type="hidden" name="action" value={mode === "create" ? "create" : "update"} />
      {mode === "update" && factId != null ? <input type="hidden" name="id" value={factId} /> : null}
      {children}
      {status === "success" ? (
        <p className="text-sm text-green-600 dark:text-green-400 pt-1">{t("adminFactSaved")}</p>
      ) : null}
      {status === "error" && errorMessage ? (
        <p className="text-sm text-red-600 dark:text-red-400 pt-1">{errorMessage}</p>
      ) : null}
    </form>
  );
}
