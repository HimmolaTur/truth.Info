/**
 * Точки на карте и события хронологии по темам новостных материалов (news_id).
 * Идемпотентно для затронутых новостей. Запуск: npm run db:seed-news-map-timeline
 */
const fs = require("fs");
const path = require("path");
const { Client } = require("pg");

function loadEnvLocal() {
  const envPath = path.join(__dirname, "..", ".env.local");
  if (!fs.existsSync(envPath)) {
    console.error("No .env.local");
    process.exit(1);
  }
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq === -1) continue;
    const key = t.slice(0, eq).trim();
    let val = t.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  }
}

const SEEDS = [
  {
    matchUrl: "https://www.newsler.ru/society/2026/03/23/seme-pogibshego-uchastnika-svo-cherez-sud-naznachili-vyplatu",
    lat: 55.7512,
    lng: 37.6184,
    mapTitle: "Суды и выплаты семьям",
    mapDescription:
      "Тема судебных решений о компенсациях: цепочка документов и ведомств важнее «устных обещаний».",
    eventDate: "2026-03-23",
    dateStr: "23 марта 2026",
    timelineTitle: "Публикация о судебной выплате семье погибшего участника",
    timelineDescription:
      "Материал Newsler об очередности выплат и роли суда при споре о полноте компенсации. Ориентир для читателей: фиксировать обращения и ответы письменно.",
  },
  {
    matchUrl:
      "https://www.svoboda.org/a/vlasti-regionov-snizhayut-vyplaty-za-kontrakty-i-otmenyayut-ljgoty/33730582.html",
    lat: 55.7558,
    lng: 37.6176,
    mapTitle: "Регионы и контрактные льготы",
    mapDescription:
      "Разные субъекты по-разному реализуют меры поддержки; сравнивать безопаснее по текстам региональных актов.",
    eventDate: "2026-03-22",
    dateStr: "22 марта 2026",
    timelineTitle: "Дискуссия о сокращении региональных льгот контрактникам",
    timelineDescription:
      "Обзор Радио Свобода о пересмотре выплат и льгот на уровне субъектов. Ключевой риск — «стык» старых и новых правил при подаче заявлений.",
  },
  {
    matchUrl:
      "https://ru.themoscowtimes.com/2026/03/18/v-irkutskoi-oblasti-iz-za-nehvatki-deneg-v-5-raz-urezhut-viplati-za-raneniya-na-svo-i-vdvoe-za-gibel-a190044",
    lat: 52.2864,
    lng: 104.2807,
    mapTitle: "Иркутская область: региональные выплаты",
    mapDescription:
      "Региональный контекст пересмотра единовременных выплат — проверять даты публикации актов и таблицы сумм.",
    eventDate: "2026-03-18",
    dateStr: "18 марта 2026",
    timelineTitle: "Иркутская область пересматривает размеры единовременных выплат",
    timelineDescription:
      "The Moscow Times (RU) о бюджетных ограничениях и сокращении региональных сумм для раненых и семей погибших. Напоминание сверяться с официальным текстом решения региона.",
  },
  {
    matchUrl: "https://meduza.io/feature/2026/04/13/vy-vse-millionery-vy-vse-trupy",
    lat: 59.9343,
    lng: 30.3351,
    mapTitle: "Медиа и реклама службы",
    mapDescription:
      "Площадка редакции Meduza (Санкт-Петербург) — сюжет о языке рекрутинговой рекламы и реальности контракта.",
    eventDate: "2026-04-13",
    dateStr: "13 апреля 2026",
    timelineTitle: "Большой материал Meduza о рекламе «миллионов» и опыте службы",
    timelineDescription:
      "Лонгрид о разрыве между креативом и расчётными листами. Вывод для гражданина: сверять цифры с договором, не с роликом.",
  },
  {
    matchUrl: "https://www.e1.ru/text/world/2026/03/25/76330322/",
    lat: 56.8389,
    lng: 60.6057,
    mapTitle: "Урал: отказ в выплате за ранение",
    mapDescription:
      "Региональный кейс (Екатеринбург / Урал): где рвётся цепочка документов между частью, медициной и финблоком.",
    eventDate: "2026-03-25",
    dateStr: "25 марта 2026",
    timelineTitle: "Кейс об отказе в выплате за ранение",
    timelineDescription:
      "E1 разбирает бюрократические узкие места. Практический вывод: требовать письменную мотивировку отказа.",
  },
  {
    matchUrl: "https://edin.center/newsfeed/yurist-ecz-dobilsya-vyplatny-dlya-uchastnika-svo",
    lat: 48.5854,
    lng: 7.7419,
    mapTitle: "ЕСПЧ и длительные процедуры",
    mapDescription:
      "Условная привязка к Страсбургу (ЕСПЧ) — напоминание, что международное решение и деньги на счёте — разные этапы.",
    eventDate: "2026-03-14",
    dateStr: "14 марта 2026",
    timelineTitle: "Кейс о выплатах через работу в ЕСПЧ",
    timelineDescription:
      "Материал edin.center о стратегии правозащитников. Для семьи важен реалистичный горизонт ожидания исполнения.",
  },
  {
    matchUrl:
      "https://www.svoboda.org/a/deneg-v-seme-net-v-rossii-snizhayut-vyplaty-voennym-i-ih-rodstvennikam/33609080.html",
    lat: 55.7488,
    lng: 37.6121,
    mapTitle: "Социальные выплаты и быт семей",
    mapDescription:
      "Тема сокращения или задержек пособий — связь макро решений с конкретным бюджетом квартиры.",
    eventDate: "2026-03-05",
    dateStr: "5 марта 2026",
    timelineTitle: "«Денег в семье нет»: выплаты военным и родственникам",
    timelineDescription:
      "Сводный материал Радио Свобода о давлении на семьи при пересмотре социальной поддержки. Полезно следить за Госуслугами и региональными порталами.",
  },
  {
    matchUrl:
      "https://prufy.ru/news/society/182011-esli_papa_ne_vernetsya_zachem_mne_dengi_kto_nazhivaetsya_na_semyakh_uchastnikov_svo/",
    lat: 55.7622,
    lng: 37.6296,
    mapTitle: "Этика услуг для семей",
    mapDescription:
      "Тема коммерции вокруг траура — осторожность с договорами в первые дни, проверка лицензий.",
    eventDate: "2026-03-12",
    dateStr: "12 марта 2026",
    timelineTitle: "Репортаж о «индустрии горя» и уязвимых семьях",
    timelineDescription:
      "Prufy поднимает вопрос навязанных услуг. Редакционный вывод: опираться на госпрограммы и не подписывать вслепую.",
  },
  {
    matchUrl: "https://www.gazeta.ru/social/news/2026/02/19/27900049.shtml",
    lat: 55.7824,
    lng: 37.5981,
    mapTitle: "Социальная повестка весны 2026",
    mapDescription:
      "Контекст индексаций и пересмотра льгот — проверять, какая именно выплата «подросла», а какая нет.",
    eventDate: "2026-02-19",
    dateStr: "19 февраля 2026",
    timelineTitle: "Обзор изменений в льготах и выплатах (Gazeta.ru)",
    timelineDescription:
      "Краткий обзор тенденций: индексации не всегда касаются всех строк «соцкорзины» сразу — смотреть своё основание.",
  },
];

