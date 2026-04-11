import { createNavigation } from 'next-intl/navigation';
import { defineRouting } from 'next-intl/routing';

export const locales = ['ru', 'en', 'uk', 'de'] as const;

export type AppLocale = (typeof locales)[number];

export const defaultLocale: AppLocale = 'ru';

export function normalizeAppLocale(value: string | null | undefined): AppLocale {
  if (value && (locales as readonly string[]).includes(value)) {
    return value as AppLocale;
  }
  return defaultLocale;
}

export const routing = defineRouting({
  locales,
  defaultLocale: 'ru'
});

export const { Link, redirect, usePathname, useRouter } = createNavigation(routing);
