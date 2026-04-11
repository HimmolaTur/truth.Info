"use client";

import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import { usePathname, useRouter } from "@/navigation";
import { useCallback, useState } from "react";
import { PRESET_AVATAR_URLS } from "@/lib/forumAvatars";
import { locales } from "@/navigation";

const PROFILE_API = "/api/forum/profile";

const LOCALE_LABELS: Record<string, string> = {
  ru: "Русский",
  en: "English",
  uk: "Українська",
  de: "Deutsch",
};

type Props = {
  initialAvatarUrl: string;
  initialPreferredLocale: string | null;
};

export function ProfileSettingsPanel({ initialAvatarUrl, initialPreferredLocale }: Props) {
  const t = useTranslations("Forum");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const { update } = useSession();

  const [avatar, setAvatar] = useState(initialAvatarUrl);
  const [avatarStatus, setAvatarStatus] = useState<"idle" | "saving" | "ok" | "err">("idle");

  const [pwdCurrent, setPwdCurrent] = useState("");
  const [pwdNew, setPwdNew] = useState("");
  const [pwdStatus, setPwdStatus] = useState<"idle" | "saving" | "ok" | "err">("idle");
  const [pwdErr, setPwdErr] = useState<string | null>(null);

  const [lang, setLang] = useState(initialPreferredLocale || locale);
  const [langStatus, setLangStatus] = useState<"idle" | "saving" | "ok" | "err">("idle");

  const saveAvatar = useCallback(
    async (next: string) => {
      setAvatar(next);
      setAvatarStatus("saving");
      try {
        const res = await fetch(PROFILE_API, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ action: "set_avatar", avatar_url: next }),
        });
        const data = (await res.json().catch(() => ({}))) as { ok?: boolean };
        if (!res.ok || !data.ok) {
          setAvatarStatus("err");
          return;
        }
        setAvatarStatus("ok");
        await update({ avatar_url: next });
        router.refresh();
      } catch {
        setAvatarStatus("err");
      }
    },
    [router, update]
  );

  const submitPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdStatus("saving");
    setPwdErr(null);
    try {
      const res = await fetch(PROFILE_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          action: "change_password",
          current_password: pwdCurrent,
          new_password: pwdNew,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setPwdStatus("err");
        if (data.error === "current_password_wrong") setPwdErr(t("profilePwdWrongCurrent"));
        else if (data.error === "password_short") setPwdErr(t("profilePwdTooShort"));
        else setPwdErr(t("profilePwdError"));
        return;
      }
      setPwdStatus("ok");
      setPwdCurrent("");
      setPwdNew("");
    } catch {
      setPwdStatus("err");
      setPwdErr(t("profilePwdError"));
    }
  };

  const saveLocale = async (next: string) => {
    setLang(next);
    setLangStatus("saving");
    try {
      const res = await fetch(PROFILE_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ action: "set_locale", locale: next }),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean };
      if (!res.ok || !data.ok) {
        setLangStatus("err");
        return;
      }
      setLangStatus("ok");
      await update({ preferred_locale: next });
      router.replace(pathname, { locale: next as typeof locale });
      router.refresh();
    } catch {
      setLangStatus("err");
    }
  };

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-2xl border shadow-sm p-6 space-y-8 text-left">
      <div>
        <h2 className="text-lg font-bold mb-3">{t("profileAvatarTitle")}</h2>
        <div className="grid grid-cols-5 sm:grid-cols-5 gap-2">
          {PRESET_AVATAR_URLS.map((src) => (
            <button
              key={src}
              type="button"
              onClick={() => void saveAvatar(src)}
              disabled={avatarStatus === "saving"}
              className={`relative rounded-full overflow-hidden border-2 transition-all aspect-square ${
                avatar === src
                  ? "border-blue-500 ring-2 ring-blue-300 scale-105"
                  : "border-transparent hover:border-blue-400"
              } disabled:opacity-50`}
            >
              <Image src={src} alt="" width={56} height={56} className="bg-gray-100 dark:bg-neutral-800 w-full h-full object-cover" />
            </button>
          ))}
        </div>
        {avatarStatus === "ok" ? (
          <p className="text-xs text-green-600 dark:text-green-400 mt-2">{t("profileSaved")}</p>
        ) : null}
        {avatarStatus === "err" ? (
          <p className="text-xs text-red-600 dark:text-red-400 mt-2">{t("profileAvatarError")}</p>
        ) : null}
      </div>

      <div>
        <h2 className="text-lg font-bold mb-3">{t("profileLanguageTitle")}</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">{t("profileLanguageHint")}</p>
        <select
          value={lang}
          onChange={(e) => void saveLocale(e.target.value)}
          disabled={langStatus === "saving"}
          className="w-full border rounded-md px-3 py-2 bg-gray-50 dark:bg-neutral-800 disabled:opacity-60"
        >
          {locales.map((code) => (
            <option key={code} value={code}>
              {LOCALE_LABELS[code] ?? code}
            </option>
          ))}
        </select>
        {langStatus === "ok" ? (
          <p className="text-xs text-green-600 dark:text-green-400 mt-2">{t("profileSaved")}</p>
        ) : null}
        {langStatus === "err" ? (
          <p className="text-xs text-red-600 dark:text-red-400 mt-2">{t("profileLanguageError")}</p>
        ) : null}
      </div>

      <div>
        <h2 className="text-lg font-bold mb-3">{t("profilePasswordTitle")}</h2>
        <form onSubmit={submitPassword} className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1">{t("profilePasswordCurrent")}</label>
            <input
              type="password"
              autoComplete="current-password"
              value={pwdCurrent}
              onChange={(e) => setPwdCurrent(e.target.value)}
              className="w-full border rounded-md px-3 py-2 bg-gray-50 dark:bg-neutral-800"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t("profilePasswordNew")}</label>
            <input
              type="password"
              autoComplete="new-password"
              value={pwdNew}
              onChange={(e) => setPwdNew(e.target.value)}
              className="w-full border rounded-md px-3 py-2 bg-gray-50 dark:bg-neutral-800"
            />
          </div>
          <button
            type="submit"
            disabled={pwdStatus === "saving" || !pwdCurrent || !pwdNew}
            className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50"
          >
            {t("profilePasswordSubmit")}
          </button>
        </form>
        {pwdStatus === "ok" ? (
          <p className="text-xs text-green-600 dark:text-green-400 mt-2">{t("profilePwdSuccess")}</p>
        ) : null}
        {pwdErr ? <p className="text-xs text-red-600 dark:text-red-400 mt-2">{pwdErr}</p> : null}
      </div>
    </div>
  );
}