async function main() {
  loadEnvLocal();
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error("DATABASE_URL missing");
    process.exit(1);
  }

  const client = new Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
  await client.connect();
  await client.query("SET statement_timeout = '120s'");
  try {
    const resolved = [];
    for (const s of SEEDS) {
      const r = await client.query(
        `SELECT id FROM news WHERE position($1::text in content) > 0 LIMIT 1`,
        [s.matchUrl]
      );
      if (r.rowCount === 0) {
        console.warn("Нет новости, пропуск:", s.matchUrl.slice(0, 70));
        continue;
      }
      resolved.push({ ...s, newsId: r.rows[0].id });
    }
    if (resolved.length === 0) {
      console.log("Нет совпадений с новостями — сид не выполнен.");
      return;
    }
    const ids = resolved.map((x) => x.newsId);
    await client.query(`DELETE FROM map_events WHERE news_id = ANY($1::int[])`, [ids]);
    await client.query(`DELETE FROM timeline_events WHERE news_id = ANY($1::int[])`, [ids]);

    for (const s of resolved) {
      await client.query(
        `INSERT INTO map_events (title, description, lat, lng, news_id, created_at)
         VALUES ($1, $2, $3, $4, $5, NOW())`,
        [s.mapTitle, s.mapDescription, s.lat, s.lng, s.newsId]
      );
      await client.query(
        `INSERT INTO timeline_events (event_date, date_str, title, description, news_id, created_at)
         VALUES ($1::date, $2, $3, $4, $5, NOW())`,
        [s.eventDate, s.dateStr, s.timelineTitle, s.timelineDescription, s.newsId]
      );
      console.log("Карта + хронология → news id", s.newsId);
    }
    console.log("Готово, пар событий:", resolved.length);
  } finally {
    await client.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
