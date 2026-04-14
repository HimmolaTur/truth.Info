import { queryWithTimeout } from "@/lib/db";
import { Link } from "@/navigation";
import { ArrowRight, Shield, AlertTriangle, MapPin, Clock } from "lucide-react";
import { NewsCarousel } from "@/components/NewsCarousel";
import { HeroBackdrop } from "@/components/HeroBackdrop";
import { getTranslations } from "next-intl/server";
import { rowToHomeNewsCard } from "@/lib/newsAdmin";

const IMG_HERO =
  "/images/photo-1451187580459-43490279c0fa.jpg";
const IMG_FEATURES =
  "/images/photo-1518770660439-4636190af475.jpg";
const IMG_CTA =
  "/images/photo-1532375810709-75b1da00537c.jpg";

const HOME_LATEST_COUNT = 3;
const HOME_FEATURED_COUNT = 8;
const PLACEHOLDER_NEWS_IMAGE =
  "/images/photo-1504711434969-e33886168f5c.jpg";

export default async function Home() {
  const t = await getTranslations("Home");
  const tc = await getTranslations("Common");

  let latestNews: ReturnType<typeof rowToHomeNewsCard>[] = [];
  let featuredNews: ReturnType<typeof rowToHomeNewsCard>[] = [];
  let newsLoadError = false;

  try {
    const [latestRes, featuredRes] = await Promise.all([
      queryWithTimeout(
        `SELECT * FROM news ORDER BY created_at DESC LIMIT $1`,
        [HOME_LATEST_COUNT],
        18_000
      ),
      queryWithTimeout(
        `SELECT * FROM news
         WHERE COALESCE(is_featured, false) = true
         ORDER BY created_at DESC
         LIMIT $1`,
        [HOME_FEATURED_COUNT],
        18_000
      ),
    ]);
    latestNews = latestRes.rows.map((row) =>
      rowToHomeNewsCard(row as Record<string, unknown>, 200)
    );
    featuredNews = featuredRes.rows.map((row) =>
      rowToHomeNewsCard(row as Record<string, unknown>, 320)
    );
  } catch {
    newsLoadError = true;
  }

  return (
    <div className="flex flex-col w-full">
      {/* Full-width Hero Section */}
      <section className="relative w-full min-h-[80vh] flex items-center justify-center overflow-hidden bg-black text-white">
        <HeroBackdrop imageUrl={IMG_HERO} className="opacity-40" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/90"></div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center py-20">
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 drop-shadow-2xl">
            {t("heroTitle1")} <br className="hidden sm:block" />
            <span className="text-blue-400">{t("heroTitle2")}</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-200 max-w-3xl mx-auto mb-12 drop-shadow-lg font-medium">
            {t("heroDesc")}
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-6">
            <Link href="/news" className="bg-blue-600 text-white px-10 py-5 rounded-xl font-bold hover:bg-blue-500 transition shadow-[0_0_40px_-10px_rgba(37,99,235,0.7)] flex items-center justify-center gap-3 text-lg">
              {t("readNews")}
              <ArrowRight className="w-6 h-6" />
            </Link>
            <Link href="/factcheck" className="bg-white/10 backdrop-blur-md border-2 border-white/20 text-white px-10 py-5 rounded-xl font-bold hover:bg-white/20 transition text-lg flex items-center justify-center">
              {t("factcheck")}
            </Link>
          </div>
        </div>
      </section>

      {newsLoadError && (
        <div className="bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 text-amber-900 dark:text-amber-100 text-sm sm:text-base">
            {tc("dataLoadError")}
          </div>
        </div>
      )}

      {/* Главные темы: только посты с is_featured, новые сверху */}
      <section className="w-full bg-gray-50 dark:bg-neutral-950 py-20 border-b dark:border-neutral-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-end mb-10">
            <h2 className="text-4xl font-extrabold text-gray-900 dark:text-white">{t("mainTopics")}</h2>
            <Link href="/news" className="hidden sm:flex items-center gap-2 text-blue-600 hover:text-blue-700 font-bold text-lg">
              {t("allNews")} <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
          {newsLoadError ? (
            <div className="rounded-2xl border border-red-200 dark:border-red-900/50 bg-red-50/80 dark:bg-red-950/20 px-8 py-10 text-center text-red-800 dark:text-red-200">
              {tc("dataLoadError")}
            </div>
          ) : featuredNews.length > 0 ? (
            <NewsCarousel news={featuredNews} placeholderImage={PLACEHOLDER_NEWS_IMAGE} />
          ) : (
            <div className="rounded-2xl border border-dashed border-gray-300 dark:border-neutral-700 bg-white/50 dark:bg-neutral-900/50 px-8 py-14 text-center">
              <p className="text-gray-600 dark:text-gray-400 text-lg max-w-xl mx-auto">
                {t("mainTopicsEmpty")}
              </p>
              <Link
                href="/news"
                className="inline-flex items-center gap-2 mt-6 text-blue-600 hover:text-blue-700 font-bold"
              >
                {t("allNews")} <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Full-width Features Section with Image Background */}
      <section className="relative w-full py-24 bg-blue-900 text-white overflow-hidden">
        <HeroBackdrop imageUrl={IMG_FEATURES} className="opacity-10 mix-blend-overlay" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-extrabold mb-4">{t("toolsTitle")}</h2>
            <p className="text-xl text-blue-200 max-w-2xl mx-auto">{t("toolsDesc")}</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Link href="/factcheck" className="bg-white/10 backdrop-blur-lg p-8 rounded-3xl border border-white/20 hover:bg-white/20 transition cursor-pointer group">
              <div className="bg-blue-500/30 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Shield className="w-8 h-8 text-blue-300" />
              </div>
              <h3 className="text-2xl font-bold mb-4">{t("toolFactcheckTitle")}</h3>
              <p className="text-blue-100 text-base leading-relaxed">
                {t("toolFactcheckDesc")}
              </p>
            </Link>
            
            <Link href="/map" className="bg-white/10 backdrop-blur-lg p-8 rounded-3xl border border-white/20 hover:bg-white/20 transition cursor-pointer group">
              <div className="bg-red-500/30 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <MapPin className="w-8 h-8 text-red-300" />
              </div>
              <h3 className="text-2xl font-bold mb-4">{t("toolMapTitle")}</h3>
              <p className="text-blue-100 text-base leading-relaxed">
                {t("toolMapDesc")}
              </p>
            </Link>

            <Link href="/timeline" className="bg-white/10 backdrop-blur-lg p-8 rounded-3xl border border-white/20 hover:bg-white/20 transition cursor-pointer group">
              <div className="bg-amber-500/30 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Clock className="w-8 h-8 text-amber-300" />
              </div>
              <h3 className="text-2xl font-bold mb-4">{t("toolTimelineTitle")}</h3>
              <p className="text-blue-100 text-base leading-relaxed">
                {t("toolTimelineDesc")}
              </p>
            </Link>

            <Link href="/submit" className="bg-white/10 backdrop-blur-lg p-8 rounded-3xl border border-white/20 hover:bg-white/20 transition cursor-pointer group">
              <div className="bg-green-500/30 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <AlertTriangle className="w-8 h-8 text-green-300" />
              </div>
              <h3 className="text-2xl font-bold mb-4">{t("toolSubmitTitle")}</h3>
              <p className="text-blue-100 text-base leading-relaxed">
                {t("toolSubmitDesc")}
              </p>
            </Link>
          </div>
        </div>
      </section>

      {/* Последние события: три последних поста по дате */}
      <section className="w-full py-24 bg-white dark:bg-neutral-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-end border-b-2 border-gray-100 dark:border-neutral-800 pb-6 mb-12">
            <h2 className="text-4xl font-extrabold text-gray-900 dark:text-white">{t("latestEvents")}</h2>
            <Link href="/news" className="text-blue-600 hover:text-blue-700 font-bold flex items-center gap-2 text-lg">
              {t("allNews")} <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
          {newsLoadError ? (
            <p className="text-center text-red-700 dark:text-red-300 py-12 max-w-2xl mx-auto">{tc("dataLoadError")}</p>
          ) : latestNews.length === 0 ? (
            <p className="text-center text-gray-500 py-12">{t("latestEventsEmpty")}</p>
          ) : (
            <div className="grid md:grid-cols-3 gap-10">
              {latestNews.map((item) => (
                <Link
                  href={`/news/${item.id}`}
                  key={item.id}
                  className="bg-white dark:bg-neutral-900 rounded-3xl overflow-hidden border border-gray-100 dark:border-neutral-800 shadow-lg hover:shadow-2xl transition-all duration-300 group cursor-pointer flex flex-col"
                >
                  <div className="h-64 bg-gray-200 dark:bg-neutral-800 w-full relative overflow-hidden">
                    <img
                      src={item.image_url || PLACEHOLDER_NEWS_IMAGE}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    {item.is_important && (
                      <div className="absolute top-5 left-5 bg-red-600 text-white text-xs font-bold px-4 py-2 rounded-full shadow-lg uppercase tracking-wider">
                        {t("important")}
                      </div>
                    )}
                  </div>
                  <div className="p-8 flex-1 flex flex-col">
                    <div className="flex justify-between items-center mb-5">
                      <div className="text-sm text-gray-500 font-medium">
                        {new Date(item.created_at).toLocaleDateString("ru-RU")}
                      </div>
                      <div className="text-xs font-bold text-blue-600 bg-blue-50 dark:bg-blue-900/30 px-3 py-1.5 rounded-full uppercase tracking-wider">
                        {item.category}
                      </div>
                    </div>
                    <h3 className="text-2xl font-bold mb-4 group-hover:text-blue-600 transition-colors line-clamp-2 text-gray-900 dark:text-white">
                      {item.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 text-base line-clamp-3 leading-relaxed">
                      {item.content_preview}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Full-width CTA Banner */}
      <section className="relative w-full py-32 bg-blue-600 text-white overflow-hidden">
        <HeroBackdrop imageUrl={IMG_CTA} className="opacity-20 mix-blend-overlay" />
        <div className="absolute inset-0 bg-gradient-to-r from-blue-900/80 to-blue-600/80"></div>
        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-5xl md:text-6xl font-extrabold mb-8 drop-shadow-lg">{t("ctaTitle")}</h2>
          <p className="text-xl md:text-2xl text-blue-100 mb-12 font-medium drop-shadow-md">
            {t("ctaDesc")}
          </p>
          <Link href="/submit" className="inline-flex items-center gap-3 bg-white text-blue-600 px-10 py-5 rounded-2xl font-bold text-xl hover:bg-gray-100 hover:scale-105 transition-all shadow-2xl">
            {t("shareStory")}
            <ArrowRight className="w-6 h-6" />
          </Link>
        </div>
      </section>
    </div>
  );
}
