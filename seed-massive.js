const { Client } = require('pg');

const images = [
  'https://images.unsplash.com/photo-1504711434969-e33886168f5c?q=80&w=1000&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1000&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1532375810709-75b1da00537c?q=80&w=1000&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1529245005535-6af5195155f1?q=80&w=1000&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1584483766114-2cea6facdf57?q=80&w=1000&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1475503572774-15a45e5d60b9?q=80&w=1000&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1503694978374-8a2fa686963a?q=80&w=1000&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1557426272-fc759fdf7a8d?q=80&w=1000&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1580130281320-0ef0754f2bf7?q=80&w=1000&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1495020689067-958852a7765e?q=80&w=1000&auto=format&fit=crop'
];

const categories = ['Политика', 'Общество', 'Экономика', 'Происшествия', 'Технологии', 'Права человека'];
const tagsList = ['важное', 'срочно', 'закон', 'волонтеры', 'помощь', 'интернет', 'цензура', 'безопасность', 'суд', 'регионы'];

const newsSubjects = ['Группа волонтеров', 'Местный суд', 'Крупный провайдер', 'Общественная организация', 'Независимое СМИ', 'Группа активистов', 'Министерство', 'Коалиция юристов'];
const newsActions = ['ограничивает доступ к сети', 'собирает средства для пострадавших', 'опубликовал новые данные', 'запускает горячую линию', 'оспаривает новое постановление', 'открывает пункт помощи', 'сообщает о сбоях', 'публикует открытое письмо'];
const newsPrefixes = ['Внимание:', 'Срочно:', 'Аналитика:', 'Репортаж:', 'Обновление:', 'Эксклюзив:', ''];

const lorem = "В свете последних событий ситуация продолжает развиваться. Эксперты отмечают беспрецедентный уровень вовлеченности гражданского общества. Местные жители сообщают о новых инициативах и попытках самоорганизации. Несмотря на возникающие трудности, работа продолжается. Юристы напоминают о необходимости соблюдения базовых мер цифровой гигиены. Мы продолжаем следить за развитием ситуации и будем публиковать обновления по мере поступления проверенной информации от наших источников на местах.";

function getRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function generateNews(count) {
  const news = [];
  const now = new Date();
  const past = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000); // 1 year ago

  for (let i = 0; i < count; i++) {
    const prefix = getRandom(newsPrefixes);
    const title = `${prefix} ${getRandom(newsSubjects)} ${getRandom(newsActions)}`.trim();
    const content = `${title}. ${lorem} ${lorem}`;
    const category = getRandom(categories);
    const tags = [getRandom(tagsList), getRandom(tagsList)];
    const is_important = Math.random() > 0.8;
    const image_url = getRandom(images);
    const created_at = getRandomDate(past, now);

    news.push([title, content, category, tags, is_important, image_url, created_at]);
  }
  return news;
}

function generateFactchecks(count) {
  const factchecks = [];
  const now = new Date();
  const past = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);

  const claims = [
    'В сети распространяется видео с колонной техники в городе N.',
    'Появились сообщения о полной блокировке мессенджеров с завтрашнего дня.',
    'Утверждается, что новый закон запрещает использование VPN.',
    'В мессенджерах пересылают аудиосообщение о закрытии границ региона.',
    'Появилась фотография якобы официального приказа о массовых проверках телефонов на улицах.'
  ];

  const truths = [
    'Это старое видео, снятое на учениях три года назад. Мы проверили метаданные и нашли оригинал публикации.',
    'Официальных заявлений не было. Технически полная блокировка маловероятна, эксперты рекомендуют просто обновить приложения.',
    'В тексте законопроекта нет прямого запрета на использование VPN физическими лицами. Ограничения касаются только провайдеров.',
    'Это классический пример панического вброса. Голос на аудио не идентифицирован, местные жители подтверждают штатную работу транспорта.',
    'Документ содержит грубые ошибки в оформлении и неверные реквизиты ведомства. Это подделка, созданная в графическом редакторе.'
  ];

  for (let i = 0; i < count; i++) {
    const claim = getRandom(claims);
    const truth = getRandom(truths);
    const sources = ['https://example.com/source1', 'Независимый анализ'];
    const created_at = getRandomDate(past, now);

    factchecks.push([claim, truth, sources, created_at]);
  }
  return factchecks;
}

