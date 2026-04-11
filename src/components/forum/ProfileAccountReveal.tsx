"use client";

import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";

const PROFILE_API = "/api/forum/profile";

/** Логин и дата регистрации — только для владельца, после ввода своего пароля. */
export function ProfileAccountReveal() {
  const t = useTranslations("Forum");
  const locale = useLocale();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const [createdAt, setCreatedAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function reveal(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(PROFILE_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ action: "reveal_account_info", password }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
        username?: string;
        created_at?: string;
      };
      if (!res.ok || !data.ok) {
        if (data.error === "wrong_password") setError(t("profileRevealWrongPassword"));
        else setError(t("profileRevealError"));
        return;
      }
      setUsername(data.username ?? null);
      setCreatedAt(data.created_at ?? null);
      setPassword("");
    } catch {
      setError(t("profileRevealError"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-xl border border-gray-200 dark:border-neutral-700 bg-gray-50/80 dark:bg-neutral-800/40 p-4 text-left space-y-3">
      <h2 className="text-sm font-bold text-gray-900 dark:text-gray-100">{t("profileRevealTitle")}</h2>
      <p className="text-xs text-gray-500 dark:text-gray-400">{t("profileRevealHint")}</p>

      {username != null && createdAt != null ? (
        <div className="text-sm space-y-2 pt-1">
          <p>
            <span className="text-gray-500 dark:text-gray-400">{t("profileRevealLogin")}:</span>{" "}
            <span className="font-mono font-semibold text-gray-900 dark:text-gray-100">{username}</span>
          </p>
          <p>
            <span className="text-gray-500 dark:text-gray-400">{t("profileRevealCreated")}:</span>{" "}
            {new Date(createdAt).toLocaleString(locale)}
          </p>
        </div>
      ) : (
        <form onSubmit={reveal} className="space-y-2">
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              {t("profileRevealPasswordLabel")}
            </label>
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border rounded-md px-3 py-2 text-sm bg-white dark:bg-neutral-900"
              placeholder="••••••"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !password}
            className="w-full bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 py-2 rounded-md text-sm font-medium disabled:opacity-50"
          >
            {t("profileRevealSubmit")}
          </button>
        </form>
      )}

      {error ? <p className="text-xs text-red-600 dark:text-red-400">{error}</p> : null}
    </div>
  );
}
