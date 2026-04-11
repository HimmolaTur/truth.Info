import { query } from "@/lib/db";
import { HeroBackdrop } from "@/components/HeroBackdrop";
import { getTranslations } from "next-intl/server";

const TIMELINE_HERO_IMG =
  "/images/photo-1557426272-fc759fdf7a8d.jpg";

type TimelineEventRow = {
  id: number;
  date_str: string;
  title: string;
  description: string;
};

export default async function TimelinePage() {
  const t = await getTranslations("Timeline");
  const eventsResult = await query('SELECT * FROM timeline_events ORDER BY event_date DESC NULLS LAST, created_at DESC');
  const events = eventsResult.rows as TimelineEventRow[];

  return (
    <div className="flex flex-col w-full">
      {/* Full-width Hero for Timeline */}
      <section className="relative w-full py-24 bg-black text-white overflow-hidden">
        <HeroBackdrop imageUrl={TIMELINE_HERO_IMG} className="opacity-30" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl md:text-6xl font-extrabold mb-6 drop-shadow-lg">{t("title")}</h1>
          <p className="text-xl text-gray-300 font-medium">{t("desc")}</p>
        </div>
      </section>

      <div className="max-w-4xl mx-auto w-full py-16 px-4 sm:px-6 lg:px-8">
        <div className="relative border-l-4 border-blue-600 dark:border-blue-400 ml-4 md:ml-8 space-y-16">
          {events.length === 0 ? (
          <div className="pl-8 text-gray-500">{t("noEvents")}</div>
        ) : (
          events.map((event) => (
            <div key={event.id} className="relative pl-8">
              <div className="absolute w-4 h-4 bg-blue-600 dark:bg-blue-400 rounded-full -left-[9px] top-1 border-4 border-white dark:border-neutral-950"></div>
              <div className="text-sm text-blue-600 dark:text-blue-400 font-bold mb-1">{event.date_str}</div>
              <h3 className="text-xl font-bold mb-2">{event.title}</h3>
              <p className="text-gray-600 dark:text-gray-400 bg-white dark:bg-neutral-900 p-4 rounded-xl shadow-sm border whitespace-pre-wrap">
                {event.description}
              </p>
            </div>
          ))
          )}
        </div>
      </div>
    </div>
  );
}