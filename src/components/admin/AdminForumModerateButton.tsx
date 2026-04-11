"use client";

import { useRouter } from "@/navigation";
import { useState, type ReactNode } from "react";

const API = "/api/admin/forum/moderate";

type Action =
  | "delete_post"
  | "delete_topic"
  | "close_topic"
  | "open_topic"
  | "pin_topic"
  | "unpin_topic";

export function AdminForumModerateButton({
  action,
  postId,
  topicId,
  className,
  children,
  onAfterSuccess,
  confirmMessage,
  title,
}: {
  action: Action;
  postId?: string;
  topicId?: string;
  className?: string;
  children: ReactNode;
  /** When set (e.g. thread client refetch), skips full page refresh */
  onAfterSuccess?: () => void;
  confirmMessage?: string;
  title?: string;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleClick() {
    if (confirmMessage && typeof window !== "undefined" && !window.confirm(confirmMessage)) return;
    setPending(true);
    const fd = new FormData();
    fd.set("action", action);
    if (postId != null) fd.set("post_id", postId);
    if (topicId != null) fd.set("topic_id", topicId);
    try {
      const res = await fetch(API, { method: "POST", body: fd, credentials: "include" });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean };
      if (res.ok && data.ok) {
        onAfterSuccess?.();
        if (!onAfterSuccess) router.refresh();
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      type="button"
      title={title}
      onClick={handleClick}
      disabled={pending}
      className={`${className ?? ""} disabled:opacity-50`}
    >
      {children}
    </button>
  );
}
