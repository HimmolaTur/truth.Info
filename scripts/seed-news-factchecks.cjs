/**
 * Редакционные фактчеки по темам новостных материалов (привязка news_id).
 * Идемпотентно: удаляет только строки factchecks с тем же news_id, что будут вставлены.
 * Запуск: npm run db:seed-news-factchecks
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

/** Утверждение / проверка / источники (источники — через запятую в одной строке для TEXT). */
const SEEDS = [
  {
    matchUrl: "https://www.newsler.ru/society/2026/03/23/seme-pogibshego-uchastnika-svo-cherez-sud-naznachili-vyplatu",
    claim:
      "«Если семья уже что-то получила от государства, суд не будет разбираться — всё закрыто».",
    truth:
      "Суды как раз и существуют для разрешения споров о том, полностью ли исполнена обязанность по выплатам и компенсациям. Наличие частичных выплат не «закрывает» тему автоматически: важны основания, расчёты и доказательная база. Без письменной фиксации цепочки обращений и ответов ведомств любая сторона слабеет в процессе — не из-за «злого суда», а из-за пробелов в документах.",
    sources:
      "https://www.newsler.ru/society/2026/03/23/seme-pogibshego-uchastnika-svo-cherez-sud-naznachili-vyplatu, https://www.gosuslugi.ru/",
  },
  {
    matchUrl:
      "https://www.svoboda.org/a/vlasti-regionov-snizhayut-vyplaty-za-kontrakty-i-otmenyayut-ljgoty/33730582.html",
    claim: "«Федеральный закон один — значит, льготы и доплаты везде одинаковые».",
    truth:
      "Федеральные нормы задают рамку, но часть мер поддержки реализуется через региональные акты и ведомственные регламенты. Отсюда реальные отличия по срокам, перечням и суммам. Сравнивать имеет смысл не чаты соседей, а официальные тексты субъекта и дату, с которой норма вступила в силу. Переходные периоды часто дают споры: кто успел подать заявление до изменения правил и кто попал под новую редакцию.",
    sources:
      "https://www.svoboda.org/a/vlasti-regionov-snizhayut-vyplaty-za-kontrakty-i-otmenyayut-ljgoty/33730582.html",
  },
  {
    matchUrl:
      "https://ru.themoscowtimes.com/2026/03/18/v-irkutskoi-oblasti-iz-za-nehvatki-deneg-v-5-raz-urezhut-viplati-za-raneniya-na-svo-i-vdvoe-za-gibel-a190044",
    claim: "«Регион объявил цифры в новости — значит, они уже действуют для всех задним числом».",
    truth:
      "Для прав и обязанностей граждан обычно важны дата официального опубликования нормативного акта и его текст, а не заголовок в ленте. Если меняются региональные единовременные выплаты, проверяйте первоисточник (портал правительства региона, муниципальные акты) и сохраняйте копию на момент обращения. Спорные случаи уходят в надзор и суды именно из-за коллизий «ожидание общества / формулировка в акте».",
    sources:
      "https://ru.themoscowtimes.com/2026/03/18/v-irkutskoi-oblasti-iz-za-nehvatki-deneg-v-5-raz-urezhut-viplati-za-raneniya-na-svo-i-vdvoe-za-gibel-a190044",
  },
  {
    matchUrl: "https://meduza.io/feature/2026/04/13/vy-vse-millionery-vy-vse-trupy",
    claim: "«Крупная сумма в рекламном ролике — это средний доход контрактника, просто честно сказали».",
    truth:
      "Рекламный ролик преследует охват и отклик; формулировки часто собирают «максимально возможные» элементы оплаты и надбавок в один визуально сильный образ. Реальный расчёт зависит от оклада, выслуги, конкретных оснований на дату и удержаний. Сверять нужно договор, приказы о денежном довольствии и расчётные листы, а не креатив в соцсетях.",
    sources: "https://meduza.io/feature/2026/04/13/vy-vse-millionery-vy-vse-trupy",
  },
  {
    matchUrl: "https://www.e1.ru/text/world/2026/03/25/76330322/",
    claim: "«Отказ в выплате за ранение всегда значит злой умысел чиновников».",
    truth:
      "На практике отказы и задержки нередко следуют из разрыва в документах: формулировка диагноза, срок подачи, потерянное при переводе заключение, устный ответ без приказа. Это не отменяет права защищаться, но объясняет, почему «добиваться» приходится через письменные запросы, копии меддокументов и процедурные шаги. Без бумаги с мотивировкой сложно даже выбрать инстанцию для жалобы.",
    sources: "https://www.e1.ru/text/world/2026/03/25/76330322/",
  },
  {
    matchUrl: "https://edin.center/newsfeed/yurist-ecz-dobilsya-vyplatny-dlya-uchastnika-svo",
    claim: "«Решение ЕСПЧ — это почти автоматические деньги на счёт в ближайшие недели».",
    truth:
      "Международное судопроизводство задаёт правовую оценку и обязательства для государства, но исполнение на национальном уровне проходит через внутренние процедуры и может занимать значительное время. Для семьи важно разделять «выиграли дело в Страсбурге» и «получили конкретную сумму по счёту» — это разные этапы, и медийный заголовок часто сжимает только первый.",
    sources: "https://edin.center/newsfeed/yurist-ecz-dobilsya-vyplatny-dlya-uchastnika-svo",
  },
  {
    matchUrl:
      "https://www.svoboda.org/a/deneg-v-seme-net-v-rossii-snizhayut-vyplaty-voennym-i-ih-rodstvennikam/33609080.html",
    claim: "«Социальные выплаты режут тайно — пока население не заметит».",
    truth:
      "Изменения обычно сопровождаются нормативными актами и системами уведомлений, но человек может узнать поздно, если не следит за Госуслугами, сайтом ведомства и региональными порталами. Проблема не столько «тайна», сколько сложность формулировок и отсутствие наглядной таблицы «было — стало» для каждой категории получателей. Отсюда ощущение заговора — его снимает работа с первоисточником, а не с пересказом.",
    sources:
      "https://www.svoboda.org/a/deneg-v-seme-net-v-rossii-snizhayut-vyplaty-voennym-i-ih-rodstvennikam/33609080.html, https://www.gosuslugi.ru/",
  },
  {
    matchUrl:
      "https://prufy.ru/news/society/182011-esli_papa_ne_vernetsya_zachem_mne_dengi_kto_nazhivaetsya_na_semyakh_uchastnikov_svo/",
    claim: "«Все коммерческие услуги вокруг трагедии — по определению мошенничество».",
    truth:
      "Не каждая платная услуга незаконна: вопрос в прозрачности цены, лицензий, отсутствии навязывания в состоянии шока и соответствии договора закону. Риск высок там, где давят срочностью, просят наличные «сейчас» и не дают прочитать текст. Государственные и ведомственные программы — первый ориентир; параллельно имеет смысл проверять контрагента по открытым реестрам.",
    sources:
      "https://prufy.ru/news/society/182011-esli_papa_ne_vernetsya_zachem_mne_dengi_kto_nazhivaetsya_na_semyakh_uchastnikov_svo/",
  },
  {
    matchUrl: "https://www.gazeta.ru/social/news/2026/02/19/27900049.shtml",
    claim: "«Индексация в заголовке новости всегда означает рост каждой моей выплаты».",
    truth:
      "Индексация и пересмотр правил часто касаются отдельных видов пособий или категорий. Одна и та же «процентная» новость может не затронуть вашу строку в личном кабинете. Проверять нужно конкретное основание выплаты и прикреплённые документы к акту, а не только сводку СМИ.",
    sources: "https://www.gazeta.ru/social/news/2026/02/19/27900049.shtml",
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
    const newsIds = [];
    for (const s of SEEDS) {
      const r = await client.query(
        `SELECT id FROM news WHERE position($1::text in content) > 0 LIMIT 1`,
        [s.matchUrl]
      );
      if (r.rowCount === 0) {
        console.warn("Нет новости с URL в тексте, пропуск:", s.matchUrl.slice(0, 72));
        continue;
      }
      newsIds.push(r.rows[0].id);
    }
    if (newsIds.length === 0) {
      console.log("Нечего привязывать — новости с этими ссылками не найдены.");
      return;
    }
    await client.query(`DELETE FROM factchecks WHERE news_id = ANY($1::int[])`, [newsIds]);

    let inserted = 0;
    for (const s of SEEDS) {
      const r = await client.query(
        `SELECT id FROM news WHERE position($1::text in content) > 0 LIMIT 1`,
        [s.matchUrl]
      );
      if (r.rowCount === 0) continue;
      const newsId = r.rows[0].id;
      await client.query(
        `INSERT INTO factchecks (claim, truth, sources, news_id, created_at, updated_at)
         VALUES ($1, $2, $3, $4, NOW(), NOW())`,
        [s.claim, s.truth, s.sources, newsId]
      );
      inserted++;
      console.log("Фактчек → news id", newsId);
    }
    console.log("Готово, вставлено разборов:", inserted);
  } finally {
    await client.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
