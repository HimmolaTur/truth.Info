import { Link } from "@/navigation";
import { MessageSquare, Users, AlertCircle, HelpCircle, Plus, Search, Eye, ThumbsUp, Pin, Lock, Activity, Rss, Layers, User } from "lucide-react";
import { HeroBackdrop } from "@/components/HeroBackdrop";
import { LocaleGetSearchForm } from "@/components/LocaleGetSearchForm";
import { query } from "@/lib/db";
import { getLocale, getTranslations } from "next-intl/server";
import { cookies } from "next/headers";
import { slugify } from "@/lib/utils";
import { getSession } from "@/lib/auth";
import Image from "next/image";

const FORUM_HERO_IMG =
  "/images/photo-1580130281320-0ef0754f2bf7.jpg";

type ForumCategoryRow = {
  id: number;
  name: string;
  description: string | null;
  icon: string | null;
  color: string | null;
};

type ForumTopicListRow = {
  id: number;
  title: string;
  author_name: string;
  author_display_name: string | null;
  created_at: Date | string;
  category_name: string | null;
  replies_count: string | number;
  views: number;
  likes: number;
  is_pinned: boolean;
  is_closed: boolean;
  tags: string[] | null;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const iconMap: Record<string, any> = {
  Users,
  MessageSquare,
  AlertCircle,
  HelpCircle,
};

export default async function ForumPage({
  searchParams,
}: {
  searchParams: { category?: string; q?: string; sort?: string; tag?: string; page?: string; limit?: string };
}) {
  const t = await getTranslations("Forum");
  const uiLocale = await getLocale();
  const categoryId = searchParams.category;
  const q = searchParams.q || "";
  const sort = searchParams.sort || "newest";
  const tag = searchParams.tag || "";
  
  const page = parseInt(searchParams.page || "1", 10);
  const limit = parseInt(searchParams.limit || "20", 10);
  const offset = (page - 1) * limit;

  // Получаем категории из базы данных
  const categoriesResult = await query('SELECT * FROM forum_categories ORDER BY id');
  const categories = categoriesResult.rows as ForumCategoryRow[];

  // Базовые условия запроса
  let whereClause = "WHERE 1=1";
  const params: any[] = [];

  if (categoryId) {
    params.push(categoryId);
    whereClause += ` AND t.category_id = $${params.length}`;
  }

  if (q) {
    params.push(`%${q}%`);
    whereClause += ` AND (t.title ILIKE $${params.length} OR t.content ILIKE $${params.length})`;
  }

  if (tag) {
    params.push(tag);
    whereClause += ` AND $${params.length} = ANY(t.tags)`;
  }

  // Получаем общее количество тем для пагинации
  const countQuery = `SELECT COUNT(*) FROM forum_topics t ${whereClause}`;
  const countResult = await query(countQuery, params);
  const totalTopics = parseInt(countResult.rows[0].count, 10);
  const totalPages = Math.ceil(totalTopics / limit);

  // Строим запрос для тем
  let topicsQuery = `
    SELECT t.*, c.name as category_name, usr.display_name as author_display_name,
           (SELECT COUNT(*) FROM forum_comments WHERE topic_id = t.id) as replies_count
    FROM forum_topics t
    LEFT JOIN forum_categories c ON t.category_id = c.id
    LEFT JOIN users usr ON t.user_id = usr.id
    ${whereClause}
  `;

  // Сортировка: сначала закрепленные, затем по выбранному критерию
  let orderBy = "t.is_pinned DESC, ";
  if (sort === "popular") {
    orderBy += "t.views DESC, t.created_at DESC";
  } else if (sort === "likes") {
    orderBy += "t.likes DESC, t.created_at DESC";
  } else {
    orderBy += "t.created_at DESC";
  }

  // Создаем новый массив параметров для основного запроса
  const topicsParams = [...params];
  topicsParams.push(limit, offset);
  topicsQuery += ` ORDER BY ${orderBy} LIMIT $${topicsParams.length - 1} OFFSET $${topicsParams.length}`;

  const topicsResult = await query(topicsQuery, topicsParams);
  const recentTopics = topicsResult.rows as ForumTopicListRow[];

  // Обновляем онлайн-статус и получаем количество пользователей онлайн
  const cookieStore = cookies();
  const sessionId = cookieStore.get('anon_session')?.value;
  if (sessionId) {
    await query(`
      INSERT INTO user_profiles (session_id, last_active_at) 
      VALUES ($1, NOW()) 
      ON CONFLICT (session_id) 
      DO UPDATE SET last_active_at = NOW()
    `, [sessionId]);
  }
  const onlineRes = await query(`SELECT COUNT(*) FROM user_profiles WHERE last_active_at > NOW() - INTERVAL '5 minutes'`);
  const onlineCount = onlineRes.rows[0].count;

  const userSession = await getSession();

  const buildUrl = (newParams: Record<string, string | number | null>) => {
    const urlParams = new URLSearchParams();
    if (categoryId) urlParams.set("category", categoryId);
    if (q) urlParams.set("q", q);
    if (sort !== "newest") urlParams.set("sort", sort);
    if (tag) urlParams.set("tag", tag);
    if (limit !== 20) urlParams.set("limit", limit.toString());
    if (page !== 1) urlParams.set("page", page.toString());

    Object.entries(newParams).forEach(([key, value]) => {
      if (value === null || value === undefined || value === "") {
        urlParams.delete(key);
      } else {
        urlParams.set(key, value.toString());
      }
    });

    const queryString = urlParams.toString();
    return `/forum${queryString ? `?${queryString}` : ""}`;
  };

  return (
    <div className="flex flex-col w-full">
      {/* Full-width Hero for Forum */}
      <section className="relative w-full py-16 sm:py-24 bg-black text-white overflow-hidden">
        <HeroBackdrop imageUrl={FORUM_HERO_IMG} className="opacity-30" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold mb-4 sm:mb-6 drop-shadow-lg mt-8">{t("title")}</h1>
          <p className="text-lg sm:text-xl text-gray-300 font-medium mb-8 sm:mb-10">{t("desc")}</p>
          
          {userSession ? (
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-2xl max-w-md mx-auto shadow-2xl">
              <Link href="/forum/profile" className="flex items-center gap-3 hover:opacity-80 transition group">
                <div className="relative">
                  <Image 
                    src={userSession.avatar_url || `/avatars/avatar1.svg`} 
                    alt={userSession.display_name || userSession.username}
                    width={48} 
                    height={48} 
                    className="rounded-full bg-white/20 border-2 border-transparent group-hover:border-white transition"
                  />
                </div>
                <div className="text-left">
                  <div className="text-sm text-gray-300">{t("forumHeroYourCipher")}</div>
                  <div className="font-bold text-lg">{userSession.display_name}</div>
                </div>
              </Link>
              <div className="flex gap-2 w-full sm:w-auto">
                <Link href="/forum/new" className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-blue-500 transition">
                  <Plus className="w-5 h-5" />
                  {t("profileCreateShort")}
                </Link>
                <Link href="/forum/profile" className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 bg-white/10 text-white px-4 py-2 rounded-xl font-bold hover:bg-white/20 transition border border-white/20">
                  <User className="w-5 h-5" />
                </Link>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/forum/login" className="inline-flex items-center gap-2 sm:gap-3 bg-blue-600 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-bold text-base sm:text-lg hover:bg-blue-500 transition shadow-2xl">
                {t("authLogin")}
              </Link>
              <Link href="/forum/register" className="inline-flex items-center gap-2 sm:gap-3 bg-white/10 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-bold text-base sm:text-lg hover:bg-white/20 transition shadow-2xl border border-white/20">
                {t("authRegister")}
              </Link>
            </div>
          )}
        </div>
      </section>

      <div className="max-w-6xl mx-auto w-full py-16 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 mb-8">
          {/* Карточка "Все темы" */}
          <Link 
            href="/forum" 
            className={`group relative p-3 sm:p-4 rounded-xl border transition-all duration-200 cursor-pointer overflow-hidden flex flex-col items-center text-center h-full
              ${!categoryId 
                ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500 ring-2 ring-blue-500/20 shadow-md' 
                : 'bg-white dark:bg-neutral-900 hover:border-blue-300 hover:shadow-md hover:-translate-y-1'}`}
          >
            {!categoryId && (
              <div className="absolute top-2 right-2 bg-blue-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow-sm">
                {t("forumSelected")}
              </div>
            )}
            <div className={`p-2.5 rounded-full inline-flex mb-2 transition-transform duration-200 group-hover:scale-110 ${!categoryId ? 'bg-blue-100 dark:bg-blue-800/40' : 'bg-gray-50 dark:bg-neutral-800'}`}>
              <Layers className={`w-5 h-5 sm:w-6 sm:h-6 ${!categoryId ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'}`} />
            </div>
            <h3 className={`text-sm sm:text-base font-bold mb-1 w-full truncate ${!categoryId ? 'text-blue-700 dark:text-blue-300' : 'text-gray-900 dark:text-white'}`}>
              {t("allTopics")}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1 w-full mt-auto">
              {t("allTopicsDesc")}
            </p>
          </Link>

          {categories.map((cat) => {
            const Icon = iconMap[cat.icon ?? ""] || MessageSquare;
            const isActive = categoryId === String(cat.id);
            return (
              <Link 
                href={isActive ? "/forum" : `/forum?category=${cat.id}`} 
                key={cat.id} 
                className={`group relative p-3 sm:p-4 rounded-xl border transition-all duration-200 cursor-pointer overflow-hidden flex flex-col items-center text-center h-full
                  ${isActive 
                    ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500 ring-2 ring-blue-500/20 shadow-md' 
                    : 'bg-white dark:bg-neutral-900 hover:border-blue-300 hover:shadow-md hover:-translate-y-1'}`}
              >
                {isActive && (
                  <div className="absolute top-2 right-2 bg-blue-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow-sm">
                    {t("forumSelected")}
                  </div>
                )}
                <div className={`p-2.5 rounded-full inline-flex mb-2 transition-transform duration-200 group-hover:scale-110 ${isActive ? 'bg-blue-100 dark:bg-blue-800/40' : 'bg-gray-50 dark:bg-neutral-800'}`}>
                  <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${isActive ? 'text-blue-600 dark:text-blue-400' : cat.color || 'text-gray-600 dark:text-gray-400'}`} />
                </div>
                <h3 className={`text-sm sm:text-base font-bold mb-1 w-full truncate ${isActive ? 'text-blue-700 dark:text-blue-300' : 'text-gray-900 dark:text-white'}`}>
                  {cat.name}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1 w-full mt-auto">
                  {cat.description}
                </p>
              </Link>
            );
          })}
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-10">
          <LocaleGetSearchForm basePath="/forum" className="flex-1 flex flex-col sm:flex-row gap-3">
            {categoryId && <input type="hidden" name="category" value={categoryId} />}
            {sort && <input type="hidden" name="sort" value={sort} />}
            {tag && <input type="hidden" name="tag" value={tag} />}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                name="q"
                defaultValue={q}
                placeholder={t("searchPlaceholder")}
                className="w-full border rounded-md pl-10 pr-4 py-3 bg-white dark:bg-neutral-900 focus:ring-2 focus:ring-blue-500 outline-none shadow-sm"
              />
            </div>
            <button
              type="submit"
              className="bg-blue-600 text-white px-6 py-3 rounded-md font-medium hover:bg-blue-700 transition shadow-sm w-full sm:w-auto"
            >
              {t("searchBtn")}
            </button>
          </LocaleGetSearchForm>
          <div className="flex flex-wrap gap-2 shrink-0">
            <Link href={buildUrl({ sort: 'newest', page: 1 })} className={`px-4 py-3 border rounded-md text-sm font-medium ${sort === 'newest' ? 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-400' : 'bg-white dark:bg-neutral-900 hover:bg-gray-50 dark:hover:bg-neutral-800'}`}>{t("forumSortNewest")}</Link>
            <Link href={buildUrl({ sort: 'popular', page: 1 })} className={`px-4 py-3 border rounded-md text-sm font-medium ${sort === 'popular' ? 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-400' : 'bg-white dark:bg-neutral-900 hover:bg-gray-50 dark:hover:bg-neutral-800'}`}>{t("forumSortPopular")}</Link>
            <Link href={buildUrl({ sort: 'likes', page: 1 })} className={`px-4 py-3 border rounded-md text-sm font-medium ${sort === 'likes' ? 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-400' : 'bg-white dark:bg-neutral-900 hover:bg-gray-50 dark:hover:bg-neutral-800'}`}>{t("forumSortLikes")}</Link>
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-900 rounded-xl border shadow-sm overflow-hidden">
          <div className="p-4 border-b bg-gray-50 dark:bg-neutral-800/50 font-bold flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <span>{t("latestTopics")} {tag && <span className="ml-2 font-normal text-sm bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300 px-2 py-1 rounded-full">#{tag}</span>}</span>
            <div className="flex flex-wrap items-center gap-4">
              <div className="text-sm font-normal text-gray-500 flex items-center gap-2">
                {t("forumPerPageLabel")}
                {[10, 20, 50].map(l => (
                  <Link 
                    key={l} 
                    href={buildUrl({ limit: l, page: 1 })}
                    className={`px-2 py-1 rounded ${limit === l ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 font-bold' : 'hover:bg-gray-200 dark:hover:bg-neutral-700'}`}
                  >
                    {l}
                  </Link>
                ))}
              </div>
              {(categoryId || q || tag || sort !== 'newest') && (
                <Link href="/forum" className="text-sm text-blue-600 hover:underline font-normal">
                  {t("resetFilter")}
                </Link>
              )}
            </div>
          </div>
          <div className="divide-y dark:divide-neutral-800">
          {recentTopics.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              {t("noTopics")}
            </div>
          ) : (
            recentTopics.map((topic) => (
              <Link href={`/forum/${topic.id}-${slugify(topic.title)}`} key={topic.id} className="block p-4 hover:bg-gray-50 dark:hover:bg-neutral-800/50 transition">
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                  <div className="w-full">
                    <div className="flex items-center gap-2 mb-2">
                      {topic.is_pinned && <Pin className="w-4 h-4 text-orange-500 fill-orange-500 shrink-0" />}
                      {topic.is_closed && <Lock className="w-4 h-4 text-gray-500 shrink-0" />}
                      <h3 className="text-lg font-medium text-blue-600 dark:text-blue-400 break-words">
                        {topic.title}
                      </h3>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 mb-2">
                      <span className="bg-gray-100 dark:bg-neutral-800 px-2 py-1 rounded">
                        {topic.category_name}
                      </span>
                      <span>{t("author", { name: topic.author_display_name || topic.author_name })}</span>
                      <span>{new Date(topic.created_at).toLocaleString(uiLocale, { hour: "2-digit", minute: "2-digit" })}</span>
                      <span className="flex items-center gap-1 ml-0 sm:ml-2"><Eye className="w-3 h-3"/> {topic.views || 0}</span>
                      <span className="flex items-center gap-1"><ThumbsUp className="w-3 h-3"/> {topic.likes || 0}</span>
                    </div>
                    {topic.tags && topic.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {topic.tags.map(tag => (
                          <span key={tag} className="text-[10px] bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 px-2 py-0.5 rounded-full">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex sm:flex-col items-center sm:items-center justify-between sm:justify-center bg-gray-50 dark:bg-neutral-800 px-3 py-2 sm:py-1 rounded-lg w-full sm:w-auto shrink-0">
                    <div className="text-sm font-bold">{topic.replies_count}</div>
                    <div className="text-xs text-gray-500 ml-2 sm:ml-0">{t("answersCount")}</div>
                  </div>
                </div>
              </Link>
            ))
          )}
          </div>
        </div>

        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-4 mt-8">
            {page > 1 ? (
              <Link href={buildUrl({ page: page - 1 })} className="px-4 py-2 border rounded-md hover:bg-gray-50 dark:hover:bg-neutral-800 transition font-medium">
                {t("forumPrev")}
              </Link>
            ) : (
              <div className="px-4 py-2 border rounded-md opacity-50 cursor-not-allowed font-medium">{t("forumPrev")}</div>
            )}
            <span className="text-sm font-medium text-gray-500">
              {t("forumPageOf", { page, totalPages })}
            </span>
            {page < totalPages ? (
              <Link href={buildUrl({ page: page + 1 })} className="px-4 py-2 border rounded-md hover:bg-gray-50 dark:hover:bg-neutral-800 transition font-medium">
                {t("forumNext")}
              </Link>
            ) : (
              <div className="px-4 py-2 border rounded-md opacity-50 cursor-not-allowed font-medium">{t("forumNext")}</div>
            )}
          </div>
        )}

        {/* Footer info (Online & RSS) */}
        <div className="mt-16 pt-8 border-t dark:border-neutral-800 flex flex-wrap justify-center sm:justify-between items-center gap-4 text-sm text-gray-500">
          <div className="flex items-center gap-3">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
            </span>
            <span>
              {t("forumUsersOnline")}{" "}
              <span className="font-bold text-gray-900 dark:text-white">{onlineCount}</span>
            </span>
          </div>
          <a href={`/api/rss?locale=${encodeURIComponent(uiLocale)}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-orange-500 hover:text-orange-600 transition font-medium">
            <Rss className="w-4 h-4" />
            {t("forumRssLink")}
          </a>
        </div>
      </div>
    </div>
  );
}