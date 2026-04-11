"use client";

import { useState } from "react";
import { Link, useRouter } from "@/navigation";
import { signIn } from "next-auth/react";
import { useTranslations } from "next-intl";

export default function LoginPage() {
  const t = useTranslations("Forum");
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await signIn("credentials", {
        username: username.trim(),
        password,
        redirect: false,
      });

      if (res?.error) {
        throw new Error(t("authInvalidCredentials"));
      }

      router.push("/forum");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t("authErrorGeneric"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 py-12">
      <div className="w-full max-w-md bg-white dark:bg-neutral-900 rounded-2xl shadow-lg border p-6 sm:p-8">
        <h1 className="text-2xl font-bold text-center mb-6">{t("authLoginTitle")}</h1>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4 border border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-900">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">{t("authUsername")}</label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full border rounded-lg px-4 py-2.5 bg-gray-50 dark:bg-neutral-800 focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder={t("authUsernamePlaceholderLogin")}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">{t("authPassword")}</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border rounded-lg px-4 py-2.5 bg-gray-50 dark:bg-neutral-800 focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder={t("authPasswordPlaceholderLogin")}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
          >
            {loading ? t("authSubmittingLogin") : t("authSubmitLogin")}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-500">
          {t("authNoAccount")}{" "}
          <Link href="/forum/register" className="text-blue-600 hover:underline font-medium">
            {t("authRegister")}
          </Link>
        </div>
      </div>
    </div>
  );
}
