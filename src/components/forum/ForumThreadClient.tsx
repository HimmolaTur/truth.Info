"use client";

import {
  User,
  Clock,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  Eye,
  Pin,
  Lock,
  Trash,
  Edit,
  CornerDownRight,
  Flag,
  CheckCircle,
  Bell,
  ChevronRight,
  Home,
} from "lucide-react";
import { Link } from "@/navigation";
import Image from "next/image";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useLocale, useTranslations } from "next-intl";
import { useCallback, useState } from "react";
import { FileUploadButton } from "@/components/FileUploadButton";
import { ForumTopicAjaxForm } from "@/components/forum/ForumTopicAjaxForm";
import { QuoteButton } from "@/components/QuoteButton";
import { RandomPreloaderOverlay } from "@/components/ui/RandomPreloader";
import type { ForumThreadPayload } from "@/lib/forumThreadData";
import { slugify } from "@/lib/utils";
import { AdminForumModerateButton } from "@/components/admin/AdminForumModerateButton";
import { useRouter } from "@/navigation";

type Props = {
  initialData: ForumThreadPayload;
  topicId: number;
};

export function ForumThreadClient({ initialData, topicId }: Props) {
  const t = useTranslations("Forum");
  const tAdmin = useTranslations("Admin");
  const locale = useLocale();
  const router = useRouter();
  const [data, setData] = useState(initialData);
  const [sort, setSort] = useState(initialData.sort);
  const [refreshing, setRefreshing] = useState(false);

  const refetch = useCallback(
    async (nextSort?: string) => {
      const s = nextSort ?? sort;
      setRefreshing(true);
      try {
        const res = await fetch(`/api/forum/thread/${topicId}?sort=${encodeURIComponent(s)}`, {
          credentials: "include",
        });
        const j = (await res.json()) as { ok?: boolean; data?: ForumThreadPayload };
        if (j.ok && j.data) {
          setData(j.data);
          if (nextSort !== undefined) setSort(nextSort);
          const path = window.location.pathname;
          const usp = new URLSearchParams(window.location.search);
          if (s === "oldest") usp.delete("sort");
          else usp.set("sort", s);
          const qs = usp.toString();
          window.history.replaceState(null, "", qs ? `${path}?${qs}` : path);
        }
      } finally {
        setRefreshing(false);
      }
    },
    [topicId, sort]
  );

  const onSuccess = useCallback(() => refetch(), [refetch]);

  const {
    topic,
    categories,
    allComments,
    poll,
    pollOptions,
    hasVoted,
    totalVotes,
    isSubscribed,
    userSession,
    currentSessionId,
    isTopicAuthor,
    forum_moderation: mod,
  } = data;

  const rootComments = allComments.filter((c) => !c.parent_id);
  const getReplies = (parentId: number) => allComments.filter((c) => c.parent_id === parentId);

  const pollQuestion = poll && "question" in poll ? String(poll.question) : "";
  const pollNumericId = poll && typeof poll.id === "number" ? poll.id : null;

  return (
    <div className="relative max-w-4xl mx-auto w-full py-8">
      <RandomPreloaderOverlay show={refreshing} />

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 px-4 sm:px-0">
        <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500">
          <Link href="/" className="hover:text-blue-600 transition flex items-center">
            <Home className="w-4 h-4" />
          </Link>
          <ChevronRight className="w-4 h-4" />
          <Link href="/forum" className="hover:text-blue-600 transition font-medium">
            {t("threadCrumbForum")}
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
          {userSession && (
            <ForumTopicAjaxForm topicId={topicId} forumAction="toggle_subscription" onAfterSuccess={onSuccess}>
              <button
                type="submit"
                className={`flex items-center gap-2 p-2 rounded-lg transition border ${isSubscribed ? "bg-blue-50 border-blue-200 text-blue-600 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-400" : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50 dark:bg-neutral-900 dark:border-neutral-800 dark:text-gray-400 dark:hover:bg-neutral-800"}`}
                title={isSubscribed ? t("threadNotifyUnsubscribeTitle") : t("threadNotifySubscribeTitle")}
              >
                <Bell className={`w-4 h-4 ${isSubscribed ? "fill-current" : ""}`} />
                <span className="text-sm font-medium hidden sm:block">
                  {isSubscribed ? t("threadSubscribedLabel") : t("threadSubscribeLabel")}
                </span>
              </button>
            </ForumTopicAjaxForm>
          )}

          {isTopicAuthor && (
            <div className="flex items-center gap-2 bg-gray-100 dark:bg-neutral-800 p-1 rounded-md">
              <ForumTopicAjaxForm topicId={topicId} forumAction="toggle_pin" onAfterSuccess={onSuccess}>
                <button
                  type="submit"
                  title={t("threadPinToggleTitle")}
                  className={`p-2 rounded hover:bg-gray-200 dark:hover:bg-neutral-700 transition ${topic.is_pinned ? "text-orange-500" : "text-gray-500"}`}
                >
                  <Pin className="w-4 h-4" />
                </button>
              </ForumTopicAjaxForm>
              <ForumTopicAjaxForm topicId={topicId} forumAction="toggle_close" onAfterSuccess={onSuccess}>
                <button
                  type="submit"
                  title={t("threadCloseToggleTitle")}
                  className={`p-2 rounded hover:bg-gray-200 dark:hover:bg-neutral-700 transition ${topic.is_closed ? "text-red-500" : "text-gray-500"}`}
                >
                  <Lock className="w-4 h-4" />
                </button>
              </ForumTopicAjaxForm>
              <Link
                href={`/forum/${topicId}-${slugify(topic.title)}/edit`}
                className="p-2 rounded hover:bg-gray-200 dark:hover:bg-neutral-700 transition text-gray-500"
                title={t("threadEditTitle")}
              >
                <Edit className="w-4 h-4" />
              </Link>
              <details className="relative">
                <summary
                  className="p-2 rounded hover:bg-gray-200 dark:hover:bg-neutral-700 transition text-gray-500 cursor-pointer list-none"
                  title={t("threadMoveTitle")}
                >
                  <span className="text-xs font-bold px-1">M</span>
                </summary>
                <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-neutral-900 border shadow-lg rounded-md p-2 z-10">
                  <ForumTopicAjaxForm topicId={topicId} forumAction="move_topic" className="flex flex-col gap-2" onAfterSuccess={onSuccess}>
                    <label className="text-xs font-bold">{t("threadMoveToLabel")}</label>
                    <select
                      name="category_id"
                      className="text-sm border rounded p-1 dark:bg-neutral-800"
                      defaultValue={topic.category_id}
                    >
                      {categories.map((c) => (
                        <option key={Number(c.id)} value={Number(c.id)}>
                          {String(c.name)}
                        </option>
                      ))}
                    </select>
                    <button type="submit" className="bg-blue-600 text-white text-xs py-1 rounded">
                      {t("threadMoveSubmit")}
                    </button>
                  </ForumTopicAjaxForm>
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
                {new Date(topic.created_at).toLocaleString(locale)}
              </span>
              {topic.is_pinned && (
                <span className="text-orange-500 font-bold flex items-center gap-1">
                  <Pin className="w-3 h-3" /> {t("threadPinned")}
                </span>
              )}
              {topic.is_closed && (
                <span className="text-red-500 font-bold flex items-center gap-1">
                  <Lock className="w-3 h-3" /> {t("threadClosed")}
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
              <span className="flex items-center gap-1" title={t("views")}>
                <Eye className="w-4 h-4" /> {topic.views || 0}
              </span>
              {mod.delete_topic && (
                <AdminForumModerateButton
                  action="delete_topic"
                  topicId={String(topicId)}
                  confirmMessage={tAdmin("modDeleteTopicConfirm")}
                  className="text-sm text-red-600 font-medium hover:underline"
                  onAfterSuccess={() => router.push("/forum")}
                >
                  {tAdmin("modDeleteTopic")}
                </AdminForumModerateButton>
              )}
            </div>
          </div>
          <h1 className="text-2xl font-bold mb-4">{topic.title}</h1>
          <div className="prose dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 mb-4">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{topic.content}</ReactMarkdown>
          </div>

          {poll && pollNumericId != null && (
            <div className="my-6 p-6 border rounded-xl bg-gray-50 dark:bg-neutral-800/50">
              <h3 className="text-lg font-bold mb-4">{pollQuestion}</h3>
              <div className="space-y-3">
                {pollOptions.map((opt) => {
                  const percent = totalVotes > 0 ? Math.round((opt.votes / totalVotes) * 100) : 0;
                  return (
                    <div key={opt.id} className="relative">
                      {hasVoted ? (
                        <div className="flex justify-between items-center bg-white dark:bg-neutral-900 border rounded-md p-3 relative overflow-hidden">
                          <div
                            className="absolute left-0 top-0 bottom-0 bg-blue-100 dark:bg-blue-900/30"
                            style={{ width: `${percent}%` }}
                          />
                          <span className="relative z-10 font-medium">{opt.text}</span>
                          <span className="relative z-10 text-sm text-gray-500">
                            {opt.votes} ({percent}%)
                          </span>
                        </div>
                      ) : (
                        <ForumTopicAjaxForm topicId={topicId} forumAction="vote_poll" className="w-full" onAfterSuccess={onSuccess}>
                          <input type="hidden" name="poll_id" value={pollNumericId} />
                          <input type="hidden" name="option_id" value={opt.id} />
                          <button
                            type="submit"
                            className="w-full text-left bg-white dark:bg-neutral-900 hover:bg-blue-50 dark:hover:bg-neutral-800 border rounded-md p-3 transition font-medium"
                          >
                            {opt.text}
                          </button>
                        </ForumTopicAjaxForm>
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 text-sm text-gray-500">{t("threadPollTotalVotes", { count: totalVotes })}</div>
            </div>
          )}

          {topic.tags && topic.tags.length > 0 && (
            <div className="flex gap-2 mt-4 pt-4 border-t dark:border-neutral-800">
              {topic.tags.map((tag: string) => (
                <span
                  key={tag}
                  className="text-xs bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 px-2 py-1 rounded-full"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="bg-gray-50 dark:bg-neutral-800/50 px-4 sm:px-6 py-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-sm text-gray-500">
          <div className="flex flex-wrap items-center gap-2">
            <div className="bg-gray-200 dark:bg-neutral-800 rounded-full overflow-hidden w-6 h-6 shrink-0">
              {topic.author_avatar ? (
                <Image src={topic.author_avatar} alt={topic.author_name} width={24} height={24} className="w-full h-full object-cover" />
              ) : (
                <User className="w-4 h-4 m-1 text-gray-500" />
              )}
            </div>
            <span className="font-medium">{t("authorLabel", { name: topic.author_display_name || topic.author_name })}</span>
            <span
              className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300 px-2 py-0.5 rounded-full font-bold ml-2"
              title={t("threadKarmaTitle")}
            >
              ★ {topic.author_karma || 0}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <span className="flex items-center gap-1">
              <MessageSquare className="w-4 h-4" /> {allComments.length}{" "}
              <span className="hidden sm:inline">{t("answersCount")}</span>
            </span>
            <ForumTopicAjaxForm topicId={topicId} forumAction="like_topic" onAfterSuccess={onSuccess}>
              <button type="submit" className="flex items-center gap-1 hover:text-blue-600 transition">
                <ThumbsUp className="w-4 h-4" /> {topic.likes || 0}
              </button>
            </ForumTopicAjaxForm>
            <ForumTopicAjaxForm topicId={topicId} forumAction="dislike_topic" onAfterSuccess={onSuccess}>
              <button type="submit" className="flex items-center gap-1 hover:text-red-600 transition">
                <ThumbsDown className="w-4 h-4" /> {topic.dislikes || 0}
              </button>
            </ForumTopicAjaxForm>
            <details className="relative">
              <summary className="flex items-center gap-1 hover:text-orange-600 transition cursor-pointer list-none">
                <Flag className="w-4 h-4" />
              </summary>
              <div className="absolute right-0 bottom-full mb-2 w-64 bg-white dark:bg-neutral-900 border shadow-lg rounded-md p-3 z-10">
                <ForumTopicAjaxForm topicId={topicId} forumAction="report_content" className="flex flex-col gap-2" onAfterSuccess={onSuccess}>
                  <label className="text-xs font-bold">{t("threadReportTopicLabel")}</label>
                  <textarea
                    name="reason"
                    required
                    rows={2}
                    className="text-sm border rounded p-2 dark:bg-neutral-800 w-full"
                    placeholder={t("threadReportReasonPlaceholder")}
                  />
                  <button type="submit" className="bg-red-600 text-white text-xs py-1.5 rounded font-medium hover:bg-red-700">
                    {t("threadReportSubmit")}
                  </button>
                </ForumTopicAjaxForm>
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
              <button
                type="button"
                onClick={() => refetch("oldest")}
                className={`flex-1 text-center px-2 sm:px-3 py-1.5 text-xs sm:text-sm rounded-md transition ${sort === "oldest" ? "bg-white dark:bg-neutral-700 shadow-sm font-medium" : "text-gray-500 hover:text-gray-900 dark:hover:text-gray-300"}`}
              >
                {t("threadSortCommentsOldest")}
              </button>
              <button
                type="button"
                onClick={() => refetch("newest")}
                className={`flex-1 text-center px-2 sm:px-3 py-1.5 text-xs sm:text-sm rounded-md transition ${sort === "newest" ? "bg-white dark:bg-neutral-700 shadow-sm font-medium" : "text-gray-500 hover:text-gray-900 dark:hover:text-gray-300"}`}
              >
                {t("threadSortCommentsNewest")}
              </button>
              <button
                type="button"
                onClick={() => refetch("popular")}
                className={`flex-1 text-center px-2 sm:px-3 py-1.5 text-xs sm:text-sm rounded-md transition ${sort === "popular" ? "bg-white dark:bg-neutral-700 shadow-sm font-medium" : "text-gray-500 hover:text-gray-900 dark:hover:text-gray-300"}`}
              >
                {t("threadSortCommentsPopular")}
              </button>
            </div>
          )}
        </div>

        {rootComments.map((comment) => (
          <div
            key={comment.id}
            className={`bg-white dark:bg-neutral-900 p-4 sm:p-6 sm:rounded-xl border-y sm:border shadow-sm ${comment.is_best_answer ? "ring-2 ring-green-500 bg-green-50/50 dark:bg-green-900/10" : ""}`}
          >
            <div className="flex flex-col sm:flex-row justify-between items-start mb-3 gap-3">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="bg-gray-200 dark:bg-neutral-800 rounded-full overflow-hidden w-10 h-10 shrink-0">
                  {comment.author_avatar ? (
                    <Image src={comment.author_avatar} alt={comment.author_name} width={40} height={40} className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-6 h-6 m-2 text-gray-500" />
                  )}
                </div>
                <div>
                  <div className="font-bold text-sm flex items-center gap-2">
                    {comment.author_display_name || comment.author_name}
                    <span className="text-xs text-blue-600 dark:text-blue-400 font-bold" title={t("threadKarmaTitle")}>
                      ★ {comment.author_karma || 0}
                    </span>
                    {comment.is_best_answer && (
                      <span className="text-xs bg-green-500 text-white px-2 py-0.5 rounded-full flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" /> {t("threadBestAnswer")}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500">{new Date(comment.created_at).toLocaleString(locale)}</div>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto mt-2 sm:mt-0">
                {isTopicAuthor && !comment.is_best_answer && (
                  <ForumTopicAjaxForm topicId={topicId} forumAction="toggle_best_answer" onAfterSuccess={onSuccess}>
                    <input type="hidden" name="comment_id" value={comment.id} />
                    <button
                      type="submit"
                      className="flex items-center gap-1 text-xs text-green-600 hover:text-green-700 transition font-medium border border-green-200 bg-green-50 px-2 py-1 rounded-md dark:bg-green-900/30 dark:border-green-800"
                    >
                      {t("threadMarkSolution")}
                    </button>
                  </ForumTopicAjaxForm>
                )}
                <QuoteButton content={comment.content} size="md" />
                <ForumTopicAjaxForm topicId={topicId} forumAction="like_comment" onAfterSuccess={onSuccess}>
                  <input type="hidden" name="comment_id" value={comment.id} />
                  <button type="submit" className="flex items-center gap-1 text-sm text-gray-500 hover:text-blue-600 transition">
                    <ThumbsUp className="w-4 h-4" /> {comment.likes}
                  </button>
                </ForumTopicAjaxForm>
                <ForumTopicAjaxForm topicId={topicId} forumAction="dislike_comment" onAfterSuccess={onSuccess}>
                  <input type="hidden" name="comment_id" value={comment.id} />
                  <button type="submit" className="flex items-center gap-1 text-sm text-gray-500 hover:text-red-600 transition">
                    <ThumbsDown className="w-4 h-4" /> {comment.dislikes || 0}
                  </button>
                </ForumTopicAjaxForm>
                <details className="relative">
                  <summary className="flex items-center gap-1 text-sm text-gray-500 hover:text-orange-600 transition cursor-pointer list-none">
                    <Flag className="w-4 h-4" />
                  </summary>
                  <div className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-neutral-900 border shadow-lg rounded-md p-3 z-10">
                    <ForumTopicAjaxForm
                      topicId={topicId}
                      forumAction="report_content"
                      className="flex flex-col gap-2 mb-3 pb-3 border-b dark:border-neutral-800"
                      onAfterSuccess={onSuccess}
                    >
                      <input type="hidden" name="comment_id" value={comment.id} />
                      <label className="text-xs font-bold">{t("threadReportCommentLabel")}</label>
                      <textarea
                        name="reason"
                        required
                        rows={2}
                        className="text-sm border rounded p-2 dark:bg-neutral-800 w-full"
                        placeholder={t("threadReportReasonPlaceholder")}
                      />
                      <button type="submit" className="bg-red-600 text-white text-xs py-1.5 rounded font-medium hover:bg-red-700">
                        {t("threadReportSubmit")}
                      </button>
                    </ForumTopicAjaxForm>
                    {currentSessionId && comment.author_session_id && comment.author_session_id !== currentSessionId && (
                      <ForumTopicAjaxForm topicId={topicId} forumAction="ignore_user" onAfterSuccess={onSuccess}>
                        <input type="hidden" name="target_session_id" value={comment.author_session_id} />
                        <button type="submit" className="w-full text-left text-xs text-gray-500 hover:text-red-500 transition">
                          {t("threadIgnoreUser")}
                        </button>
                      </ForumTopicAjaxForm>
                    )}
                  </div>
                </details>
                {mod.delete_post ? (
                  <AdminForumModerateButton
                    action="delete_post"
                    postId={String(comment.id)}
                    confirmMessage={tAdmin("modDeleteCommentConfirm")}
                    onAfterSuccess={onSuccess}
                    className="text-gray-400 hover:text-red-500 transition inline-flex p-0 border-0 bg-transparent cursor-pointer"
                    title={tAdmin("delete")}
                  >
                    <Trash className="w-4 h-4" />
                  </AdminForumModerateButton>
                ) : (
                  userSession &&
                  comment.user_id === userSession.id && (
                    <ForumTopicAjaxForm topicId={topicId} forumAction="delete_comment" onAfterSuccess={onSuccess}>
                      <input type="hidden" name="comment_id" value={comment.id} />
                      <button type="submit" className="text-gray-400 hover:text-red-500 transition" title={t("threadDeleteTitle")}>
                        <Trash className="w-4 h-4" />
                      </button>
                    </ForumTopicAjaxForm>
                  )
                )}
              </div>
            </div>
            <p className="text-gray-700 dark:text-gray-300 pl-0 sm:pl-10 mb-4 prose dark:prose-invert max-w-none prose-sm">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{comment.content}</ReactMarkdown>
            </p>

            <div className="pl-4 sm:pl-10 space-y-4">
              {getReplies(comment.id).map((reply) => (
                <div
                  key={reply.id}
                  className={`bg-gray-50 dark:bg-neutral-800/50 p-3 sm:p-4 rounded-lg border dark:border-neutral-800 relative ${reply.is_best_answer ? "ring-2 ring-green-500 bg-green-50/50 dark:bg-green-900/10" : ""}`}
                >
                  <CornerDownRight className="absolute -left-4 sm:-left-6 top-4 w-4 h-4 text-gray-300 dark:text-gray-600 hidden sm:block" />
                  <div className="flex flex-col sm:flex-row justify-between items-start mb-2 gap-2">
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <div className="bg-gray-200 dark:bg-neutral-800 rounded-full overflow-hidden w-6 h-6 shrink-0">
                        {reply.author_avatar ? (
                          <Image src={reply.author_avatar} alt={reply.author_name} width={24} height={24} className="w-full h-full object-cover" />
                        ) : (
                          <User className="w-4 h-4 m-1 text-gray-500" />
                        )}
                      </div>
                      <div className="font-bold text-sm flex items-center gap-2">
                        {reply.author_display_name || reply.author_name}
                        <span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold" title={t("threadKarmaTitle")}>
                          ★ {reply.author_karma || 0}
                        </span>
                        {reply.is_best_answer && (
                          <span className="text-[10px] bg-green-500 text-white px-1.5 py-0.5 rounded-full flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" /> {t("threadSolutionBadge")}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500">{new Date(reply.created_at).toLocaleString(locale)}</div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto mt-1 sm:mt-0">
                      {isTopicAuthor && !reply.is_best_answer && (
                        <ForumTopicAjaxForm topicId={topicId} forumAction="toggle_best_answer" onAfterSuccess={onSuccess}>
                          <input type="hidden" name="comment_id" value={reply.id} />
                          <button
                            type="submit"
                            className="text-[10px] text-green-600 hover:text-green-700 transition font-medium border border-green-200 bg-green-50 px-1.5 py-0.5 rounded dark:bg-green-900/30 dark:border-green-800"
                          >
                            {t("threadMarkSolution")}
                          </button>
                        </ForumTopicAjaxForm>
                      )}
                      <QuoteButton content={reply.content} size="sm" />
                      <ForumTopicAjaxForm topicId={topicId} forumAction="like_comment" onAfterSuccess={onSuccess}>
                        <input type="hidden" name="comment_id" value={reply.id} />
                        <button type="submit" className="flex items-center gap-1 text-xs text-gray-500 hover:text-blue-600 transition">
                          <ThumbsUp className="w-3 h-3" /> {reply.likes}
                        </button>
                      </ForumTopicAjaxForm>
                      <ForumTopicAjaxForm topicId={topicId} forumAction="dislike_comment" onAfterSuccess={onSuccess}>
                        <input type="hidden" name="comment_id" value={reply.id} />
                        <button type="submit" className="flex items-center gap-1 text-xs text-gray-500 hover:text-red-600 transition">
                          <ThumbsDown className="w-3 h-3" /> {reply.dislikes || 0}
                        </button>
                      </ForumTopicAjaxForm>
                      <details className="relative">
                        <summary className="flex items-center gap-1 text-xs text-gray-500 hover:text-orange-600 transition cursor-pointer list-none">
                          <Flag className="w-3 h-3" />
                        </summary>
                        <div className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-neutral-900 border shadow-lg rounded-md p-3 z-10">
                          <ForumTopicAjaxForm
                            topicId={topicId}
                            forumAction="report_content"
                            className="flex flex-col gap-2 mb-3 pb-3 border-b dark:border-neutral-800"
                            onAfterSuccess={onSuccess}
                          >
                            <input type="hidden" name="comment_id" value={reply.id} />
                            <label className="text-xs font-bold">{t("threadReportReplyLabel")}</label>
                            <textarea
                              name="reason"
                              required
                              rows={2}
                              className="text-sm border rounded p-2 dark:bg-neutral-800 w-full"
                              placeholder={t("threadReportReasonPlaceholder")}
                            />
                            <button type="submit" className="bg-red-600 text-white text-xs py-1.5 rounded font-medium hover:bg-red-700">
                              {t("threadReportSubmit")}
                            </button>
                          </ForumTopicAjaxForm>
                          {currentSessionId && reply.author_session_id && reply.author_session_id !== currentSessionId && (
                            <ForumTopicAjaxForm topicId={topicId} forumAction="ignore_user" onAfterSuccess={onSuccess}>
                              <input type="hidden" name="target_session_id" value={reply.author_session_id} />
                              <button type="submit" className="w-full text-left text-xs text-gray-500 hover:text-red-500 transition">
                                {t("threadIgnoreUser")}
                              </button>
                            </ForumTopicAjaxForm>
                          )}
                        </div>
                      </details>
                      {mod.delete_post ? (
                        <AdminForumModerateButton
                          action="delete_post"
                          postId={String(reply.id)}
                          confirmMessage={tAdmin("modDeleteCommentConfirm")}
                          onAfterSuccess={onSuccess}
                          className="text-gray-400 hover:text-red-500 transition inline-flex p-0 border-0 bg-transparent cursor-pointer"
                          title={tAdmin("delete")}
                        >
                          <Trash className="w-3 h-3" />
                        </AdminForumModerateButton>
                      ) : (
                        userSession &&
                        reply.user_id === userSession.id && (
                          <ForumTopicAjaxForm topicId={topicId} forumAction="delete_comment" onAfterSuccess={onSuccess}>
                            <input type="hidden" name="comment_id" value={reply.id} />
                            <button type="submit" className="text-gray-400 hover:text-red-500 transition" title={t("threadDeleteTitle")}>
                              <Trash className="w-3 h-3" />
                            </button>
                          </ForumTopicAjaxForm>
                        )
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
                  <summary className="text-sm text-blue-600 hover:underline cursor-pointer list-none font-medium">{t("threadReplyToggle")}</summary>
                  {userSession ? (
                    <ForumTopicAjaxForm
                      topicId={topicId}
                      forumAction="add_comment"
                      className="mt-3 bg-white dark:bg-neutral-900 p-3 sm:p-4 rounded-lg border shadow-sm"
                      onAfterSuccess={onSuccess}
                    >
                      <input type="hidden" name="parent_id" value={comment.id} />
                      <textarea
                        name="content"
                        required
                        rows={2}
                        className="w-full border dark:border-neutral-700 rounded-md px-3 py-2 bg-gray-50 dark:bg-neutral-800 mb-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        placeholder={t("threadReplyPlaceholder")}
                      />
                      <div className="flex flex-col sm:flex-row justify-end items-stretch sm:items-center gap-3 sm:gap-2">
                        <button
                          type="submit"
                          className="bg-blue-600 text-white px-4 py-1.5 rounded-md text-sm font-medium hover:bg-blue-700 transition w-full sm:w-auto"
                        >
                          {t("send")}
                        </button>
                      </div>
                    </ForumTopicAjaxForm>
                  ) : (
                    <div className="mt-3 p-3 bg-gray-50 dark:bg-neutral-800 rounded-lg text-sm text-gray-500">
                      <Link href="/forum/login" className="text-blue-600 hover:underline">
                        {t("threadLoginLink")}
                      </Link>
                      {t("threadLoginToReplySuffix")}
                    </div>
                  )}
                </details>
              )}
            </div>
          </div>
        ))}

        {allComments.length === 0 && <div className="text-center text-gray-500 py-4">{t("noAnswers")}</div>}
      </div>

      {!topic.is_closed ? (
        <div className="bg-white dark:bg-neutral-900 p-6 rounded-xl border shadow-sm">
          <h3 className="text-lg font-bold mb-4">{t("writeAnswer")}</h3>
          {userSession ? (
            <ForumTopicAjaxForm topicId={topicId} forumAction="add_comment" onAfterSuccess={onSuccess}>
              <textarea
                id="comment-textarea"
                name="content"
                required
                rows={4}
                className="w-full border dark:border-neutral-700 rounded-md px-4 py-3 bg-gray-50 dark:bg-neutral-800 mb-4 focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder={t("commentPlaceholder") + t("markdownSupported")}
              />
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-4 w-full sm:w-auto">
                  <FileUploadButton targetId="comment-textarea" />
                </div>
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-6 py-2 rounded-md font-medium hover:bg-blue-700 transition w-full sm:w-auto"
                >
                  {t("send")}
                </button>
              </div>
            </ForumTopicAjaxForm>
          ) : (
            <div className="text-center py-6 bg-gray-50 dark:bg-neutral-800 rounded-lg">
              <p className="text-gray-500 mb-4">{t("threadLoginToComment")}</p>
              <Link href="/forum/login" className="inline-flex items-center bg-blue-600 text-white px-6 py-2 rounded-md font-medium hover:bg-blue-700 transition">
                {t("threadSignIn")}
              </Link>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-gray-50 dark:bg-neutral-800/50 p-6 rounded-xl border text-center text-gray-500 font-medium">
          <Lock className="w-6 h-6 mx-auto mb-2 text-gray-400" />
          {t("threadTopicClosedReplies")}
        </div>
      )}
    </div>
  );
}
