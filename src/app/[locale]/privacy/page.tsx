import { getTranslations } from "next-intl/server";

export default async function PrivacyPage() {
  const t = await getTranslations("Privacy");

  return (
    <div className="max-w-4xl mx-auto w-full py-16 px-4 sm:px-6 lg:px-8 flex-1">
      <h1 className="text-4xl font-extrabold mb-8 text-gray-900 dark:text-white">{t("title")}</h1>
      <div className="prose dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 space-y-6 text-lg leading-relaxed">
        <p>{t("p1")}</p>
        <p>{t("p2")}</p>
        <p>{t("p3")}</p>
      </div>
    </div>
  );
}
