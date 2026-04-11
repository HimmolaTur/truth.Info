import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      role: string;
      display_name: string | null;
      avatar_url: string | null;
      preferred_locale: string | null;
      permissions: string[];
    };
  }

  interface User {
    id: string;
    role: string;
    display_name: string | null;
    avatar_url: string | null;
    preferred_locale: string | null;
    permissions: string[];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: string;
    display_name?: string | null;
    avatar_url?: string | null;
    preferred_locale?: string | null;
    permissions?: string[];
  }
}
