import ru from "../../messages/ru.json";
import en from "../../messages/en.json";
import uk from "../../messages/uk.json";
import de from "../../messages/de.json";
import { normalizeAppLocale, type AppLocale } from "@/navigation";

const bundles: Record<
  AppLocale,
  {
    NotFound: typeof ru.NotFound;
    Error: typeof ru.Error;
    RssForum: typeof ru.RssForum;
  }
> = {
  ru: { NotFound: ru.NotFound, Error: ru.Error, RssForum: ru.RssForum },
  en: { NotFound: en.NotFound, Error: en.Error, RssForum: en.RssForum },
  uk: { NotFound: uk.NotFound, Error: uk.Error, RssForum: uk.RssForum },
  de: { NotFound: de.NotFound, Error: de.Error, RssForum: de.RssForum },
};

export function rootShellCopy(locale: string) {
  return bundles[normalizeAppLocale(locale)];
}
