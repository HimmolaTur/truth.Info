import { getTranslations } from "next-intl/server";

export default async function AdminPage() {
  const t = await getTranslations("Admin");

  return (
    <div className="max-w-4xl mx-auto w-full py-12">
      <h1 className="text-3xl font-bold mb-6">{t("title")}</h1>
      <p className="text-gray-600 dark:text-gray-400 mb-8">
        {t("desc")}
      </p>
      
      <div className="bg-white dark:bg-neutral-900 p-8 rounded-xl border shadow-sm max-w-sm mx-auto text-center space-y-6">
        <h2 className="text-xl font-bold">{t("loginTitle")}</h2>
        <input type="email" placeholder="Email" className="w-full border rounded-md px-4 py-2 bg-gray-50 dark:bg-neutral-800" />
        <input type="password" placeholder={t("passwordPlaceholder")} className="w-full border rounded-md px-4 py-2 bg-gray-50 dark:bg-neutral-800" />
        <button className="w-full bg-blue-600 text-white px-4 py-2 rounded-md font-bold hover:bg-blue-700 transition">
          {t("loginBtn")}
        </button>
      </div>
    </div>
  );
}