function generateMapEvents(count) {
  const events = [];
  const now = new Date();
  const past = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Center around Moscow for demo, with random scatter
  const baseLat = 55.75;
  const baseLng = 37.61;

  const titles = ['Пункт помощи', 'Сбой связи', 'Перекрытие дороги', 'Сбор волонтеров', 'Юридическая консультация'];

  for (let i = 0; i < count; i++) {
    const title = getRandom(titles);
    const description = `Актуальная информация с места событий. ${getRandom(['Требуются люди.', 'Связь восстановлена.', 'Работает в штатном режиме.'])}`;
    const lat = baseLat + (Math.random() - 0.5) * 5; // Scatter across a wide region
    const lng = baseLng + (Math.random() - 0.5) * 5;
    const created_at = getRandomDate(past, now);

    events.push([title, description, lat, lng, created_at]);
  }
  return events;
}

function generateForumTopics(count) {
  const topics = [];
  const now = new Date();
  const past = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
  
  const titles = ['Помогите разобраться с VPN', 'Ищу контакты юристов в регионе', 'Обсуждение вчерашних новостей', 'Как безопасно хранить данные?', 'Сбор теплых вещей', 'Вопрос по новому закону'];

  for (let i = 0; i < count; i++) {
    const category_id = Math.floor(Math.random() * 4) + 1; // 1 to 4
    const title = getRandom(titles) + ' #' + Math.floor(Math.random() * 1000);
    const content = `Всем привет! ${lorem}`;
    const author_name = `Аноним ${Math.floor(Math.random() * 9999)}`;
    const created_at = getRandomDate(past, now);

    topics.push([category_id, title, content, author_name, created_at]);
  }
  return topics;
}

async function seed() {
  const client = new Client({
    user: 'postgres',
    host: 'localhost',
    database: 'hacaton',
    password: 'postgres',
    port: 5432,
  });

  try {
    await client.connect();
    console.log('Connected. Starting massive seed...');

    // 1. Insert News (300 items)
    console.log('Seeding 300 news articles...');
    const newsData = generateNews(300);
    for (const item of newsData) {
      await client.query(
        'INSERT INTO news (title, content, category, tags, is_important, image_url, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7)',
        item
      );
    }

    // 2. Insert Factchecks (100 items)
    console.log('Seeding 100 factchecks...');
    const factcheckData = generateFactchecks(100);
    for (const item of factcheckData) {
      await client.query(
        'INSERT INTO factchecks (claim, truth, sources, created_at) VALUES ($1, $2, $3, $4)',
        item
      );
    }

    // 3. Insert Map Events (200 items)
    console.log('Seeding 200 map events...');
    const mapData = generateMapEvents(200);
    for (const item of mapData) {
      await client.query(
        'INSERT INTO map_events (title, description, lat, lng, created_at) VALUES ($1, $2, $3, $4, $5)',
        item
      );
    }

    // 4. Insert Forum Topics (150 items)
    console.log('Seeding 150 forum topics...');
    const topicData = generateForumTopics(150);
    for (const item of topicData) {
      await client.query(
        'INSERT INTO forum_topics (category_id, title, content, author_name, created_at) VALUES ($1, $2, $3, $4, $5)',
        item
      );
    }

    // 5. Insert Forum Comments (300 items)
    console.log('Seeding 300 forum comments...');
    const topicsRes = await client.query('SELECT id FROM forum_topics');
    const topicIds = topicsRes.rows.map(r => r.id);
    
    for (let i = 0; i < 300; i++) {
      const topic_id = getRandom(topicIds);
      const content = `Согласен с автором. ${getRandom(['Спасибо за информацию!', 'Будем следить за ситуацией.', 'А есть ли официальные подтверждения?'])}`;
      const author_name = `Пользователь ${Math.floor(Math.random() * 9999)}`;
      const likes = Math.floor(Math.random() * 50);
      
      await client.query(
        'INSERT INTO forum_comments (topic_id, content, author_name, likes) VALUES ($1, $2, $3, $4)',
        [topic_id, content, author_name, likes]
      );
    }

    console.log('✅ Massive seed completed successfully! Total ~1000 records added.');
  } catch (err) {
    console.error('Error seeding data:', err.message);
  } finally {
    await client.end();
  }
}

seed();