"use client";

import { useRouter } from "@/navigation";
import { type FormEvent, type ReactNode, useState } from "react";

const API = "/api/forum/topic";

export function ForumTopicAjaxForm({
  topicId,
  forumAction,
  className,
  children,
  /** If set, called after success instead of router.refresh() (client data refresh). */
  onAfterSuccess,
}: {
  topicId: number;
  forumAction: string;
  className?: string;
  children: ReactNode;
  onAfterSuccess?: () => void | Promise<void>;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    const fd = new FormData(e.currentTarget);
    fd.set("topic_id", String(topicId));
    fd.set("forum_action", forumAction);
    try {
      const res = await fetch(API, { method: "POST", body: fd, credentials: "include" });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        needLogin?: boolean;
      };
      if (data.needLogin) {
        router.push("/forum/login");
        return;
      }
      if (res.ok && data.ok === true) {
        if (onAfterSuccess) {
          await onAfterSuccess();
        } else {
          router.refresh();
        }
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className={[className, pending ? "opacity-60 pointer-events-none" : ""].filter(Boolean).join(" ")}
    >
      {children}
    </form>
  );
}
