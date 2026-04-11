import CredentialsProvider from "next-auth/providers/credentials";
import type { NextAuthOptions } from "next-auth";
import bcrypt from "bcryptjs";
import { query } from "@/lib/db";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials) return null;
        const username = String((credentials as { username?: string }).username || "").trim();
        const password = String((credentials as { password?: string }).password || "");
        if (!username || !password) return null;

        const result = await query(
          `SELECT u.id, u.username, u.password_hash, u.display_name, u.avatar_url,
                  NULLIF(TRIM(u.preferred_locale), '') AS preferred_locale,
                  COALESCE(r.slug, LOWER(COALESCE(NULLIF(TRIM(u.role), ''), 'user'))) AS role,
                  CASE
                    WHEN u.role_id IS NULL THEN ARRAY[]::text[]
                    ELSE COALESCE(
                      (SELECT ARRAY_AGG(rp.permission_key ORDER BY rp.permission_key)
                       FROM role_permissions rp WHERE rp.role_id = u.role_id),
                      ARRAY[]::text[]
                    )
                  END AS permissions
           FROM users u
           LEFT JOIN roles r ON r.id = u.role_id
           WHERE u.username = $1`,
          [username]
        );
        if (result.rows.length === 0) return null;

        const row = result.rows[0] as {
          id: number;
          username: string;
          password_hash: string;
          display_name: string;
          avatar_url: string | null;
          preferred_locale: string | null;
          role: string;
          permissions: string[] | null;
        };

        const match = await bcrypt.compare(password, row.password_hash);
        if (!match) return null;

        const permissions = Array.isArray(row.permissions) ? row.permissions.map(String) : [];

        return {
          id: String(row.id),
          name: row.username,
          email: `${row.username}@users.local`,
          role: row.role,
          display_name: row.display_name,
          avatar_url: row.avatar_url,
          preferred_locale: row.preferred_locale,
          permissions,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        const u = user as {
          id?: string;
          role?: string;
          name?: string | null;
          email?: string | null;
          display_name?: string | null;
          avatar_url?: string | null;
          preferred_locale?: string | null;
          permissions?: string[];
        };
        token.sub = u.id != null ? String(u.id) : token.sub;
        token.role = u.role ?? "user";
        token.name = u.name ?? token.name;
        token.email = u.email ?? token.email;
        token.display_name = u.display_name ?? null;
        token.avatar_url = u.avatar_url ?? null;
        token.preferred_locale = u.preferred_locale ?? null;
        token.permissions = Array.isArray(u.permissions) ? u.permissions : [];
      }
      if (trigger === "update" && session) {
        const s = session as Record<string, unknown>;
        if (typeof s.avatar_url === "string" || s.avatar_url === null) {
          token.avatar_url = s.avatar_url as string | null;
        }
        if (typeof s.preferred_locale === "string" || s.preferred_locale === null) {
          token.preferred_locale = s.preferred_locale as string | null;
        }
        if (typeof s.display_name === "string" || s.display_name === null) {
          token.display_name = s.display_name as string | null;
        }
      }
      return token;
    },
    async session({ session, token }) {
      session.user = session.user ?? { email: null, name: null, image: null };
      session.user.id = token.sub != null ? String(token.sub) : "";
      session.user.role = typeof token.role === "string" ? token.role : "user";
      session.user.display_name =
        token.display_name === undefined || token.display_name === null
          ? null
          : String(token.display_name);
      session.user.avatar_url =
        token.avatar_url === undefined || token.avatar_url === null
          ? null
          : String(token.avatar_url);
      session.user.preferred_locale =
        token.preferred_locale === undefined || token.preferred_locale === null
          ? null
          : String(token.preferred_locale);
      if (token.email) session.user.email = token.email as string;
      if (token.name) session.user.name = token.name as string;
      const rawP = (token as { permissions?: unknown }).permissions;
      session.user.permissions = Array.isArray(rawP) ? rawP.map(String) : [];
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET || "dev_nextauth_secret",
};

export default authOptions;
