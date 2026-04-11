"use client";

import { useRouter } from "@/navigation";
import { type FormEvent, type ReactNode, useTransition } from "react";

/**
 * Client GET search: builds `basePath?...` and navigates via router (shows route loading UI).
 */
export function LocaleGetSearchForm({
  basePath,
  className,
  children,
}: {
  basePath: string;
  className?: string;
  children: ReactNode;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const q = new URLSearchParams();
    fd.forEach((v, k) => {
      if (v !== "" && v != null) q.set(k, String(v));
    });
    const qs = q.toString();
    startTransition(() => {
      router.push(`${basePath}${qs ? `?${qs}` : ""}`);
    });
  }

  return (
    <form
      onSubmit={onSubmit}
      className={`${className ?? ""}${pending ? " opacity-70 pointer-events-none" : ""}`}
    >
      {children}
    </form>
  );
}
