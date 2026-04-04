const fs = require('fs');
const path = require('path');

const ru = {
  Navbar: {
    title: "Правда.Инфо",
    news: "Новости",
    factcheck: "Фактчекинг",
    map: "Карта",
    timeline: "Хронология",
    forum: "Форум",
    share: "Поделиться историей"
  },
  Metadata: {
    title: "Правда.Инфо | Проверенная информация и фактчекинг",
    description: "Платформа для получения проверенной информации о событиях, хронологии, географии и фактчекинга."
  },
  Footer: {
    copyright: "© 2026 Правда.Инфо.",
    adminLogin: "Вход для редакторов",
    description: "Платформа для получения проверенной информации о событиях, хронологии, географии и фактчекинга. Мы помогаем видеть реальную картину происходящего.",
    navigation: "Навигация",
    legal: "Правовая информация",
    privacy: "Политика конфиденциальности",
    terms: "Условия использования",
    cookie: "Использование Cookie"
  },
  Home: {
    heroTitle1: "Проверенная информация",
    heroTitle2: "без фейков и цензуры",
    heroDesc: "Платформа для сбора фактов, хронологии событий и разоблачения дезинформации. Мы помогаем видеть реальную картину происходящего.",
    readNews: "Читать новости",
    factcheck: "Разбор фейков",
    mainTopics: "Главные темы",
    allNews: "Все новости",
    toolsTitle: "Инструменты платформы",
    toolsDesc: "Всё необходимое для поиска правды в одном месте.",
    toolFactcheckTitle: "Фактчекинг",
    toolFactcheckDesc: "Проверяем сомнительные новости, находим первоисточники и публикуем опровержения с доказательствами.",
    toolMapTitle: "Карта событий",
    toolMapDesc: "География событий в реальном времени. Точки на карте с проверенными фото и видео материалами.",
    toolTimelineTitle: "Хронология",
    toolTimelineDesc: "Структурированная лента событий по дням и месяцам для понимания причинно-следственных связей.",
    toolSubmitTitle: "Истории",
    toolSubmitDesc: "Платформа для безопасной публикации личных историй с возможностью анонимности.",
    latestEvents: "Последние события",
    important: "Важное",
    ctaTitle: "Станьте частью сообщества",
    ctaDesc: "Помогите нам собирать правдивую информацию. Если вы стали свидетелем важных событий, поделитесь своей историей анонимно.",
    shareStory: "Поделиться историей"
  },
  NewsCarousel: {
    urgent: "Срочно",
    readMore: "Читать подробнее"
  },
  News: {
    title: "Лента новостей",
    desc: "Актуальная и проверенная информация о событиях в реальном времени.",
    searchPlaceholder: "Поиск новостей по заголовку или тексту...",
    searchBtn: "Найти",
    noResults: "По вашему запросу ничего не найдено.",
    important: "Важное",
    back: "Назад",
    forward: "Вперед",
    page: "Страница {page} из {totalPages}",
    backToNews: "Назад к новостям",
    tags: "Теги:"
  },
  Forum: {
    title: "Форум и Сообщество",
    desc: "Безопасное пространство для обсуждений, взаимопомощи и поиска ответов.",
    createTopic: "Создать тему",
    latestTopics: "Последние обсуждения",
    noTopics: "Пока нет ни одной темы. Будьте первым!",
    author: "Автор: {name}",
    answersCount: "ответов",
    backToTopics: "Назад к списку тем",
    authorLabel: "{name} (Автор)",
    answers: "Ответы ({count})",
    noAnswers: "Пока нет ответов. Будьте первым!",
    writeAnswer: "Написать ответ",
    commentPlaceholder: "Ваш комментарий...",
    namePlaceholder: "Ваше имя (Аноним)",
    send: "Отправить",
    newTopicTitle: "Создать новую тему",
    categoryLabel: "Категория",
    categoryPlaceholder: "Выберите категорию...",
    topicTitleLabel: "Заголовок темы",
    topicTitlePlaceholder: "О чем вы хотите поговорить?",
    messageLabel: "Сообщение",
    messagePlaceholder: "Подробно опишите ваш вопрос или ситуацию...",
    nameLabel: "Ваше имя (необязательно)",
    publishTopic: "Опубликовать тему",
    anonymous: "Аноним",
    resetFilter: "Сбросить фильтр",
    searchPlaceholder: "Поиск тем...",
    searchBtn: "Найти",
    views: "Просмотры"
  },
  Timeline: {
    title: "Хронология событий",
    desc: "Структурированная лента событий для понимания причинно-следственных связей.",
    noEvents: "Событий пока нет."
  },
  Submit: {
    successTitle: "Спасибо за вашу историю!",
    successDesc: "Она была успешно отправлена и сейчас находится на модерации. Мы проверим информацию и опубликуем её в ближайшее время.",
    backHome: "Вернуться на главную",
    title: "Поделиться историей",
    desc: "Ваша история важна. Мы гарантируем анонимность, если вы этого хотите. Все материалы проходят проверку перед публикацией.",
    titleLabel: "Заголовок (краткая суть)",
    titlePlaceholder: "Что произошло?",
    storyLabel: "Ваша история",
    storyPlaceholder: "Опишите события максимально подробно...",
    linksLabel: "Ссылки на фото/видео или источники",
    anonLabel: "Опубликовать анонимно",
    send: "Отправить на проверку"
  },
  Map: {
    loading: "Загрузка карты...",
    title: "Интерактивная карта",
    desc: "География событий с привязкой к местности"
  },
  Factcheck: {
    title: "Фактчекинг",
    desc: "Разбор популярных фейков и дезинформации с доказательствами и ссылками на первоисточники.",
    noFactchecks: "Разборов пока нет.",
    fake: "Фейк",
    refutation: "Опровержение",
    sources: "Источники:"
  },
  Admin: {
    title: "Панель редактора",
    desc: "Доступ только для верифицированных авторов и фактчекеров.",
    loginTitle: "Вход в систему",
    passwordPlaceholder: "Пароль",
    loginBtn: "Войти (Supabase Auth)"
  },
  Privacy: {
    title: "Политика конфиденциальности",
    p1: "Ваша конфиденциальность очень важна для нас. Мы стремимся защищать вашу личную информацию и ваше право на конфиденциальность.",
    p2: "Мы собираем только ту информацию, которую вы добровольно предоставляете нам при использовании платформы, включая анонимные истории и материалы.",
    p3: "Мы не передаем ваши данные третьим лицам без вашего явного согласия, за исключением случаев, предусмотренных законом."
  },
  Terms: {
    title: "Условия использования",
    p1: "Используя платформу Правда.Инфо, вы соглашаетесь с настоящими условиями. Платформа предназначена для обмена проверенной информацией и фактчекинга.",
    p2: "Пользователи обязуются не публиковать заведомо ложную информацию, спам или материалы, нарушающие законодательство.",
    p3: "Администрация оставляет за собой право модерировать, изменять или удалять любой контент, который нарушает правила сообщества."
  },
  Cookie: {
    title: "Использование Cookie",
    p1: "Мы используем файлы cookie для улучшения работы нашего сайта и повышения удобства пользователей.",
    p2: "Файлы cookie помогают нам анализировать трафик, запоминать ваши языковые предпочтения и настройки темы (светлая/темная).",
    p3: "Вы можете отключить использование cookie в настройках вашего браузера, однако это может повлиять на функциональность некоторых элементов сайта."
  },
  NotFound: {
    title: "Страница не найдена",
    desc: "Возможно, она была удалена, перемещена или вы ввели неверный адрес.",
    backHome: "Вернуться на главную",
    search: "Искать на сайте"
  },
  Error: {
    title: "Что-то пошло не так",
    desc: "Произошла непредвиденная ошибка на сервере. Мы уже работаем над её устранением.",
    tryAgain: "Попробовать снова",
    backHome: "Вернуться на главную"
  }
};

