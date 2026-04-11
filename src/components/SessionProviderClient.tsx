"use client";

import { SessionProvider } from "next-auth/react";
import { LocalePreferenceSync } from "./LocalePreferenceSync";

export function SessionProviderClient({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <LocalePreferenceSync />
      {children}
    </SessionProvider>
  );
}
