import { ArrowLeft, User, Clock, MessageSquare, ThumbsUp, ThumbsDown, Eye, Pin, Lock, Trash, Edit, CornerDownRight, Flag, Quote, CheckCircle, Bell, ChevronRight, Home } from "lucide-react";
import { Link } from "@/navigation";
import { query } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { notFound, redirect } from "next/navigation";
import { getTranslations, getLocale } from "next-intl/server";
import { cookies } from "next/headers";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { FileUploadButton } from "@/components/FileUploadButton";
import { QuoteButton } from "@/components/QuoteButton";
import { slugify } from "@/lib/utils";
import type { Metadata } from "next";
import { getSession } from "@/lib/auth";
import Image from "next/image";

type ForumCommentRow = {
  id: number;
  content: string;
  author_name: string;
  likes: number;
  dislikes: number;
  parent_id: number | null;
  created_at: Date | string;
  author_session_id: string | null;
  user_id: number | null;
  is_best_answer: boolean;
  author_karma: number | null;
  author_avatar: string | null;
  author_display_name: string | null;
};

export async function generateMetadata({ params }: { params: { id: string, locale: string } }): Promise<Metadata> {
  const topicId = parseInt(params.id, 10);
  if (isNaN(topicId)) return { title: 'Тема не найдена' };

  const topicResult = await query('SELECT title, content FROM forum_topics WHERE id = $1', [topicId]);
  if (topicResult.rows.length === 0) return { title: 'Тема не найдена' };
  
  const topic = topicResult.rows[0];
  const description = topic.content.substring(0, 160).replace(/\n/g, ' ') + '...';

  return {
    title: `${topic.title} | Анонимный Форум`,
    description: description,
    openGraph: {
      title: topic.title,
      description: description,
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title: topic.title,
      description: description,
    }
  };
}