const en = {
  Navbar: {
    title: "Truth.Info",
    news: "News",
    factcheck: "Factchecking",
    map: "Map",
    timeline: "Timeline",
    forum: "Forum",
    share: "Share Story"
  },
  Metadata: {
    title: "Truth.Info | Verified Information and Factchecking",
    description: "Platform for getting verified information about events, timeline, geography, and factchecking."
  },
  Footer: {
    copyright: "© 2026 Truth.Info.",
    adminLogin: "Editor Login",
    description: "Platform for getting verified information about events, timeline, geography, and factchecking. We help you see the real picture of what is happening.",
    navigation: "Navigation",
    legal: "Legal Information",
    privacy: "Privacy Policy",
    terms: "Terms of Use",
    cookie: "Cookie Usage"
  },
  Home: {
    heroTitle1: "Verified Information",
    heroTitle2: "without fakes and censorship",
    heroDesc: "A platform for gathering facts, event timelines, and exposing disinformation. We help you see the real picture.",
    readNews: "Read News",
    factcheck: "Factcheck",
    mainTopics: "Main Topics",
    allNews: "All News",
    toolsTitle: "Platform Tools",
    toolsDesc: "Everything you need to find the truth in one place.",
    toolFactcheckTitle: "Factchecking",
    toolFactcheckDesc: "We verify dubious news, find original sources, and publish refutations with evidence.",
    toolMapTitle: "Event Map",
    toolMapDesc: "Geography of events in real-time. Points on the map with verified photo and video materials.",
    toolTimelineTitle: "Timeline",
    toolTimelineDesc: "Structured feed of events by days and months to understand cause-and-effect relationships.",
    toolSubmitTitle: "Stories",
    toolSubmitDesc: "A platform for safely publishing personal stories with the option of anonymity.",
    latestEvents: "Latest Events",
    important: "Important",
    ctaTitle: "Become part of the community",
    ctaDesc: "Help us gather truthful information. If you witnessed important events, share your story anonymously.",
    shareStory: "Share Story"
  },
  NewsCarousel: {
    urgent: "Urgent",
    readMore: "Read more"
  },
  News: {
    title: "News Feed",
    desc: "Up-to-date and verified information about events in real-time.",
    searchPlaceholder: "Search news by title or text...",
    searchBtn: "Search",
    noResults: "Nothing found for your query.",
    important: "Important",
    back: "Back",
    forward: "Forward",
    page: "Page {page} of {totalPages}",
    backToNews: "Back to news",
    tags: "Tags:"
  },
  Forum: {
    title: "Forum and Community",
    desc: "A safe space for discussions, mutual assistance, and finding answers.",
    createTopic: "Create Topic",
    latestTopics: "Latest Discussions",
    noTopics: "No topics yet. Be the first!",
    author: "Author: {name}",
    answersCount: "answers",
    backToTopics: "Back to topic list",
    authorLabel: "{name} (Author)",
    answers: "Answers ({count})",
    noAnswers: "No answers yet. Be the first!",
    writeAnswer: "Write an answer",
    commentPlaceholder: "Your comment...",
    namePlaceholder: "Your name (Anonymous)",
    send: "Send",
    newTopicTitle: "Create new topic",
    categoryLabel: "Category",
    categoryPlaceholder: "Select a category...",
    topicTitleLabel: "Topic Title",
    topicTitlePlaceholder: "What do you want to talk about?",
    messageLabel: "Message",
    messagePlaceholder: "Describe your question or situation in detail...",
    nameLabel: "Your name (optional)",
    publishTopic: "Publish topic",
    anonymous: "Anonymous",
    resetFilter: "Reset filter",
    searchPlaceholder: "Search topics...",
    searchBtn: "Search",
    views: "Views"
  },
  Timeline: {
    title: "Event Timeline",
    desc: "Structured feed of events to understand cause-and-effect relationships.",
    noEvents: "No events yet."
  },
  Submit: {
    successTitle: "Thank you for your story!",
    successDesc: "It has been successfully submitted and is currently under moderation. We will verify the information and publish it soon.",
    backHome: "Return to Home",
    title: "Share a Story",
    desc: "Your story is important. We guarantee anonymity if you wish. All materials are verified before publication.",
    titleLabel: "Title (brief summary)",
    titlePlaceholder: "What happened?",
    storyLabel: "Your story",
    storyPlaceholder: "Describe the events in as much detail as possible...",
    linksLabel: "Links to photos/videos or sources",
    anonLabel: "Publish anonymously",
    send: "Send for review"
  },
  Map: {
    loading: "Loading map...",
    title: "Interactive Map",
    desc: "Geography of events tied to locations"
  },
  Factcheck: {
    title: "Factchecking",
    desc: "Analysis of popular fakes and disinformation with evidence and links to original sources.",
    noFactchecks: "No factchecks yet.",
    fake: "Fake",
    refutation: "Refutation",
    sources: "Sources:"
  },
  Admin: {
    title: "Editor Panel",
    desc: "Access only for verified authors and factcheckers.",
    loginTitle: "Login",
    passwordPlaceholder: "Password",
    loginBtn: "Login (Supabase Auth)"
  },
  Privacy: {
    title: "Privacy Policy",
    p1: "Your privacy is very important to us. We are committed to protecting your personal information and your right to privacy.",
    p2: "We only collect information that you voluntarily provide to us when using the platform, including anonymous stories and materials.",
    p3: "We do not share your data with third parties without your explicit consent, except as required by law."
  },
  Terms: {
    title: "Terms of Use",
    p1: "By using the Truth.Info platform, you agree to these terms. The platform is designed for sharing verified information and factchecking.",
    p2: "Users agree not to publish knowingly false information, spam, or materials that violate the law.",
    p3: "The administration reserves the right to moderate, modify, or remove any content that violates community guidelines."
  },
  Cookie: {
    title: "Cookie Policy",
    p1: "We use cookies to improve our website and enhance user experience.",
    p2: "Cookies help us analyze traffic, remember your language preferences, and theme settings (light/dark).",
    p3: "You can disable cookies in your browser settings, but this may affect the functionality of some site elements."
  },
  NotFound: {
    title: "Page Not Found",
    desc: "It might have been removed, moved, or you entered the wrong address.",
    backHome: "Return to Home",
    search: "Search on site"
  },
  Error: {
    title: "Something went wrong",
    desc: "An unexpected error occurred on the server. We are already working on fixing it.",
    tryAgain: "Try again",
    backHome: "Return to Home"
  }
};

