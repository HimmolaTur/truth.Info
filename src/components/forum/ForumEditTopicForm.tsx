"use client";

import { useRouter } from "@/navigation";
import { type FormEvent, type ReactNode, useState } from "react";

export function ForumEditTopicForm({
  topicId,
  className,
  children,
}: {
  topicId: number;
  className?: string;
  children: ReactNode;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setErrorMessage(null);
    const fd = new FormData(e.currentTarget);
    fd.set("topic_id", String(topicId));
    try {
      const res = await fetch("/api/forum/edit-topic", {
        method: "POST",
        body: fd,
        credentials: "include",
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        redirect?: string;
        error?: string;
      };
      if (data.redirect) {
        router.push(data.redirect);
        router.refresh();
        return;
      }
      if (!res.ok || !data.ok) {
        setErrorMessage(data.error || "error");
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className={`${className ?? ""}${pending ? " opacity-60 pointer-events-none" : ""}`}
    >
      {errorMessage ? (
        <p className="text-sm text-red-600 dark:text-red-400 mb-2">{errorMessage}</p>
      ) : null}
      {children}
    </form>
  );
}
