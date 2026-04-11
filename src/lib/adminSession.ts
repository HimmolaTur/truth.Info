import { getServerSession } from "next-auth";
import authOptions from "@/lib/authOptions";

export type AdminJwtSession = {
  user: {
    id: string;
    role?: string;
    email?: string | null;
    name?: string | null;
    permissions: string[];
  };
};

export async function getAdminJwtSession(): Promise<AdminJwtSession | null> {
  const session = await getServerSession(authOptions);
  const perms = session?.user?.permissions ?? [];
  if (!session?.user?.id || !perms.includes("panel.access")) return null;
  return {
    user: {
      id: session.user.id,
      role: session.user.role,
      name: session.user.name,
      email: session.user.email,
      permissions: perms,
    },
  };
}