const uk = {
  Navbar: {
    title: "Правда.Інфо",
    news: "Новини",
    factcheck: "Фактчекінг",
    map: "Карта",
    timeline: "Хронологія",
    forum: "Форум",
    share: "Поділитися історією"
  },
  Metadata: {
    title: "Правда.Інфо | Перевірена інформація та фактчекінг",
    description: "Платформа для отримання перевіреної інформації про події, хронології, географії та фактчекінгу."
  },
  Footer: {
    copyright: "© 2026 Правда.Інфо.",
    adminLogin: "Вхід для редакторів",
    description: "Платформа для отримання перевіреної інформації про події, хронології, географії та фактчекінгу. Ми допомагаємо бачити реальну картину того, що відбувається.",
    navigation: "Навігація",
    legal: "Правова інформація",
    privacy: "Політика конфіденційності",
    terms: "Умови використання",
    cookie: "Використання Cookie"
  },
  Home: {
    heroTitle1: "Перевірена інформація",
    heroTitle2: "без фейків та цензури",
    heroDesc: "Платформа для збору фактів, хронології подій та викриття дезінформації. Ми допомагаємо бачити реальну картину того, що відбувається.",
    readNews: "Читати новини",
    factcheck: "Розбір фейків",
    mainTopics: "Головні теми",
    allNews: "Всі новини",
    toolsTitle: "Інструменти платформи",
    toolsDesc: "Все необхідне для пошуку правди в одному місці.",
    toolFactcheckTitle: "Фактчекінг",
    toolFactcheckDesc: "Перевіряємо сумнівні новини, знаходимо першоджерела та публікуємо спростування з доказами.",
    toolMapTitle: "Карта подій",
    toolMapDesc: "Географія подій у реальному часі. Точки на карті з перевіреними фото та відео матеріалами.",
    toolTimelineTitle: "Хронологія",
    toolTimelineDesc: "Структурована стрічка подій за днями та місяцями для розуміння причинно-наслідкокових зв'язків.",
    toolSubmitTitle: "Історії",
    toolSubmitDesc: "Платформа для безпечної публікації особистих історій з можливістю анонімності.",
    latestEvents: "Останні події",
    important: "Важливе",
    ctaTitle: "Станьте частиною спільноти",
    ctaDesc: "Допоможіть нам збирати правдиву інформацію. Якщо ви стали свідком важливих подій, поділіться своєю історією анонімно.",
    shareStory: "Поділитися історією"
  },
  NewsCarousel: {
    urgent: "Терміново",
    readMore: "Читати детальніше"
  },
  News: {
    title: "Стрічка новин",
    desc: "Актуальна та перевірена інформація про події в реальному часі.",
    searchPlaceholder: "Пошук новин за заголовком або текстом...",
    searchBtn: "Знайти",
    noResults: "За вашим запитом нічого не знайдено.",
    important: "Важливе",
    back: "Назад",
    forward: "Вперед",
    page: "Сторінка {page} з {totalPages}",
    backToNews: "Назад до новин",
    tags: "Теги:"
  },
  Forum: {
    title: "Форум та Спільнота",
    desc: "Безпечний простір для обговорень, взаємодопомоги та пошуку відповідей.",
    createTopic: "Створити тему",
    latestTopics: "Останні обговорення",
    noTopics: "Поки немає жодної теми. Будьте першим!",
    author: "Автор: {name}",
    answersCount: "відповідей",
    backToTopics: "Назад до списку тем",
    authorLabel: "{name} (Автор)",
    answers: "Відповіді ({count})",
    noAnswers: "Поки немає відповідей. Будьте першим!",
    writeAnswer: "Написати відповідь",
    commentPlaceholder: "Ваш коментар...",
    namePlaceholder: "Ваше ім'я (Анонім)",
    send: "Відправити",
    newTopicTitle: "Створити нову тему",
    categoryLabel: "Категорія",
    categoryPlaceholder: "Оберіть категорію...",
    topicTitleLabel: "Заголовок теми",
    topicTitlePlaceholder: "Про що ви хочете поговорити?",
    messageLabel: "Повідомлення",
    messagePlaceholder: "Детально опишіть ваше питання або ситуацію...",
    nameLabel: "Ваше ім'я (необов'язково)",
    publishTopic: "Опублікувати тему",
    anonymous: "Анонім",
    resetFilter: "Скинути фільтр",
    searchPlaceholder: "Пошук тем...",
    searchBtn: "Знайти",
    views: "Перегляди"
  },
  Timeline: {
    title: "Хронологія подій",
    desc: "Структурована стрічка подій для розуміння причинно-наслідкових зв'язків.",
    noEvents: "Подій поки немає."
  },
  Submit: {
    successTitle: "Дякуємо за вашу історію!",
    successDesc: "Вона була успішно відправлена і зараз знаходиться на модерації. Ми перевіримо інформацію та опублікуємо її найближчим часом.",
    backHome: "Повернутися на головну",
    title: "Поділитися історією",
    desc: "Ваша історія важлива. Ми гарантуємо анонімність, якщо ви цього хочете. Всі матеріали проходять перевірку перед публікацією.",
    titleLabel: "Заголовок (коротка суть)",
    titlePlaceholder: "Що сталося?",
    storyLabel: "Ваша історія",
    storyPlaceholder: "Опишіть події максимально детально...",
    linksLabel: "Посилання на фото/відео або джерела",
    anonLabel: "Опублікувати анонімно",
    send: "Відправити на перевірку"
  },
  Map: {
    loading: "Завантаження карти...",
    title: "Інтерактивна карта",
    desc: "Географія подій з прив'язкою до місцевості"
  },
  Factcheck: {
    title: "Фактчекінг",
    desc: "Розбір популярних фейків та дезінформації з доказами та посиланнями на першоджерела.",
    noFactchecks: "Розборів поки немає.",
    fake: "Фейк",
    refutation: "Спростування",
    sources: "Джерела:"
  },
  Admin: {
    title: "Панель редактора",
    desc: "Доступ тільки для верифікованих авторів та фактчекерів.",
    loginTitle: "Вхід в систему",
    passwordPlaceholder: "Пароль",
    loginBtn: "Увійти (Supabase Auth)"
  },
  Privacy: {
    title: "Політика конфіденційності",
    p1: "Ваша конфіденційність дуже важлива для нас. Ми прагнемо захищати вашу особисту інформацію та ваше право на конфіденційність.",
    p2: "Ми збираємо лише ту інформацію, яку ви добровільно надаєте нам при використанні платформи, включаючи анонімні історії та матеріали.",
    p3: "Ми не передаємо ваші дані третім особам без вашої явної згоди, за винятком випадків, передбачених законом."
  },
  Terms: {
    title: "Умови використання",
    p1: "Використовуючи платформу Правда.Інфо, ви погоджуєтесь з цими умовами. Платформа призначена для обміну перевіреною інформацією та фактчекінгу.",
    p2: "Користувачі зобов'язуються не публікувати завідомо неправдиву інформацію, спам або матеріали, що порушують законодавство.",
    p3: "Адміністрація залишає за собою право модерувати, змінювати або видаляти будь-який контент, який порушує правила спільноти."
  },
  Cookie: {
    title: "Використання Cookie",
    p1: "Ми використовуємо файли cookie для покращення роботи нашого сайту та підвищення зручності користувачів.",
    p2: "Файли cookie допомагають нам аналізувати трафік, запам'ятовувати ваші мовні налаштування та тему (світла/темна).",
    p3: "Ви можете вимкнути використання cookie в налаштуваннях вашого браузера, однак це може вплинути на функціональність деяких елементів сайту."
  },
  NotFound: {
    title: "Сторінку не знайдено",
    desc: "Можливо, вона була видалена, переміщена або ви ввели неправильну адресу.",
    backHome: "Повернутися на головну",
    search: "Шукати на сайті"
  },
  Error: {
    title: "Щось пішло не так",
    desc: "Сталася непередбачена помилка на сервері. Ми вже працюємо над її усуненням.",
    tryAgain: "Спробувати знову",
    backHome: "Повернутися на головну"
  }
};

