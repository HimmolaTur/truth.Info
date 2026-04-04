import { ShieldAlert, CheckCircle } from "lucide-react";
import { query } from "@/lib/db";
import { HeroBackdrop } from "@/components/HeroBackdrop";
import { getTranslations } from "next-intl/server";

const FACTCHECK_HERO_IMG =
  "https://images.unsplash.com/photo-1503694978374-8a2fa686963a?q=80&w=2500&auto=format&fit=crop";

type FactcheckRow = {
  id: number;
  claim: string;
  truth: string;
  sources: string[] | null;
};

export default async function FactcheckPage() {
  const t = await getTranslations("Factcheck");
  const factchecksResult = await query('SELECT * FROM factchecks ORDER BY created_at DESC');
  const factchecks = factchecksResult.rows as FactcheckRow[];

  return (
    <div className="flex flex-col w-full">
      {/* Full-width Hero for Factcheck */}
      <section className="relative w-full py-24 bg-black text-white overflow-hidden">
        <HeroBackdrop imageUrl={FACTCHECK_HERO_IMG} className="opacity-30" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl md:text-6xl font-extrabold mb-6 drop-shadow-lg">{t("title")}</h1>
          <p className="text-xl text-gray-300 font-medium">{t("desc")}</p>
        </div>
      </section>

      <div className="max-w-4xl mx-auto w-full py-12 px-4 sm:px-6 lg:px-8">
        <div className="space-y-10">
          {factchecks.length === 0 ? (
            <div className="text-center text-gray-500 py-8">{t("noFactchecks")}</div>
          ) : (
            factchecks.map((item) => (
            <div key={item.id} className="bg-white dark:bg-neutral-900 rounded-xl border overflow-hidden shadow-sm">
              <div className="bg-red-50 dark:bg-red-900/20 p-6 border-b border-red-100 dark:border-red-900/30">
                <div className="flex items-center gap-2 text-red-600 dark:text-red-400 font-bold mb-2">
                  <ShieldAlert className="w-5 h-5" />
                  {t("fake")}
                </div>
                <p className="text-gray-700 dark:text-gray-300 font-medium">
                  {item.claim}
                </p>
              </div>
              <div className="bg-green-50 dark:bg-green-900/10 p-6">
                <div className="flex items-center gap-2 text-green-600 dark:text-green-400 font-bold mb-2">
                  <CheckCircle className="w-5 h-5" />
                  {t("refutation")}
                </div>
                <p className="text-gray-700 dark:text-gray-300 mb-4 whitespace-pre-wrap">
                  {item.truth}
                </p>
                {item.sources && item.sources.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-green-200 dark:border-green-900/30">
                    <h4 className="font-bold text-sm mb-2">{t("sources")}</h4>
                    <ul className="list-disc list-inside text-sm text-blue-600 dark:text-blue-400 ml-4">
                      {item.sources.map((source: string, idx: number) => (
                        <li key={idx}>
                          {source.startsWith('http') ? (
                            <a href={source} target="_blank" rel="noreferrer" className="hover:underline">{source}</a>
                          ) : (
                            <span>{source}</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}