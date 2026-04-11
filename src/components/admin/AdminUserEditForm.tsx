"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { useRouter } from "@/navigation";
import { type FormEvent, useState } from "react";
import { normalizePresetAvatarUrl, PRESET_AVATAR_URLS } from "@/lib/forumAvatars";

const USERS_API = "/api/admin/users";

export type RoleOption = { id: number; name: string; slug: string };

type Props = {
  userId: number;
  displayNameReadonly: string;
  defaultAvatarUrl: string;
  roles: RoleOption[];
  defaultRoleId: number;
};

export function AdminUserEditForm({
  userId,
  displayNameReadonly,
  defaultAvatarUrl,
  roles,
  defaultRoleId,
}: Props) {
  const t = useTranslations("Admin");
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "saving" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [avatar, setAvatar] = useState(() => normalizePresetAvatarUrl(defaultAvatarUrl));

  function mapError(code: string | undefined): string {
    if (code === "last_roles_manager") return t("adminUserLastRolesManager");
    if (code === "not_found") return t("adminUserNotFound");
    if (code === "password_short") return t("adminUserPasswordShort");
    if (code === "invalid_role") return t("adminUserInvalidRole");
    if (code === "invalid_avatar") return t("adminUserInvalidAvatar");
    return code || t("adminUserSaveError");
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("saving");
    setErrorMessage(null);
    const form = e.currentTarget;
    const fd = new FormData(form);
    const newPassword = String(fd.get("new_password") ?? "");
    const roleId = parseInt(String(fd.get("role_id") ?? ""), 10);

    try {
      const res = await fetch(USERS_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          action: "update",
          id: userId,
          role_id: roleId,
          avatar_url: avatar,
          new_password: newPassword.length > 0 ? newPassword : "",
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setStatus("error");
        setErrorMessage(mapError(data.error));
        return;
      }
      setStatus("success");
      router.refresh();
    } catch {
      setStatus("error");
      setErrorMessage(t("adminUserSaveError"));
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={`space-y-4${status === "saving" ? " opacity-70 pointer-events-none" : ""}`}
    >
      <div className="rounded-md border border-gray-200 dark:border-neutral-700 px-3 py-2 bg-gray-50 dark:bg-neutral-800/50">
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t("adminUserDisplayName")}</p>
        <p className="font-mono text-sm text-gray-900 dark:text-gray-100">{displayNameReadonly || "—"}</p>
        <p className="text-xs text-gray-500 mt-1">{t("adminUserDisplayNameReadonlyHint")}</p>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">{t("adminUserAvatarPick")}</label>
        <div className="grid grid-cols-5 gap-2 max-w-md">
          {PRESET_AVATAR_URLS.map((src) => (
            <button
              key={src}
              type="button"
              onClick={() => setAvatar(src)}
              className={`relative rounded-full overflow-hidden border-2 aspect-square transition ${
                avatar === src ? "border-blue-500 ring-2 ring-blue-300" : "border-transparent hover:border-blue-400"
              }`}
            >
              <Image src={src} alt="" width={56} height={56} className="bg-gray-100 dark:bg-neutral-800 w-full h-full object-cover" />
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">{t("adminUserRole")}</label>
        <select
          name="role_id"
          defaultValue={defaultRoleId}
          className="w-full border rounded-md px-3 py-2 bg-gray-50 dark:bg-neutral-800"
        >
          {roles.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name} ({r.slug})
            </option>
          ))}
        </select>
        <p className="text-xs text-gray-500 mt-1">{t("adminUserRoleHintRbac")}</p>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">{t("adminUserNewPassword")}</label>
        <input
          name="new_password"
          type="password"
          autoComplete="new-password"
          placeholder="••••••"
          className="w-full border rounded-md px-3 py-2 bg-gray-50 dark:bg-neutral-800"
        />
        <p className="text-xs text-gray-500 mt-1">{t("adminUserNewPasswordHint")}</p>
      </div>

      <div>
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-md">
          {t("save")}
        </button>
      </div>

      {status === "success" ? (
        <p className="text-sm text-green-600 dark:text-green-400">{t("adminUserSaved")}</p>
      ) : null}
      {status === "error" && errorMessage ? (
        <p className="text-sm text-red-600 dark:text-red-400">{errorMessage}</p>
      ) : null}
    </form>
  );
}