const de = {
  Navbar: {
    title: "Wahrheit.Info",
    news: "Nachrichten",
    factcheck: "Faktencheck",
    map: "Karte",
    timeline: "Chronik",
    forum: "Forum",
    share: "Geschichte teilen"
  },
  Metadata: {
    title: "Wahrheit.Info | Verifizierte Informationen und Faktencheck",
    description: "Plattform für verifizierte Informationen über Ereignisse, Chronologie, Geografie und Faktencheck."
  },
  Footer: {
    copyright: "© 2026 Wahrheit.Info.",
    adminLogin: "Redakteurs-Login",
    description: "Plattform für verifizierte Informationen über Ereignisse, Chronologie, Geografie und Faktencheck. Wir helfen Ihnen, das wahre Bild der Geschehnisse zu sehen.",
    navigation: "Navigation",
    legal: "Rechtliche Informationen",
    privacy: "Datenschutzrichtlinie",
    terms: "Nutzungsbedingungen",
    cookie: "Cookie-Nutzung"
  },
  Home: {
    heroTitle1: "Verifizierte Informationen",
    heroTitle2: "ohne Fakes und Zensur",
    heroDesc: "Eine Plattform zum Sammeln von Fakten, Ereignischroniken und zur Aufdeckung von Desinformation. Wir helfen Ihnen, das wahre Bild zu sehen.",
    readNews: "Nachrichten lesen",
    factcheck: "Faktencheck",
    mainTopics: "Hauptthemen",
    allNews: "Alle Nachrichten",
    toolsTitle: "Plattform-Tools",
    toolsDesc: "Alles, was Sie brauchen, um die Wahrheit an einem Ort zu finden.",
    toolFactcheckTitle: "Faktencheck",
    toolFactcheckDesc: "Wir überprüfen zweifelhafte Nachrichten, finden Originalquellen und veröffentlichen Widerlegungen mit Beweisen.",
    toolMapTitle: "Ereigniskarte",
    toolMapDesc: "Geografie der Ereignisse in Echtzeit. Punkte auf der Karte mit verifizierten Foto- und Videomaterialien.",
    toolTimelineTitle: "Chronik",
    toolTimelineDesc: "Strukturierter Feed von Ereignissen nach Tagen und Monaten, um Ursache-Wirkungs-Beziehungen zu verstehen.",
    toolSubmitTitle: "Geschichten",
    toolSubmitDesc: "Eine Plattform zur sicheren Veröffentlichung persönlicher Geschichten mit der Option auf Anonymität.",
    latestEvents: "Neueste Ereignisse",
    important: "Wichtig",
    ctaTitle: "Werden Sie Teil der Gemeinschaft",
    ctaDesc: "Helfen Sie uns, wahrheitsgemäße Informationen zu sammeln. Wenn Sie Zeuge wichtiger Ereignisse wurden, teilen Sie Ihre Geschichte anonym.",
    shareStory: "Geschichte teilen"
  },
  NewsCarousel: {
    urgent: "Dringend",
    readMore: "Mehr lesen"
  },
  News: {
    title: "Nachrichten-Feed",
    desc: "Aktuelle und verifizierte Informationen über Ereignisse in Echtzeit.",
    searchPlaceholder: "Nachrichten nach Titel oder Text durchsuchen...",
    searchBtn: "Suchen",
    noResults: "Nichts zu Ihrer Anfrage gefunden.",
    important: "Wichtig",
    back: "Zurück",
    forward: "Vorwärts",
    page: "Seite {page} von {totalPages}",
    backToNews: "Zurück zu den Nachrichten",
    tags: "Tags:"
  },
  Forum: {
    title: "Forum und Gemeinschaft",
    desc: "Ein sicherer Raum für Diskussionen, gegenseitige Hilfe und die Suche nach Antworten.",
    createTopic: "Thema erstellen",
    latestTopics: "Neueste Diskussionen",
    noTopics: "Noch keine Themen. Seien Sie der Erste!",
    author: "Autor: {name}",
    answersCount: "Antworten",
    backToTopics: "Zurück zur Themenliste",
    authorLabel: "{name} (Autor)",
    answers: "Antworten ({count})",
    noAnswers: "Noch keine Antworten. Seien Sie der Erste!",
    writeAnswer: "Antwort schreiben",
    commentPlaceholder: "Ihr Kommentar...",
    namePlaceholder: "Ihr Name (Anonym)",
    send: "Senden",
    newTopicTitle: "Neues Thema erstellen",
    categoryLabel: "Kategorie",
    categoryPlaceholder: "Wählen Sie eine Kategorie...",
    topicTitleLabel: "Thementitel",
    topicTitlePlaceholder: "Worüber möchten Sie sprechen?",
    messageLabel: "Nachricht",
    messagePlaceholder: "Beschreiben Sie Ihre Frage oder Situation im Detail...",
    nameLabel: "Ihr Name (optional)",
    publishTopic: "Thema veröffentlichen",
    anonymous: "Anonym",
    resetFilter: "Filter zurücksetzen",
    searchPlaceholder: "Themen durchsuchen...",
    searchBtn: "Suchen",
    views: "Aufrufe"
  },
  Timeline: {
    title: "Ereignischronik",
    desc: "Strukturierter Feed von Ereignissen, um Ursache-Wirkungs-Beziehungen zu verstehen.",
    noEvents: "Noch keine Ereignisse."
  },
  Submit: {
    successTitle: "Danke für Ihre Geschichte!",
    successDesc: "Sie wurde erfolgreich eingereicht und wird derzeit moderiert. Wir werden die Informationen überprüfen und bald veröffentlichen.",
    backHome: "Zurück zur Startseite",
    title: "Geschichte teilen",
    desc: "Ihre Geschichte ist wichtig. Wir garantieren Anonymität, wenn Sie dies wünschen. Alle Materialien werden vor der Veröffentlichung überprüft.",
    titleLabel: "Titel (kurze Zusammenfassung)",
    titlePlaceholder: "Was ist passiert?",
    storyLabel: "Ihre Geschichte",
    storyPlaceholder: "Beschreiben Sie die Ereignisse so detailliert wie möglich...",
    linksLabel: "Links zu Fotos/Videos oder Quellen",
    anonLabel: "Anonym veröffentlichen",
    send: "Zur Überprüfung senden"
  },
  Map: {
    loading: "Karte wird geladen...",
    title: "Interaktive Karte",
    desc: "Geografie der Ereignisse mit Ortsbezug"
  },
  Factcheck: {
    title: "Faktencheck",
    desc: "Analyse beliebter Fakes und Desinformation mit Beweisen und Links zu Originalquellen.",
    noFactchecks: "Noch keine Faktenchecks.",
    fake: "Fake",
    refutation: "Widerlegung",
    sources: "Quellen:"
  },
  Admin: {
    title: "Redakteurs-Panel",
    desc: "Zugang nur für verifizierte Autoren und Faktenchecker.",
    loginTitle: "Anmeldung",
    passwordPlaceholder: "Passwort",
    loginBtn: "Anmelden (Supabase Auth)"
  },
  Privacy: {
    title: "Datenschutzrichtlinie",
    p1: "Ihre Privatsphäre ist uns sehr wichtig. Wir verpflichten uns, Ihre persönlichen Daten und Ihr Recht auf Privatsphäre zu schützen.",
    p2: "Wir erfassen nur Informationen, die Sie uns bei der Nutzung der Plattform freiwillig zur Verfügung stellen, einschließlich anonymer Geschichten und Materialien.",
    p3: "Wir geben Ihre Daten nicht ohne Ihre ausdrückliche Zustimmung an Dritte weiter, es sei denn, dies ist gesetzlich vorgeschrieben."
  },
  Terms: {
    title: "Nutzungsbedingungen",
    p1: "Durch die Nutzung der Wahrheit.Info-Plattform stimmen Sie diesen Bedingungen zu. Die Plattform ist für den Austausch verifizierter Informationen und Faktenchecks vorgesehen.",
    p2: "Die Nutzer verpflichten sich, keine wissentlich falschen Informationen, Spam oder rechtswidrigen Materialien zu veröffentlichen.",
    p3: "Die Verwaltung behält sich das Recht vor, Inhalte zu moderieren, zu ändern oder zu entfernen, die gegen die Community-Richtlinien verstoßen."
  },
  Cookie: {
    title: "Cookie-Nutzung",
    p1: "Wir verwenden Cookies, um unsere Website zu verbessern und die Benutzererfahrung zu optimieren.",
    p2: "Cookies helfen uns, den Datenverkehr zu analysieren, Ihre Spracheinstellungen und das Thema (hell/dunkel) zu speichern.",
    p3: "Sie können Cookies in Ihren Browsereinstellungen deaktivieren, dies kann sich jedoch auf die Funktionalität einiger Website-Elemente auswirken."
  },
  NotFound: {
    title: "Seite nicht gefunden",
    desc: "Möglicherweise wurde sie gelöscht, verschoben oder Sie haben die falsche Adresse eingegeben.",
    backHome: "Zurück zur Startseite",
    search: "Auf der Website suchen"
  },
  Error: {
    title: "Etwas ist schief gelaufen",
    desc: "Ein unerwarteter Fehler ist auf dem Server aufgetreten. Wir arbeiten bereits an der Behebung.",
    tryAgain: "Erneut versuchen",
    backHome: "Zurück zur Startseite"
  }
};

fs.writeFileSync(path.join(__dirname, 'messages/ru.json'), JSON.stringify(ru, null, 2));
fs.writeFileSync(path.join(__dirname, 'messages/en.json'), JSON.stringify(en, null, 2));
fs.writeFileSync(path.join(__dirname, 'messages/uk.json'), JSON.stringify(uk, null, 2));
fs.writeFileSync(path.join(__dirname, 'messages/de.json'), JSON.stringify(de, null, 2));

console.log("Translation files generated successfully.");