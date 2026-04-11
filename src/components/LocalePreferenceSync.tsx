"use client";

import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/navigation";
import { locales } from "@/navigation";

/** After login, switch to the user&apos;s saved UI language if it differs from the URL. */
export function LocalePreferenceSync() {
  const { data: session, status } = useSession();
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const ran = useRef(false);

  useEffect(() => {
    if (status !== "authenticated" || ran.current) return;
    const pref = session?.user?.preferred_locale;
    if (!pref || !(locales as readonly string[]).includes(pref)) return;
    if (pref === locale) return;
    ran.current = true;
    router.replace(pathname, { locale: pref as typeof locale });
  }, [status, session, locale, pathname, router]);

  return null;
}
