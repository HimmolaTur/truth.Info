import { cookies } from "next/headers";
import { GlobalNotFoundClient } from "@/components/root/GlobalNotFoundClient";
import { normalizeAppLocale } from "@/navigation";

export default async function NotFound() {
  const locale = normalizeAppLocale(cookies().get("NEXT_LOCALE")?.value);
  return <GlobalNotFoundClient locale={locale} />;
}
