import { getServerSession } from "next-auth";
import authOptions from "@/lib/authOptions";

export type UserSession = {
  id: number;
  username: string;
  display_name: string;
  avatar_url: string | null;
  preferred_locale: string | null;
  role: string;
  permissions: string[];
};

/** Forum / app user from NextAuth JWT session (server components & route handlers). */
export async function getSession(): Promise<UserSession | null> {
  const s = await getServerSession(authOptions);
  if (!s?.user?.id) return null;
  const id = Number(s.user.id);
  if (!Number.isFinite(id)) return null;
  return {
    id,
    username: s.user.name || "",
    display_name: s.user.display_name ?? "",
    avatar_url: s.user.avatar_url,
    preferred_locale: s.user.preferred_locale ?? null,
    role: s.user.role || "user",
    permissions: Array.isArray(s.user.permissions) ? s.user.permissions.map(String) : [],
  };
}
