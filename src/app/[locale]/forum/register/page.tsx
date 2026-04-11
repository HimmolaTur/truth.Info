"use client";

import { useState } from "react";
import { Link, useRouter } from "@/navigation";
import Image from "next/image";
import { signIn } from "next-auth/react";
import { useLocale, useTranslations } from "next-intl";
import { PRESET_AVATAR_URLS } from "@/lib/forumAvatars";

const AVATARS = [...PRESET_AVATAR_URLS];

function translateRegisterError(
  raw: string | undefined,
  t: ReturnType<typeof useTranslations<"Forum">>
): string {
  switch (raw) {
    case "register_required_fields":
      return t("registerRequiredFields");
    case "register_username_short":
      return t("registerUsernameShort");
    case "register_password_short":
      return t("registerPasswordShort");
    case "register_username_taken":
      return t("registerUsernameTaken");
    case "register_server_error":
      return t("registerServerError");
    default:
      return t("authRegisterError");
  }
}

export default function RegisterPage() {
  const t = useTranslations("Forum");
  const router = useRouter();
  const pageLocale = useLocale();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState(AVATARS[0]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          password,
          avatar_url: selectedAvatar,
          preferred_locale: pageLocale,
        }),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(translateRegisterError(data.error, t));
      }

      const signRes = await signIn("credentials", {
        username: username.trim(),
        password,
        redirect: false,
      });
      if (signRes?.error) {
        throw new Error(t("authCreatedSignInManually"));
      }

      router.push("/forum");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t("authRegisterError"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 py-12">
      <div className="w-full max-w-md bg-white dark:bg-neutral-900 rounded-2xl shadow-lg border p-6 sm:p-8">
        <h1 className="text-2xl font-bold text-center mb-6">{t("authRegisterTitle")}</h1>

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
              placeholder={t("authUsernamePlaceholderRegister")}
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
              placeholder={t("authPasswordPlaceholderRegister")}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">{t("authPickAvatar")}</label>
            <div className="grid grid-cols-5 gap-2">
              {AVATARS.map((avatar, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedAvatar(avatar)}
                  className={`relative rounded-full overflow-hidden border-2 transition-all ${
                    selectedAvatar === avatar
                      ? "border-blue-500 scale-110 shadow-md"
                      : "border-transparent hover:border-blue-400 hover:scale-105"
                  }`}
                >
                  <Image
                    src={avatar}
                    alt=""
                    width={60}
                    height={60}
                    className="bg-gray-100 dark:bg-neutral-800"
                  />
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-2 text-center">{t("authAvatarAuto")}</p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 mt-6"
          >
            {loading ? t("authSubmittingRegister") : t("authSubmitRegister")}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-500">
          {t("authHasAccount")}{" "}
          <Link href="/forum/login" className="text-blue-600 hover:underline font-medium">
            {t("authLogin")}
          </Link>
        </div>
      </div>
    </div>
  );
}
