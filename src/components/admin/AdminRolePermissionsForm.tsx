"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "@/navigation";
import { useMemo, useState } from "react";
import { PERMISSION_KEYS } from "@/lib/permissions";

const ROLES_API = "/api/admin/roles";

function permMessageKey(key: string): string {
  return `adminPerm_${key.replace(/\./g, "_")}` as const;
}

type Props = {
  roleId: number;
  slug: string;
  initialKeys: string[];
  locked: boolean;
};

export function AdminRolePermissionsForm({ roleId, slug, initialKeys, locked }: Props) {
  const t = useTranslations("Admin");
  const router = useRouter();
  const [keys, setKeys] = useState<Set<string>>(() => new Set(initialKeys));
  const [status, setStatus] = useState<"idle" | "saving" | "error">("idle");
  const [err, setErr] = useState<string | null>(null);

  const catalog = useMemo(() => [...PERMISSION_KEYS], []);

  function toggle(k: string) {
    if (locked) return;
    setKeys((prev) => {
      const n = new Set(prev);
      if (n.has(k)) n.delete(k);
      else n.add(k);
      return n;
    });
  }

  async function save() {
    if (locked) return;
    setStatus("saving");
    setErr(null);
    try {
      const res = await fetch(ROLES_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          action: "update_permissions",
          role_id: roleId,
          permission_keys: [...keys],
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setStatus("error");
        setErr(data.error || "error");
        return;
      }
      router.refresh();
      setStatus("idle");
    } catch {
      setStatus("error");
      setErr("network");
    }
  }

  if (locked) {
    return (
      <p className="text-sm text-gray-600 dark:text-gray-400 border rounded-md px-3 py-2 bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900">
        {slug === "admin" ? t("adminRolesLockedAdmin") : t("adminRolesLockedUser")}
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <ul className="space-y-2 border rounded-md p-4 bg-white dark:bg-neutral-900">
        {catalog.map((k) => (
          <li key={k} className="flex items-start gap-3">
            <input
              type="checkbox"
              id={`perm-${roleId}-${k}`}
              checked={keys.has(k)}
              onChange={() => toggle(k)}
              className="mt-1 rounded border-gray-300"
            />
            <label htmlFor={`perm-${roleId}-${k}`} className="text-sm cursor-pointer">
              <span className="font-mono text-xs text-gray-500 block">{k}</span>
              <span className="text-gray-900 dark:text-gray-100">
                {(t as (key: string) => string)(permMessageKey(k))}
              </span>
            </label>
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={() => void save()}
        disabled={status === "saving"}
        className="bg-blue-600 text-white px-4 py-2 rounded-md disabled:opacity-60"
      >
        {t("save")}
      </button>

      {status === "error" && err ? (
        <p className="text-sm text-red-600 dark:text-red-400">{t("adminRolesSaveError")}</p>
      ) : null}
    </div>
  );
}
