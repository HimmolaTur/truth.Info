import { queryWithTimeout } from "@/lib/db";
import { HeroBackdrop } from "@/components/HeroBackdrop";
import { getTranslations } from "next-intl/server";
import { Link } from "@/navigation";

const TIMELINE_HERO_IMG =
  "/images/photo-1557426272-fc759fdf7a8d.jpg";

type TimelineEventRow = {
  id: number;
  date_str: string;
  title: string;
  description: string;
  news_id?: number | null;
};

export default async function TimelinePage() {
  const t = await getTranslations("Timeline");
  const tc = await getTranslations("Common");
  let events: TimelineEventRow[] = [];
  let timelineLoadError = false;
  try {
    const eventsResult = await queryWithTimeout(
      "SELECT id, event_date, date_str, title, description, news_id FROM timeline_events ORDER BY event_date DESC NULLS LAST, created_at DESC",
      [],
      18_000
    );
    events = eventsResult.rows as TimelineEventRow[];
  } catch {
    timelineLoadError = true;
    events = [];
  }

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
        {timelineLoadError ? (
          <div
            role="alert"
            className="rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/30 px-6 py-6 text-amber-900 dark:text-amber-100"
          >
            {tc("dataLoadError")}
          </div>
        ) : (
          <div className="relative border-l-4 border-blue-600 dark:border-blue-400 ml-4 md:ml-8 space-y-16">
            {events.length === 0 ? (
              <div className="pl-8 text-gray-500 dark:text-gray-400 space-y-2">
                <p>{t("noEvents")}</p>
                <p className="text-sm">{t("noEventsHint")}</p>
              </div>
            ) : (
              events.map((event) => (
                <div key={event.id} className="relative pl-8">
                  <div className="absolute w-4 h-4 bg-blue-600 dark:bg-blue-400 rounded-full -left-[9px] top-1 border-4 border-white dark:border-neutral-950"></div>
                  <div className="text-sm text-blue-600 dark:text-blue-400 font-bold mb-1">{event.date_str}</div>
                  <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">{event.title}</h3>
                  <p className="text-gray-600 dark:text-gray-400 bg-white dark:bg-neutral-900 p-4 rounded-xl shadow-sm border whitespace-pre-wrap">
                    {event.description}
                  </p>
                  {event.news_id != null ? (
                    <Link
                      href={`/news/${event.news_id}`}
                      className="inline-block mt-3 text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      {tc("relatedNews")}
                    </Link>
                  ) : null}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}