export default async function ForumThreadPage({ params, searchParams }: { params: { id: string }, searchParams: { sort?: string } }) {
  const t = await getTranslations("Forum");
  const locale = await getLocale();
  const topicId = parseInt(params.id, 10);
  const sort = searchParams.sort || "oldest";
  
  if (isNaN(topicId)) {
    notFound();
  }

  const userSession = await getSession();
  const cookieStore = cookies();
  const currentSessionId = cookieStore.get('anon_session')?.value;

  // Увеличиваем количество просмотров
  await query('UPDATE forum_topics SET views = views + 1 WHERE id = $1', [topicId]);

  // Получаем тему
  const topicResult = await query(`
    SELECT t.*, c.name as category_name, u.karma as author_karma, usr.avatar_url as author_avatar, usr.display_name as author_display_name
    FROM forum_topics t 
    LEFT JOIN forum_categories c ON t.category_id = c.id 
    LEFT JOIN user_profiles u ON t.author_session_id = u.session_id
    LEFT JOIN users usr ON t.user_id = usr.id
    WHERE t.id = $1
  `, [topicId]);

  if (topicResult.rows.length === 0) {
    notFound();
  }

  const topic = topicResult.rows[0];
  const isTopicAuthor = userSession && topic.user_id === userSession.id;

  // Получаем игнор-лист текущего пользователя
  let ignoredSessions: string[] = [];
  if (currentSessionId) {
    const userRes = await query('SELECT ignored_sessions FROM user_profiles WHERE session_id = $1', [currentSessionId]);
    if (userRes.rows.length > 0 && userRes.rows[0].ignored_sessions) {
      ignoredSessions = userRes.rows[0].ignored_sessions;
    }
  }

  // Получаем категории для перемещения
  const categoriesResult = await query('SELECT * FROM forum_categories ORDER BY id');
  const categories = categoriesResult.rows;

  // Группируем темы по категориям для вывода в хлебных крошках
  const categoryGroup = categories.find(c => c.id === topic.category_id);

  // Получаем комментарии
  let commentsOrderBy = "c.created_at ASC";
  if (sort === "newest") {
    commentsOrderBy = "c.created_at DESC";
  } else if (sort === "popular") {
    commentsOrderBy = "c.likes DESC, c.created_at ASC";
  }

  const commentsResult = await query(`
    SELECT c.*, u.karma as author_karma, usr.avatar_url as author_avatar, usr.display_name as author_display_name
    FROM forum_comments c
    LEFT JOIN user_profiles u ON c.author_session_id = u.session_id
    LEFT JOIN users usr ON c.user_id = usr.id
    WHERE c.topic_id = $1 
    ORDER BY c.is_best_answer DESC, ${commentsOrderBy}
  `, [topicId]);
  
  // Фильтруем комментарии от заблокированных пользователей
  const allComments = (commentsResult.rows as ForumCommentRow[]).filter(
    c => !c.author_session_id || !ignoredSessions.includes(c.author_session_id)
  );

  // Получаем опрос (если есть)
  const pollRes = await query('SELECT * FROM forum_polls WHERE topic_id = $1', [topicId]);
  const poll = pollRes.rows.length > 0 ? pollRes.rows[0] : null;
  let pollOptions: any[] = [];
  let hasVoted = false;
  let totalVotes = 0;

  if (poll) {
    const optionsRes = await query('SELECT * FROM forum_poll_options WHERE poll_id = $1 ORDER BY id', [poll.id]);
    pollOptions = optionsRes.rows;
    totalVotes = pollOptions.reduce((sum, opt) => sum + opt.votes, 0);

    if (currentSessionId) {
      const voteRes = await query('SELECT id FROM forum_poll_votes WHERE poll_id = $1 AND session_id = $2', [poll.id, currentSessionId]);
      hasVoted = voteRes.rows.length > 0;
    }
  }

  // Проверяем подписку пользователя на тему
  let isSubscribed = false;
  if (userSession) {
    const subRes = await query('SELECT id FROM forum_subscriptions WHERE user_id = $1 AND topic_id = $2', [userSession.id, topicId]);
    isSubscribed = subRes.rows.length > 0;
  }
  
  // Группируем комментарии (простая двухуровневая вложенность для примера)
  const rootComments = allComments.filter(c => !c.parent_id);
  const getReplies = (parentId: number) => allComments.filter(c => c.parent_id === parentId);

  async function toggleSubscription() {
    "use server";
    const session = await getSession();
    if (!session) return;
    
    const subRes = await query('SELECT id FROM forum_subscriptions WHERE user_id = $1 AND topic_id = $2', [session.id, topicId]);
    if (subRes.rows.length > 0) {
      await query('DELETE FROM forum_subscriptions WHERE user_id = $1 AND topic_id = $2', [session.id, topicId]);
    } else {
      await query('INSERT INTO forum_subscriptions (user_id, topic_id) VALUES ($1, $2)', [session.id, topicId]);
    }
    revalidatePath(`/forum/${topicId}-${slugify(topic.title)}`);
  }

  async function addComment(formData: FormData) {
    "use server";
    const session = await getSession();
    if (!session) {
      const locale = await getLocale();
      redirect(`/${locale}/forum/login`);
    }

    const content = formData.get("content") as string;
    const author_name = session.username;
    const parent_id = formData.get("parent_id") ? parseInt(formData.get("parent_id") as string) : null;
    
    const cookieStore = cookies();
    const author_session_id = cookieStore.get('anon_session')?.value || null;

    if (!content) return;

    // Антиспам и блэклист
    const blacklist = ["спам", "реклама", "viagra", "казино"];
    const lowerContent = content.toLowerCase();
    for (const word of blacklist) {
      if (lowerContent.includes(word)) {
        return; // Игнорируем сообщение с запрещенными словами
      }
    }

    await query(
      'INSERT INTO forum_comments (topic_id, content, author_name, parent_id, author_session_id, user_id) VALUES ($1, $2, $3, $4, $5, $6)',
      [topicId, content, author_name, parent_id, author_session_id, session.id]
    );

    // Уведомляем всех подписчиков темы
    const subsRes = await query('SELECT user_id FROM forum_subscriptions WHERE topic_id = $1', [topicId]);
    for (const sub of subsRes.rows) {
      if (sub.user_id !== session.id) {
        await query(
          'INSERT INTO forum_notifications (user_id, topic_id, message) VALUES ($1, $2, $3)',
          [sub.user_id, topicId, `Новый ответ в теме от ${author_name}`]
        );
      }
    }

    revalidatePath(`/forum/${topicId}-${slugify(topic.title)}`);
  }

  async function likeTopic() {
    "use server";
    await query('UPDATE forum_topics SET likes = likes + 1 WHERE id = $1', [topicId]);
    const topicRes = await query('SELECT author_session_id FROM forum_topics WHERE id = $1', [topicId]);
    if (topicRes.rows.length > 0 && topicRes.rows[0].author_session_id) {
      await query('UPDATE user_profiles SET karma = karma + 1 WHERE session_id = $1', [topicRes.rows[0].author_session_id]);
    }
    revalidatePath(`/forum/${topicId}-${slugify(topic.title)}`);
  }

  async function dislikeTopic() {
    "use server";
    await query('UPDATE forum_topics SET dislikes = dislikes + 1 WHERE id = $1', [topicId]);
    const topicRes = await query('SELECT author_session_id FROM forum_topics WHERE id = $1', [topicId]);
    if (topicRes.rows.length > 0 && topicRes.rows[0].author_session_id) {
      await query('UPDATE user_profiles SET karma = karma - 1 WHERE session_id = $1', [topicRes.rows[0].author_session_id]);
    }
    revalidatePath(`/forum/${topicId}-${slugify(topic.title)}`);
  }

  async function likeComment(formData: FormData) {
    "use server";
    const commentId = formData.get("comment_id") as string;
    if (!commentId) return;
    await query('UPDATE forum_comments SET likes = likes + 1 WHERE id = $1', [commentId]);
    const commentRes = await query('SELECT author_session_id FROM forum_comments WHERE id = $1', [commentId]);
    if (commentRes.rows.length > 0 && commentRes.rows[0].author_session_id) {
      await query('UPDATE user_profiles SET karma = karma + 1 WHERE session_id = $1', [commentRes.rows[0].author_session_id]);
    }
    revalidatePath(`/forum/${topicId}-${slugify(topic.title)}`);
  }

  async function dislikeComment(formData: FormData) {
    "use server";
    const commentId = formData.get("comment_id") as string;
    if (!commentId) return;
    await query('UPDATE forum_comments SET dislikes = dislikes + 1 WHERE id = $1', [commentId]);
    const commentRes = await query('SELECT author_session_id FROM forum_comments WHERE id = $1', [commentId]);
    if (commentRes.rows.length > 0 && commentRes.rows[0].author_session_id) {
      await query('UPDATE user_profiles SET karma = karma - 1 WHERE session_id = $1', [commentRes.rows[0].author_session_id]);
    }
    revalidatePath(`/forum/${topicId}-${slugify(topic.title)}`);
  }

  async function reportContent(formData: FormData) {
    "use server";
    const commentId = formData.get("comment_id") as string | null;
    const reason = formData.get("reason") as string;
    if (!reason) return;
    
    const cookieStore = cookies();
    const sessionId = cookieStore.get('anon_session')?.value || null;

    await query(
      'INSERT INTO forum_reports (topic_id, comment_id, reporter_session_id, reason) VALUES ($1, $2, $3, $4)',
      [topicId, commentId || null, sessionId, reason]
    );
    // In a real app, notify mods here
  }

  async function deleteComment(formData: FormData) {
    "use server";
    const commentId = formData.get("comment_id") as string;
    if (!commentId) return;
    
    const session = await getSession();
    if (!session) return;
    
    // Проверка прав
    const commentRes = await query('SELECT user_id FROM forum_comments WHERE id = $1', [commentId]);
    if (commentRes.rows.length === 0 || commentRes.rows[0].user_id !== session.id) return;

    await query('DELETE FROM forum_comments WHERE id = $1', [commentId]);
    revalidatePath(`/forum/${topicId}-${slugify(topic.title)}`);
  }

  async function togglePin() {
    "use server";
    const session = await getSession();
    const topicRes = await query('SELECT user_id FROM forum_topics WHERE id = $1', [topicId]);
    if (!session || topicRes.rows.length === 0 || topicRes.rows[0].user_id !== session.id) return;

    await query('UPDATE forum_topics SET is_pinned = NOT is_pinned WHERE id = $1', [topicId]);
    revalidatePath(`/forum/${topicId}-${slugify(topic.title)}`);
  }

  async function toggleClose() {
    "use server";
    const session = await getSession();
    const topicRes = await query('SELECT user_id FROM forum_topics WHERE id = $1', [topicId]);
    if (!session || topicRes.rows.length === 0 || topicRes.rows[0].user_id !== session.id) return;

    await query('UPDATE forum_topics SET is_closed = NOT is_closed WHERE id = $1', [topicId]);
    revalidatePath(`/forum/${topicId}-${slugify(topic.title)}`);
  }

  async function moveTopic(formData: FormData) {
    "use server";
    const session = await getSession();
    const topicRes = await query('SELECT user_id FROM forum_topics WHERE id = $1', [topicId]);
    if (!session || topicRes.rows.length === 0 || topicRes.rows[0].user_id !== session.id) return;

    const newCategoryId = formData.get("category_id") as string;
    if (!newCategoryId) return;
    await query('UPDATE forum_topics SET category_id = $1 WHERE id = $2', [newCategoryId, topicId]);
    revalidatePath(`/forum/${topicId}-${slugify(topic.title)}`);
  }

  async function toggleBestAnswer(formData: FormData) {
    "use server";
    const commentId = formData.get("comment_id") as string;
    if (!commentId) return;

    const session = await getSession();
    if (!session) return;

    // Только автор темы может выбирать лучший ответ
    const topicRes = await query('SELECT user_id FROM forum_topics WHERE id = $1', [topicId]);
    if (topicRes.rows.length === 0 || topicRes.rows[0].user_id !== session.id) return;

    // Сбрасываем предыдущий лучший ответ и устанавливаем новый
    await query('UPDATE forum_comments SET is_best_answer = false WHERE topic_id = $1', [topicId]);
    await query('UPDATE forum_comments SET is_best_answer = true WHERE id = $1', [commentId]);
    
    revalidatePath(`/forum/${topicId}-${slugify(topic.title)}`);
  }

  async function ignoreUser(formData: FormData) {
    "use server";
    const targetSessionId = formData.get("target_session_id") as string;
    if (!targetSessionId) return;

    const cookieStore = cookies();
    const sessionId = cookieStore.get('anon_session')?.value;
    if (!sessionId) return;

    await query(`
      INSERT INTO user_profiles (session_id, ignored_sessions) 
      VALUES ($1, ARRAY[$2]::text[]) 
      ON CONFLICT (session_id) 
      DO UPDATE SET ignored_sessions = array_append(user_profiles.ignored_sessions, $2)
      WHERE NOT ($2 = ANY(user_profiles.ignored_sessions))
    `, [sessionId, targetSessionId]);

    revalidatePath(`/forum/${topicId}-${slugify(topic.title)}`);
  }

  async function votePoll(formData: FormData) {
    "use server";
    const optionId = formData.get("option_id") as string;
    const pollId = formData.get("poll_id") as string;
    if (!optionId || !pollId) return;

    const cookieStore = cookies();
    const sessionId = cookieStore.get('anon_session')?.value;
    if (!sessionId) return;

    try {
      await query('INSERT INTO forum_poll_votes (poll_id, option_id, session_id) VALUES ($1, $2, $3)', [pollId, optionId, sessionId]);
      await query('UPDATE forum_poll_options SET votes = votes + 1 WHERE id = $1', [optionId]);
    } catch (e) {
      // Уже голосовал
    }
    revalidatePath(`/forum/${topicId}-${slugify(topic.title)}`);
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "DiscussionForumPosting",
    "headline": topic.title,
    "articleBody": topic.content,
    "author": {
      "@type": "Person",
      "name": topic.author_name
    },
    "datePublished": new Date(topic.created_at).toISOString(),
    "interactionStatistic": {
      "@type": "InteractionCounter",
      "interactionType": "https://schema.org/CommentAction",
      "userInteractionCount": allComments.length
    }
  };

  return (
    <div className="max-w-4xl mx-auto w-full py-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 px-4 sm:px-0">
        <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500">
          <Link href="/" className="hover:text-blue-600 transition flex items-center">
            <Home className="w-4 h-4" />
          </Link>
          <ChevronRight className="w-4 h-4" />
          <Link href="/forum" className="hover:text-blue-600 transition font-medium">
            Форум
          </Link>
          <ChevronRight className="w-4 h-4" />
          <Link href={`/forum?category=${topic.category_id}`} className="hover:text-blue-600 transition font-medium">
            {topic.category_name}
          </Link>
          <ChevronRight className="w-4 h-4 hidden sm:block" />
          <span className="text-gray-800 dark:text-gray-200 font-medium truncate max-w-[200px] sm:max-w-[300px] hidden sm:block">
            {topic.title}
          </span>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Подписка на тему */}
          {userSession && (
            <form action={toggleSubscription}>
              <button 
                type="submit" 
                className={`flex items-center gap-2 p-2 rounded-lg transition border ${isSubscribed ? 'bg-blue-50 border-blue-200 text-blue-600 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-400' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50 dark:bg-neutral-900 dark:border-neutral-800 dark:text-gray-400 dark:hover:bg-neutral-800'}`}
                title={isSubscribed ? 'Отписаться от уведомлений' : 'Подписаться на уведомления'}
              >
                <Bell className={`w-4 h-4 ${isSubscribed ? 'fill-current' : ''}`} />
                <span className="text-sm font-medium hidden sm:block">
                  {isSubscribed ? 'Вы подписаны' : 'Подписаться'}
                </span>
              </button>
            </form>
          )}

          {/* Admin actions (mock) */}
          {isTopicAuthor && (
            <div className="flex items-center gap-2 bg-gray-100 dark:bg-neutral-800 p-1 rounded-md">
              <form action={togglePin}>
                <button type="submit" title="Закрепить/Открепить" className={`p-2 rounded hover:bg-gray-200 dark:hover:bg-neutral-700 transition ${topic.is_pinned ? 'text-orange-500' : 'text-gray-500'}`}>
                  <Pin className="w-4 h-4" />
                </button>
              </form>
              <form action={toggleClose}>
                <button type="submit" title="Закрыть/Открыть" className={`p-2 rounded hover:bg-gray-200 dark:hover:bg-neutral-700 transition ${topic.is_closed ? 'text-red-500' : 'text-gray-500'}`}>
                  <Lock className="w-4 h-4" />
                </button>
              </form>
              <Link href={`/forum/${topicId}-${slugify(topic.title)}/edit`} className="p-2 rounded hover:bg-gray-200 dark:hover:bg-neutral-700 transition text-gray-500" title="Редактировать тему">
                <Edit className="w-4 h-4" />
              </Link>
              <details className="relative">
                <summary className="p-2 rounded hover:bg-gray-200 dark:hover:bg-neutral-700 transition text-gray-500 cursor-pointer list-none" title="Переместить тему">
                  <span className="text-xs font-bold px-1">M</span>
                </summary>
                <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-neutral-900 border shadow-lg rounded-md p-2 z-10">
                  <form action={moveTopic} className="flex flex-col gap-2">
                    <label className="text-xs font-bold">Переместить в:</label>
                    <select name="category_id" className="text-sm border rounded p-1 dark:bg-neutral-800" defaultValue={topic.category_id}>
                      {categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    <button type="submit" className="bg-blue-600 text-white text-xs py-1 rounded">Переместить</button>
                  </form>
                </div>
              </details>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-neutral-900 sm:rounded-xl border-y sm:border shadow-sm mb-8 overflow-hidden">
        <div className="p-4 sm:p-6 border-b dark:border-neutral-800">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-3 gap-2">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-sm text-gray-500">
              <span className="bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 px-2 py-1 rounded font-medium">
                {topic.category_name}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" /> 
                {new Date(topic.created_at).toLocaleString('ru-RU')}
              </span>
              {topic.is_pinned && <span className="text-orange-500 font-bold flex items-center gap-1"><Pin className="w-3 h-3"/> Закреплено</span>}
              {topic.is_closed && <span className="text-red-500 font-bold flex items-center gap-1"><Lock className="w-3 h-3"/> Закрыто</span>}
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-500">
              <span className="flex items-center gap-1" title={t("views")}>
                <Eye className="w-4 h-4" /> {topic.views || 0}
              </span>
            </div>
          </div>
          <h1 className="text-2xl font-bold mb-4">{topic.title}</h1>
          <div className="prose dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 mb-4">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{topic.content}</ReactMarkdown>
          </div>
          
          {poll && (
            <div className="my-6 p-6 border rounded-xl bg-gray-50 dark:bg-neutral-800/50">
              <h3 className="text-lg font-bold mb-4">{poll.question}</h3>
              <div className="space-y-3">
                {pollOptions.map(opt => {
                  const percent = totalVotes > 0 ? Math.round((opt.votes / totalVotes) * 100) : 0;
                  return (
                    <div key={opt.id} className="relative">
                      {hasVoted ? (
                        <div className="flex justify-between items-center bg-white dark:bg-neutral-900 border rounded-md p-3 relative overflow-hidden">
                          <div className="absolute left-0 top-0 bottom-0 bg-blue-100 dark:bg-blue-900/30" style={{ width: `${percent}%` }}></div>
                          <span className="relative z-10 font-medium">{opt.text}</span>
                          <span className="relative z-10 text-sm text-gray-500">{opt.votes} ({percent}%)</span>
                        </div>
                      ) : (
                        <form action={votePoll} className="w-full">
                          <input type="hidden" name="poll_id" value={poll.id} />
                          <input type="hidden" name="option_id" value={opt.id} />
                          <button type="submit" className="w-full text-left bg-white dark:bg-neutral-900 hover:bg-blue-50 dark:hover:bg-neutral-800 border rounded-md p-3 transition font-medium">
                            {opt.text}
                          </button>
                        </form>
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 text-sm text-gray-500">Всего голосов: {totalVotes}</div>
            </div>
          )}

          {topic.tags && topic.tags.length > 0 && (
            <div className="flex gap-2 mt-4 pt-4 border-t dark:border-neutral-800">
              {topic.tags.map((tag: string) => (
                <span key={tag} className="text-xs bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 px-2 py-1 rounded-full">
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="bg-gray-50 dark:bg-neutral-800/50 px-4 sm:px-6 py-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-sm text-gray-500">
          <div className="flex flex-wrap items-center gap-2">
            <div className="bg-gray-200 dark:bg-neutral-800 rounded-full overflow-hidden w-6 h-6 flex-shrink-0">
              {topic.author_avatar ? (
                <Image src={topic.author_avatar} alt={topic.author_name} width={24} height={24} className="w-full h-full object-cover" />
              ) : (
                <User className="w-4 h-4 m-1 text-gray-500" />
              )}
            </div>
            <span className="font-medium">{t("authorLabel", { name: topic.author_display_name || topic.author_name })}</span>
            <span className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300 px-2 py-0.5 rounded-full font-bold ml-2" title="Карма пользователя">
              ★ {topic.author_karma || 0}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <span className="flex items-center gap-1"><MessageSquare className="w-4 h-4" /> {allComments.length} <span className="hidden sm:inline">{t("answersCount")}</span></span>
            <form action={likeTopic}>
              <button type="submit" className="flex items-center gap-1 hover:text-blue-600 transition">
                <ThumbsUp className="w-4 h-4" /> {topic.likes || 0}
              </button>
            </form>
            <form action={dislikeTopic}>
              <button type="submit" className="flex items-center gap-1 hover:text-red-600 transition">
                <ThumbsDown className="w-4 h-4" /> {topic.dislikes || 0}
              </button>
            </form>
            <details className="relative">
              <summary className="flex items-center gap-1 hover:text-orange-600 transition cursor-pointer list-none">
                <Flag className="w-4 h-4" />
              </summary>
              <div className="absolute right-0 bottom-full mb-2 w-64 bg-white dark:bg-neutral-900 border shadow-lg rounded-md p-3 z-10">
                <form action={reportContent} className="flex flex-col gap-2">
                  <label className="text-xs font-bold">Жалоба на тему:</label>
                  <textarea name="reason" required rows={2} className="text-sm border rounded p-2 dark:bg-neutral-800 w-full" placeholder="Причина жалобы..."></textarea>
                  <button type="submit" className="bg-red-600 text-white text-xs py-1.5 rounded font-medium hover:bg-red-700">Отправить жалобу</button>
                </form>
              </div>
            </details>
          </div>
        </div>
      </div>

      <div className="space-y-4 sm:space-y-6 mb-12 px-0 sm:px-0">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center px-4 sm:px-0 gap-4">
          <h3 className="text-xl font-bold">{t("answers", { count: allComments.length })}</h3>
          {allComments.length > 0 && (
            <div className="flex flex-wrap w-full sm:w-auto bg-gray-100 dark:bg-neutral-800 p-1 rounded-lg">
              <Link 
                href={`/forum/${topicId}-${slugify(topic.title)}?sort=oldest`} 
                className={`flex-1 text-center px-2 sm:px-3 py-1.5 text-xs sm:text-sm rounded-md transition ${sort === 'oldest' ? 'bg-white dark:bg-neutral-700 shadow-sm font-medium' : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-300'}`}
              >
                Старые
              </Link>
              <Link 
                href={`/forum/${topicId}-${slugify(topic.title)}?sort=newest`} 
                className={`flex-1 text-center px-2 sm:px-3 py-1.5 text-xs sm:text-sm rounded-md transition ${sort === 'newest' ? 'bg-white dark:bg-neutral-700 shadow-sm font-medium' : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-300'}`}
              >
                Новые
              </Link>
              <Link 
                href={`/forum/${topicId}-${slugify(topic.title)}?sort=popular`} 
                className={`flex-1 text-center px-2 sm:px-3 py-1.5 text-xs sm:text-sm rounded-md transition ${sort === 'popular' ? 'bg-white dark:bg-neutral-700 shadow-sm font-medium' : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-300'}`}
              >
                Популярные
              </Link>
            </div>
          )}
        </div>
        {rootComments.map((comment) => (
          <div key={comment.id} className={`bg-white dark:bg-neutral-900 p-4 sm:p-6 sm:rounded-xl border-y sm:border shadow-sm ${comment.is_best_answer ? 'ring-2 ring-green-500 bg-green-50/50 dark:bg-green-900/10' : ''}`}>
            <div className="flex flex-col sm:flex-row justify-between items-start mb-3 gap-3">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="bg-gray-200 dark:bg-neutral-800 rounded-full overflow-hidden w-10 h-10 flex-shrink-0">
                  {comment.author_avatar ? (
                    <Image src={comment.author_avatar} alt={comment.author_name} width={40} height={40} className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-6 h-6 m-2 text-gray-500" />
                  )}
                </div>
                <div>
                  <div className="font-bold text-sm flex items-center gap-2">
                    {comment.author_display_name || comment.author_name}
                    <span className="text-xs text-blue-600 dark:text-blue-400 font-bold" title="Карма">★ {comment.author_karma || 0}</span>
                    {comment.is_best_answer && <span className="text-xs bg-green-500 text-white px-2 py-0.5 rounded-full flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Лучший ответ</span>}
                  </div>
                  <div className="text-xs text-gray-500">{new Date(comment.created_at).toLocaleString('ru-RU')}</div>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto mt-2 sm:mt-0">
                {isTopicAuthor && !comment.is_best_answer && (
                  <form action={toggleBestAnswer}>
                    <input type="hidden" name="comment_id" value={comment.id} />
                    <button type="submit" className="flex items-center gap-1 text-xs text-green-600 hover:text-green-700 transition font-medium border border-green-200 bg-green-50 px-2 py-1 rounded-md dark:bg-green-900/30 dark:border-green-800">
                      Отметить решением
                    </button>
                  </form>
                )}
                <QuoteButton content={comment.content} size="md" />
                <form action={likeComment}>
                  <input type="hidden" name="comment_id" value={comment.id} />
                  <button type="submit" className="flex items-center gap-1 text-sm text-gray-500 hover:text-blue-600 transition">
                    <ThumbsUp className="w-4 h-4" /> {comment.likes}
                  </button>
                </form>
                <form action={dislikeComment}>
                  <input type="hidden" name="comment_id" value={comment.id} />
                  <button type="submit" className="flex items-center gap-1 text-sm text-gray-500 hover:text-red-600 transition">
                    <ThumbsDown className="w-4 h-4" /> {comment.dislikes || 0}
                  </button>
                </form>
                <details className="relative">
                  <summary className="flex items-center gap-1 text-sm text-gray-500 hover:text-orange-600 transition cursor-pointer list-none">
                    <Flag className="w-4 h-4" />
                  </summary>
                  <div className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-neutral-900 border shadow-lg rounded-md p-3 z-10">
                    <form action={reportContent} className="flex flex-col gap-2 mb-3 pb-3 border-b dark:border-neutral-800">
                      <input type="hidden" name="comment_id" value={comment.id} />
                      <label className="text-xs font-bold">Жалоба на комментарий:</label>
                      <textarea name="reason" required rows={2} className="text-sm border rounded p-2 dark:bg-neutral-800 w-full" placeholder="Причина жалобы..."></textarea>
                      <button type="submit" className="bg-red-600 text-white text-xs py-1.5 rounded font-medium hover:bg-red-700">Отправить жалобу</button>
                    </form>
                    {currentSessionId && comment.author_session_id && comment.author_session_id !== currentSessionId && (
                      <form action={ignoreUser}>
                        <input type="hidden" name="target_session_id" value={comment.author_session_id} />
                        <button type="submit" className="w-full text-left text-xs text-gray-500 hover:text-red-500 transition">
                          Заблокировать пользователя (Игнор)
                        </button>
                      </form>
                    )}
                  </div>
                </details>
                {userSession && comment.user_id === userSession.id && (
                  <form action={deleteComment}>
                    <input type="hidden" name="comment_id" value={comment.id} />
                    <button type="submit" className="text-gray-400 hover:text-red-500 transition" title="Удалить">
                      <Trash className="w-4 h-4" />
                    </button>
                  </form>
                )}
              </div>
            </div>
            <p className="text-gray-700 dark:text-gray-300 pl-0 sm:pl-10 mb-4 prose dark:prose-invert max-w-none prose-sm">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{comment.content}</ReactMarkdown>
            </p>
            
            {/* Вложенные ответы */}
            <div className="pl-4 sm:pl-10 space-y-4">
              {getReplies(comment.id).map(reply => (
                <div key={reply.id} className={`bg-gray-50 dark:bg-neutral-800/50 p-3 sm:p-4 rounded-lg border dark:border-neutral-800 relative ${reply.is_best_answer ? 'ring-2 ring-green-500 bg-green-50/50 dark:bg-green-900/10' : ''}`}>
                  <CornerDownRight className="absolute -left-4 sm:-left-6 top-4 w-4 h-4 text-gray-300 dark:text-gray-600 hidden sm:block" />
                  <div className="flex flex-col sm:flex-row justify-between items-start mb-2 gap-2">
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <div className="bg-gray-200 dark:bg-neutral-800 rounded-full overflow-hidden w-6 h-6 flex-shrink-0">
                        {reply.author_avatar ? (
                          <Image src={reply.author_avatar} alt={reply.author_name} width={24} height={24} className="w-full h-full object-cover" />
                        ) : (
                          <User className="w-4 h-4 m-1 text-gray-500" />
                        )}
                      </div>
                      <div className="font-bold text-sm flex items-center gap-2">
                        {reply.author_display_name || reply.author_name}
                        <span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold" title="Карма">★ {reply.author_karma || 0}</span>
                        {reply.is_best_answer && <span className="text-[10px] bg-green-500 text-white px-1.5 py-0.5 rounded-full flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Решение</span>}
                      </div>
                      <div className="text-xs text-gray-500">{new Date(reply.created_at).toLocaleString('ru-RU')}</div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto mt-1 sm:mt-0">
                      {isTopicAuthor && !reply.is_best_answer && (
                        <form action={toggleBestAnswer}>
                          <input type="hidden" name="comment_id" value={reply.id} />
                          <button type="submit" className="text-[10px] text-green-600 hover:text-green-700 transition font-medium border border-green-200 bg-green-50 px-1.5 py-0.5 rounded dark:bg-green-900/30 dark:border-green-800">
                            Отметить решением
                          </button>
                        </form>
                      )}
                      <QuoteButton content={reply.content} size="sm" />
                      <form action={likeComment}>
                        <input type="hidden" name="comment_id" value={reply.id} />
                        <button type="submit" className="flex items-center gap-1 text-xs text-gray-500 hover:text-blue-600 transition">
                          <ThumbsUp className="w-3 h-3" /> {reply.likes}
                        </button>
                      </form>
                      <form action={dislikeComment}>
                        <input type="hidden" name="comment_id" value={reply.id} />
                        <button type="submit" className="flex items-center gap-1 text-xs text-gray-500 hover:text-red-600 transition">
                          <ThumbsDown className="w-3 h-3" /> {reply.dislikes || 0}
                        </button>
                      </form>
                      <details className="relative">
                        <summary className="flex items-center gap-1 text-xs text-gray-500 hover:text-orange-600 transition cursor-pointer list-none">
                          <Flag className="w-3 h-3" />
                        </summary>
                        <div className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-neutral-900 border shadow-lg rounded-md p-3 z-10">
                          <form action={reportContent} className="flex flex-col gap-2 mb-3 pb-3 border-b dark:border-neutral-800">
                            <input type="hidden" name="comment_id" value={reply.id} />
                            <label className="text-xs font-bold">Жалоба на ответ:</label>
                            <textarea name="reason" required rows={2} className="text-sm border rounded p-2 dark:bg-neutral-800 w-full" placeholder="Причина жалобы..."></textarea>
                            <button type="submit" className="bg-red-600 text-white text-xs py-1.5 rounded font-medium hover:bg-red-700">Отправить жалобу</button>
                          </form>
                          {currentSessionId && reply.author_session_id && reply.author_session_id !== currentSessionId && (
                            <form action={ignoreUser}>
                              <input type="hidden" name="target_session_id" value={reply.author_session_id} />
                              <button type="submit" className="w-full text-left text-xs text-gray-500 hover:text-red-500 transition">
                                Заблокировать пользователя (Игнор)
                              </button>
                            </form>
                          )}
                        </div>
                      </details>
                      {userSession && reply.user_id === userSession.id && (
                        <form action={deleteComment}>
                          <input type="hidden" name="comment_id" value={reply.id} />
                          <button type="submit" className="text-gray-400 hover:text-red-500 transition" title="Удалить">
                            <Trash className="w-3 h-3" />
                          </button>
                        </form>
                      )}
                    </div>
                  </div>
                  <div className="text-sm text-gray-700 dark:text-gray-300 prose dark:prose-invert max-w-none prose-sm">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{reply.content}</ReactMarkdown>
                  </div>
                </div>
              ))}
              
              {!topic.is_closed && (
                <details className="group">
                  <summary className="text-sm text-blue-600 hover:underline cursor-pointer list-none font-medium">
                    Ответить
                  </summary>
                  {userSession ? (
                    <form action={addComment} className="mt-3 bg-white dark:bg-neutral-900 p-3 sm:p-4 rounded-lg border shadow-sm">
                      <input type="hidden" name="parent_id" value={comment.id} />
                      <textarea 
                        name="content" required rows={2} 
                        className="w-full border dark:border-neutral-700 rounded-md px-3 py-2 bg-gray-50 dark:bg-neutral-800 mb-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
                        placeholder="Ваш ответ..."
                      ></textarea>
                      <div className="flex flex-col sm:flex-row justify-end items-stretch sm:items-center gap-3 sm:gap-2">
                        <button type="submit" className="bg-blue-600 text-white px-4 py-1.5 rounded-md text-sm font-medium hover:bg-blue-700 transition w-full sm:w-auto">
                          {t("send")}
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="mt-3 p-3 bg-gray-50 dark:bg-neutral-800 rounded-lg text-sm text-gray-500">
                      <Link href="/forum/login" className="text-blue-600 hover:underline">Войдите</Link>, чтобы ответить.
                    </div>
                  )}
                </details>
              )}
            </div>
          </div>
        ))}
        
        {allComments.length === 0 && (
          <div className="text-center text-gray-500 py-4">
            {t("noAnswers")}
          </div>
        )}
      </div>

      {!topic.is_closed ? (
        <div className="bg-white dark:bg-neutral-900 p-6 rounded-xl border shadow-sm">
          <h3 className="text-lg font-bold mb-4">{t("writeAnswer")}</h3>
          {userSession ? (
            <form action={addComment}>
              <textarea 
                id="comment-textarea"
                name="content"
                required
                rows={4} 
                className="w-full border dark:border-neutral-700 rounded-md px-4 py-3 bg-gray-50 dark:bg-neutral-800 mb-4 focus:ring-2 focus:ring-blue-500 outline-none" 
                placeholder={t("commentPlaceholder") + " (Поддерживается Markdown)"}
              ></textarea>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-4 w-full sm:w-auto">
                  <FileUploadButton targetId="comment-textarea" />
                </div>
                <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-md font-medium hover:bg-blue-700 transition w-full sm:w-auto">
                  {t("send")}
                </button>
              </div>
            </form>
          ) : (
            <div className="text-center py-6 bg-gray-50 dark:bg-neutral-800 rounded-lg">
              <p className="text-gray-500 mb-4">Войдите, чтобы оставить комментарий</p>
              <Link href="/forum/login" className="inline-flex items-center bg-blue-600 text-white px-6 py-2 rounded-md font-medium hover:bg-blue-700 transition">
                Войти
              </Link>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-gray-50 dark:bg-neutral-800/50 p-6 rounded-xl border text-center text-gray-500 font-medium">
          <Lock className="w-6 h-6 mx-auto mb-2 text-gray-400" />
          Эта тема закрыта для новых ответов.
        </div>
      )}
    </div>
  );
}