import { createNavigation } from 'next-intl/navigation';
import { defineRouting } from 'next-intl/routing';

export const locales = ['ru', 'en', 'uk', 'de'] as const;

export const routing = defineRouting({
  locales,
  defaultLocale: 'ru'
});

export const { Link, redirect, usePathname, useRouter } = createNavigation(routing);
