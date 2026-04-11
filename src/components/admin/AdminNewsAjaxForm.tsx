"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "@/navigation";
import { type FormEvent, type ReactNode, useState } from "react";

const NEWS_API = "/api/admin/news";

type Props = {
  mode: "create" | "update";
  newsId?: string;
  className?: string;
  children: ReactNode;
  /** After successful create, go to news list */
  afterCreate?: "list" | "stay";
};

export function AdminNewsAjaxForm({
  mode,
  newsId,
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
      const res = await fetch(NEWS_API, {
        method: "POST",
        body: fd,
        credentials: "include",
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setStatus("error");
        const code = data.error;
        if (code === "image_too_large") {
          setErrorMessage(t("adminNewsImageTooLarge"));
        } else if (code === "image_invalid_type") {
          setErrorMessage(t("adminNewsImageType"));
        } else {
          setErrorMessage(code || t("adminNewsSaveError"));
        }
        return;
      }
      setStatus("success");
      if (mode === "create" && afterCreate === "list") {
        router.push("/admin/news");
      }
      router.refresh();
    } catch {
      setStatus("error");
      setErrorMessage(t("adminNewsSaveError"));
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={`${className ?? ""}${status === "saving" ? " opacity-70 pointer-events-none" : ""}`}
    >
      <input type="hidden" name="action" value={mode === "create" ? "create" : "update"} />
      {mode === "update" && newsId != null ? <input type="hidden" name="id" value={newsId} /> : null}
      {children}
      {status === "success" ? (
        <p className="text-sm text-green-600 dark:text-green-400 pt-1">{t("adminNewsSaved")}</p>
      ) : null}
      {status === "error" && errorMessage ? (
        <p className="text-sm text-red-600 dark:text-red-400 pt-1">{errorMessage}</p>
      ) : null}
    </form>
  );
}
