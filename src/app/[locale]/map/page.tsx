import { queryWithTimeout } from "@/lib/db";
import dynamic from "next/dynamic";
import { HeroBackdrop } from "@/components/HeroBackdrop";
import type { MapEventRow } from "@/components/MapComponent";
import { getTranslations } from "next-intl/server";

const MAP_HERO_IMG =
  "/images/photo-1495020689067-958852a7765e.jpg";

// MapComponent uses window object, so we must load it dynamically with SSR disabled
const MapComponent = dynamic(() => import("@/components/MapComponent"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[400px] bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center text-neutral-600">
      Loading map...
    </div>
  ),
});

export default async function MapPage() {
  const t = await getTranslations("Map");
  const tc = await getTranslations("Common");
  let events: MapEventRow[] = [];
  let mapLoadError = false;
  try {
    const eventsResult = await queryWithTimeout(
      "SELECT id, title, description, lat, lng, news_id FROM map_events ORDER BY created_at DESC",
      [],
      18_000
    );
    events = eventsResult.rows as MapEventRow[];
  } catch {
    mapLoadError = true;
    events = [];
  }

  return (
    <div className="flex flex-col w-full h-[calc(100vh-4rem)]">
      {/* Full-width Header for Map */}
      <section className="relative w-full py-16 bg-black text-white overflow-hidden shrink-0">
        <HeroBackdrop imageUrl={MAP_HERO_IMG} className="opacity-30" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4 drop-shadow-lg">{t("title")}</h1>
          <p className="text-lg text-gray-300 font-medium">{t("desc")}</p>
        </div>
      </section>

      {mapLoadError ? (
        <div className="flex-1 flex items-center justify-center px-4 bg-amber-50 dark:bg-amber-950/30 text-amber-900 dark:text-amber-100 text-center text-sm sm:text-base">
          {tc("dataLoadError")}
        </div>
      ) : events.length === 0 ? (
        <div className="flex-1 flex items-center justify-center px-4 bg-gray-100 dark:bg-neutral-900 text-gray-600 dark:text-gray-400 text-center">
          {t("noMarkers")}
        </div>
      ) : (
        <div className="flex-1 w-full relative z-0 min-h-[400px]">
          <MapComponent events={events} />
        </div>
      )}
    </div>
  );
}