import { query } from "@/lib/db";
import { redirect } from "@/navigation";
import { redirect as redirectNext } from "next/navigation";
import { Link } from "@/navigation";
import { getSession } from "@/lib/auth";
import { getLocale, getTranslations } from "next-intl/server";
import { ArrowLeft, MessageSquare, ThumbsUp, Layers, Shield, Plus, Bell } from "lucide-react";
import { SignOutButton } from "@/components/SignOutButton";
import Image from "next/image";
import { slugify } from "@/lib/utils";
import { ProfileAccountReveal } from "@/components/forum/ProfileAccountReveal";
import { ProfileSettingsPanel } from "@/components/forum/ProfileSettingsPanel";
import { normalizePresetAvatarUrl } from "@/lib/forumAvatars";

export default async function ProfilePage() {
  const tForum = await getTranslations("Forum");
  const uiLocale = await getLocale();
  const session = await getSession();
  
  if (!session) {
    const locale = await getLocale();
    redirect({ href: "/forum/login", locale: locale as any });
  }

  // Получаем полные данные пользователя
  const userRes = await query('SELECT * FROM users WHERE id = $1', [session?.id]);
  if (userRes.rows.length === 0) {
    const locale = await getLocale();
    redirectNext(
      `/api/auth/clear-nextauth?callbackUrl=${encodeURIComponent(`/${locale}/forum/login`)}`
    );
  }
  const user = userRes.rows[0] as Record<string, unknown> & {
    avatar_url: string | null;
    preferred_locale?: string | null;
    username: string;
    display_name: string;
    created_at: string | Date;
  };
  const avatarForSettings = normalizePresetAvatarUrl(
    typeof user.avatar_url === "string" ? user.avatar_url : null
  );
  const prefLocale =
    typeof user.preferred_locale === "string" && user.preferred_locale.trim()
      ? user.preferred_locale.trim()
      : null;

  // Получаем темы пользователя
  const topicsRes = await query(`
    SELECT t.*, c.name as category_name,
           (SELECT COUNT(*) FROM forum_comments WHERE topic_id = t.id) as replies_count
    FROM forum_topics t
    LEFT JOIN forum_categories c ON t.category_id = c.id
    WHERE t.user_id = $1
    ORDER BY t.created_at DESC
  `, [session?.id]);
  const topics = topicsRes.rows;

  // Получаем комментарии пользователя
  const commentsRes = await query(`
    SELECT c.*, t.title as topic_title
    FROM forum_comments c
    JOIN forum_topics t ON c.topic_id = t.id
    WHERE c.user_id = $1
    ORDER BY c.created_at DESC
  `, [session?.id]);
  const comments = commentsRes.rows;

  // Получаем уведомления пользователя
  const notifRes = await query(`
    SELECT n.*, t.title as topic_title 
    FROM forum_notifications n
    LEFT JOIN forum_topics t ON n.topic_id = t.id
    WHERE n.user_id = $1 OR n.session_id = $2
    ORDER BY n.created_at DESC LIMIT 20
  `, [session?.id, String(session?.id)]);
  const notifications = notifRes.rows;

  // Считаем общую карму (лайки за темы + лайки за комментарии)
  const topicsLikes = topics.reduce((sum, t) => sum + (t.likes || 0), 0);
  const commentsLikes = comments.reduce((sum, c) => sum + (c.likes || 0), 0);
  const totalKarma = topicsLikes + commentsLikes;

  // Помечаем уведомления прочитанными
  if (notifications.some(n => !n.is_read)) {
    await query('UPDATE forum_notifications SET is_read = true WHERE user_id = $1 OR session_id = $2', [session?.id, String(session?.id)]);
  }

  return (
    <div className="max-w-5xl mx-auto w-full py-8 px-4 sm:px-6 lg:px-8">
      <Link href="/forum" className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-6 font-medium transition">
        <ArrowLeft className="w-4 h-4 mr-2" />
        {tForum("profileBackToForum")}
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Левая колонка: Карточка профиля */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border shadow-sm p-6 text-center">
            <div className="relative w-24 h-24 mx-auto mb-4">
              <Image
                src={user.avatar_url || `/avatars/avatar1.svg`}
                alt={String(user.display_name)}
                fill
                className="rounded-full object-cover bg-gray-100 dark:bg-neutral-800 border-4 border-white dark:border-neutral-900 shadow-md"
              />
            </div>
            <h1 className="text-2xl font-bold mb-1 font-mono">{user.display_name}</h1>
            <div className="inline-flex items-center justify-center gap-1.5 bg-gray-100 dark:bg-neutral-800 px-3 py-1 rounded-full text-sm text-gray-600 dark:text-gray-300 mb-4 w-full">
              <Shield className="w-3.5 h-3.5" />
              <span>{tForum("profilePublicNameHint")}</span>
            </div>
            
            <div className="grid grid-cols-2 gap-4 border-y dark:border-neutral-800 py-4 mb-4">
              <div>
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{totalKarma}</div>
                <div className="text-xs text-gray-500 uppercase tracking-wider font-bold mt-1">{tForum("profileKarma")}</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{topics.length + comments.length}</div>
                <div className="text-xs text-gray-500 uppercase tracking-wider font-bold mt-1">{tForum("profilePostsLabel")}</div>
              </div>
            </div>

            <div className="mb-4">
              <ProfileAccountReveal />
            </div>

            <div>
              <SignOutButton label={tForum("profileSignOut")} />
            </div>
          </div>

          <ProfileSettingsPanel initialAvatarUrl={avatarForSettings} initialPreferredLocale={prefLocale} />
        </div>

        {/* Правая колонка: Контент (Темы и Ответы) */}
        <div className="lg:col-span-2 space-y-6">
          
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border shadow-sm overflow-hidden">
            <div className="p-5 border-b dark:border-neutral-800 bg-gray-50 dark:bg-neutral-800/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bell className="w-5 h-5 text-orange-500 dark:text-orange-400" />
                <h2 className="text-lg font-bold">{tForum("profileNotificationsTitle")}</h2>
              </div>
              {notifications.some(n => !n.is_read) && (
                <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                  {tForum("profileNotificationsNew")}
                </span>
              )}
            </div>
            <div className="divide-y dark:divide-neutral-800 max-h-[300px] overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-gray-500">{tForum("profileNotificationsEmpty")}</div>
              ) : (
                notifications.map(n => (
                  <Link key={n.id} href={`/forum/${n.topic_id}${n.topic_title ? '-' + slugify(n.topic_title) : ''}`} className={`block p-4 hover:bg-gray-50 dark:hover:bg-neutral-800/50 transition ${!n.is_read ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}>
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{n.message}</div>
                    <div className="text-xs text-gray-500 mt-1">{new Date(n.created_at).toLocaleString(uiLocale)}</div>
                  </Link>
                ))
              )}
            </div>
          </div>
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border shadow-sm overflow-hidden">
            <div className="p-5 border-b dark:border-neutral-800 bg-gray-50 dark:bg-neutral-800/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Layers className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h2 className="text-lg font-bold">{tForum("profileMyTopics", { count: topics.length })}</h2>
              </div>
              <Link href="/forum/new" className="inline-flex items-center gap-1.5 bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-500 transition shadow-sm">
                <Plus className="w-4 h-4" />
                {tForum("profileCreateShort")}
              </Link>
            </div>
            <div className="divide-y dark:divide-neutral-800 max-h-[400px] overflow-y-auto">
              {topics.length === 0 ? (
                <div className="p-8 text-center text-gray-500">{tForum("profileTopicsEmpty")}</div>
              ) : (
                topics.map(topic => (
                  <Link href={`/forum/${topic.id}-${slugify(topic.title)}`} key={topic.id} className="block p-4 hover:bg-gray-50 dark:hover:bg-neutral-800/50 transition">
                    <h3 className="font-bold text-blue-600 dark:text-blue-400 mb-1">{topic.title}</h3>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                      <span className="bg-gray-100 dark:bg-neutral-800 px-2 py-0.5 rounded">{topic.category_name}</span>
                      <span>{new Date(topic.created_at).toLocaleString(uiLocale, { hour: "2-digit", minute: "2-digit" })}</span>
                      <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3" /> {topic.replies_count}</span>
                      <span className="flex items-center gap-1"><ThumbsUp className="w-3 h-3" /> {topic.likes || 0}</span>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>

          <div className="bg-white dark:bg-neutral-900 rounded-2xl border shadow-sm overflow-hidden">
            <div className="p-5 border-b dark:border-neutral-800 bg-gray-50 dark:bg-neutral-800/50 flex items-center gap-3">
              <MessageSquare className="w-5 h-5 text-green-600 dark:text-green-400" />
              <h2 className="text-lg font-bold">{tForum("profileMyReplies", { count: comments.length })}</h2>
            </div>
            <div className="divide-y dark:divide-neutral-800 max-h-[400px] overflow-y-auto">
              {comments.length === 0 ? (
                <div className="p-8 text-center text-gray-500">{tForum("profileRepliesEmpty")}</div>
              ) : (
                comments.map(comment => (
                  <Link href={`/forum/${comment.topic_id}-${slugify(comment.topic_title)}`} key={comment.id} className="block p-4 hover:bg-gray-50 dark:hover:bg-neutral-800/50 transition">
                    <div className="text-xs text-gray-500 mb-2 flex items-center gap-2">
                      <span>{tForum("profileInTopic")}</span>
                      <span className="font-medium text-gray-700 dark:text-gray-300 truncate">{comment.topic_title}</span>
                    </div>
                    <p className="text-sm text-gray-800 dark:text-gray-200 line-clamp-2 mb-2">
                      {comment.content}
                    </p>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                      <span>{new Date(comment.created_at).toLocaleString(uiLocale, { hour: "2-digit", minute: "2-digit" })}</span>
                      <span className="flex items-center gap-1"><ThumbsUp className="w-3 h-3" /> {comment.likes || 0}</span>
                      {comment.is_best_answer && <span className="text-green-600 font-bold">{tForum("profileBestAnswer")}</span>}
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}