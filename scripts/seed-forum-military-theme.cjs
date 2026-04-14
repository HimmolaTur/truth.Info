/**
 * Добавляет темы и комментарии на форуме в тематике выплат, контракта, мобилизации и рекрутинга.
 * Не удаляет существующие посты. Повторный запуск пропускается, если уже есть темы с тегом SEED_TAG.
 *
 * Запуск: npm run db:seed-forum
 * Если в users никого нет, темы создаются от имени «Редакция портала» с user_id NULL (лента работает без регистрации).
 */
const fs = require("fs");
const path = require("path");
const { Client } = require("pg");

const SEED_TAG = "portal-seed-2026";

function loadEnvLocal() {
  const envPath = path.join(__dirname, "..", ".env.local");
  if (!fs.existsSync(envPath)) {
    console.error("No .env.local found.");
    process.exit(1);
  }
  const text = fs.readFileSync(envPath, "utf8");
  for (const line of text.split(/\r?\n/)) {
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

const TOPICS = [
  {
    category: "Помощь",
    title: "Задержка контрактных выплат на 12 дней — куда писать первым делом?",
    content: `Поделитесь опытом: кто в какой последовательности обращался — в финчасть части, в банк, в горячую линию? Интересуют **реальные сроки ответа**, не теория.

У меня в личке сумма «висит» в статусе начислено, на карту тишина.`,
    tags: ["контракт", "задержка", "банк", SEED_TAG],
    comments: [
      {
        author_name: "Марина_Юг",
        content:
          "Сначала запрос в финчасть с просьбой дать номер платёжки или дату отправки. Без этого банк часто отписывается общими фразами.",
      },
      {
        author_name: "ИгорьК",
        content:
          "У нас помогло только второе обращение с копией первого и отметкой даты. Первый ответ был шаблон «рассматривается».",
      },
    ],
  },
  {
    category: "Обсуждения",
    title: "Обещали «закрыть кредит» при подписании — в контракте пусто. Кто сталкивался?",
    content: `Вопрос к тем, кто уже проходил **пункт отбора**: на что ссылались, когда говорили про долги? Было ли что-то на бумаге или одни устные формулировки?

Хочу понять, насколько это массовая история или единичные кураторы.`,
    tags: ["обещания", "кредит", "контракт", SEED_TAG],
    comments: [
      {
        author_name: "anon_contract",
        content:
          "Только устно. Потом в части сказали «никто не обещал» — доказать нечего. С тех пор всё требую письменно, даже мелочи.",
      },
      {
        author_name: "Денис",
        content:
          "Дали брошюру с общими словами про поддержку, но без сумм и без подписи. Юрист сказал — это не договор.",
      },
      {
        author_name: "Света",
        content:
          "В нашем городе волонтёры записывали обращения в тетрадь «на контроль» — но это не юридическая сила, просто чтобы не забыли.",
      },
    ],
  },
  {
    category: "Срочное",
    title: "Региональная доплата семье мобилизованного: соседний регион уже выплатил, у нас тишина",
    content: `Субъекты рядом уже отчитались о выплатах, у нас **нет разъяснений на сайте**. Кто подскажет, куда давить — губернатору, Минтруд или омбудсмену?

Документы в МФЦ сдали две недели назад, статус не обновляется.`,
    tags: ["мобилизация", "регион", "семья", SEED_TAG],
    comments: [
      {
        author_name: "ОльгаП",
        content:
          "Нам ответили только после запроса через Госуслуги с указанием закона о сроках ответа. До этого автоматические «в работе».",
      },
    ],
  },
  {
    category: "Сообщество",
    title: "Реклама «до 300 тысяч» на баннере — как вы просили расшифровку перед контрактом?",
    content: `Собираю **рабочие формулировки** для запроса в кадры: что именно просить расписать по строкам (оклад, надбавки, районник и т.д.).

Если кто-то получал нормальный письменный ответ — поделитесь структурой (без персональных данных).`,
    tags: ["рекрутинг", "реклама", "расчёт", SEED_TAG],
    comments: [
      {
        author_name: "Кирилл",
        content:
          "Просил таблицу «минимум / максимум / при каких условиях». Ответили общими словами, но хотя бы на бумаге зафиксировали отказ давать цифры.",
      },
      {
        author_name: "reader_42",
        content:
          "Фоткал баннер + сохранял скрин сайта военкомата. Потом пригодилось в переписке с юристом бесплатной линии.",
      },
    ],
  },
  {
    category: "Помощь",
    title: "Перерасчёт за прошлый месяц с минусом — кто разбирался успешно?",
    content: `В ведомости **удержание** с формулировкой «перерасчёт». В финчасти по телефону говорят «подождите следующий месяц». Как вы добивались расшифровки?

Нужны живые шаги, не абстрактное «пишите жалобу».`,
    tags: ["перерасчёт", "ведомость", "финчасть", SEED_TAG],
    comments: [
      {
        author_name: "ПавелС",
        content:
          "Писал через командира рапорт с просьбой приложить расчётный листок с расшифровкой коэффициентов. Через 10 дней дали выписку.",
      },
      {
        author_name: "макс",
        content:
          "Минус оказался из-за переплаты аванса в позапрошлом квартале. Обидно, что не объяснили сразу.",
      },
    ],
  },
  {
    category: "Обсуждения",
    title: "Мобилизация → контракт: когда у вас выровнялись выплаты после перехода?",
    content: `Интересует **разрыв по времени**: сколько месяцев была каша в кабинете или на карте? Были ли дубли или, наоборот, «провалы»?

Опыт разных регионов приветствуется.`,
    tags: ["мобилизация", "контракт", "переход", SEED_TAG],
    comments: [
      {
        author_name: "Тимур",
        content: "Два полных месяца путаницы. Потом одним перечислением «догнали», но без объяснений.",
      },
    ],
  },
  {
    category: "Помощь",
    title: "ВПД и билеты: компенсацию не приняли из-за «не той» кассы — что делали?",
    content: `Касса не входила в перечень, хотя маршрут был тот же. **Кто оспаривал** и куда несли документы повторно?

Собираю сценарии, чтобы оформить памятку для раздела сайта.`,
    tags: ["ВПД", "компенсация", "документы", SEED_TAG],
    comments: [
      {
        author_name: "Никита_Урал",
        content:
          "Перекинули в другой отдел, попросили справку от перевозчика. Долго, но вернули.",
      },
      {
        author_name: "гость",
        content: "Проще было купить новый билет в «правильной» кассе и приложить чек — не всем подходит по деньгам.",
      },
    ],
  },
  {
    category: "Срочное",
    title: "Шаблон ответа «ваше обращение рассматривается» уже 40 дней — превышение срока?",
    content: `К **какому нормативу** вы цеплялись в следующем письме: локальный акт, ФЗ о порядке рассмотрения обращений, иной?

Поделитесь формулировками без персональных данных.`,
    tags: ["жалобы", "сроки", "шаблон", SEED_TAG],
    comments: [
      {
        author_name: "юрист_не_я",
        content:
          "Я не юрист, но приложил скрин первого обращения с датой и попросил указать нормативный срок ответа по существу. Через неделю пришло разъяснение.",
      },
    ],
  },
];

async function main() {
  loadEnvLocal();
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("DATABASE_URL is missing in .env.local");
    process.exit(1);
  }

  const client = new Client({
    connectionString: url,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();
  await client.query("SET statement_timeout = '120s'");

  try {
    const dup = await client.query(
      "SELECT 1 FROM forum_topics WHERE $1 = ANY(tags) LIMIT 1",
      [SEED_TAG]
    );
    if (dup.rows.length > 0) {
      console.log("Forum seed already present (tag " + SEED_TAG + "). Skip.");
      await client.end();
      return;
    }

    const userRes = await client.query(
      "SELECT id, username FROM users ORDER BY id ASC LIMIT 1"
    );
    const userId = userRes.rows.length ? userRes.rows[0].id : null;
    const username = userRes.rows.length
      ? userRes.rows[0].username
      : "Редакция портала";
    if (!userRes.rows.length) {
      console.log("No users in DB — forum topics use author without user_id.");
    }

    const catRes = await client.query("SELECT id, name FROM forum_categories");
    const catByName = Object.fromEntries(
      catRes.rows.map((r) => [r.name, r.id])
    );

    await client.query("BEGIN");
    let topicCount = 0;
    let commentCount = 0;
    const baseTime = Date.now();

    for (let i = 0; i < TOPICS.length; i++) {
      const t = TOPICS[i];
      const cid = catByName[t.category];
      if (!cid) {
        console.warn("Skip topic (unknown category):", t.category, t.title);
        continue;
      }
      const createdAt = new Date(baseTime - (i + 1) * 3600000 * 3);
      const ins = await client.query(
        `INSERT INTO forum_topics (
          category_id, title, content, author_name, tags, user_id,
          views, likes, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5::text[], $6, $7, $8, $9, $9)
        RETURNING id`,
        [
          cid,
          t.title,
          t.content,
          username,
          t.tags,
          userId,
          15 + i * 7,
          i % 4,
          createdAt,
        ]
      );
      const topicId = ins.rows[0].id;
      topicCount++;

      let cIdx = 0;
      for (const c of t.comments) {
        const cAt = new Date(createdAt.getTime() + (cIdx + 1) * 600000);
        await client.query(
          `INSERT INTO forum_comments (
            topic_id, content, author_name, parent_id, author_session_id, user_id,
            likes, dislikes, is_best_answer, created_at
          ) VALUES ($1, $2, $3, NULL, NULL, NULL, $4, 0, false, $5)`,
          [topicId, c.content, c.author_name, cIdx === 0 ? 1 : 0, cAt]
        );
        commentCount++;
        cIdx++;
      }
    }

    await client.query("COMMIT");
    console.log(
      `Forum seed OK: ${topicCount} topics, ${commentCount} comments (topic author: ${username}${userId ? `, user_id=${userId}` : ""}).`
    );
  } catch (e) {
    await client.query("ROLLBACK").catch(() => {});
    throw e;
  } finally {
    await client.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
