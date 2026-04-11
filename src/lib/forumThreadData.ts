import { query } from "@/lib/db";

export type ForumUserSessionLite = { id: number; username: string };

export type ForumCommentDTO = {
  id: number;
  content: string;
  author_name: string;
  likes: number;
  dislikes: number;
  parent_id: number | null;
  created_at: string;
  author_session_id: string | null;
  user_id: number | null;
  is_best_answer: boolean;
  author_karma: number | null;
  author_avatar: string | null;
  author_display_name: string | null;
};

export type ForumThreadPayload = {
  topic: Record<string, unknown> & {
    title: string;
    content: string;
    category_id: number;
    category_name: string | null;
    author_name: string;
    author_display_name: string | null;
    author_avatar: string | null;
    author_karma: number | null;
    user_id: number | null;
    is_pinned: boolean;
    is_closed: boolean;
    views: number;
    likes: number;
    dislikes: number;
    tags: string[] | null;
    created_at: string;
  };
  categories: Array<Record<string, unknown>>;
  allComments: ForumCommentDTO[];
  poll: Record<string, unknown> | null;
  pollOptions: Array<Record<string, unknown> & { id: number; text: string; votes: number }>;
  hasVoted: boolean;
  totalVotes: number;
  isSubscribed: boolean;
  userSession: ForumUserSessionLite | null;
  currentSessionId: string | null;
  isTopicAuthor: boolean;
  /** Права модерации на странице темы (по JWT). */
  forum_moderation: {
    delete_post: boolean;
    delete_topic: boolean;
    pin_topic: boolean;
    unpin_topic: boolean;
    close_topic: boolean;
    open_topic: boolean;
  };
  sort: string;
};

function toIso(v: unknown): string {
  if (v instanceof Date) return v.toISOString();
  if (typeof v === "string") return v;
  return String(v);
}

export async function loadForumThreadPayload(
  topicId: number,
  sort: string,
  opts: {
    bumpViews: boolean;
    userSession: ForumUserSessionLite | null;
    currentSessionId: string | null;
    forumModeration?: {
      delete_post: boolean;
      delete_topic: boolean;
      pin_topic: boolean;
      unpin_topic: boolean;
      close_topic: boolean;
      open_topic: boolean;
    };
  }
): Promise<ForumThreadPayload | null> {
  if (opts.bumpViews) {
    await query("UPDATE forum_topics SET views = views + 1 WHERE id = $1", [topicId]);
  }

  const topicResult = await query(
    `
    SELECT t.*, c.name as category_name, u.karma as author_karma, usr.avatar_url as author_avatar, usr.display_name as author_display_name
    FROM forum_topics t 
    LEFT JOIN forum_categories c ON t.category_id = c.id 
    LEFT JOIN user_profiles u ON t.author_session_id = u.session_id
    LEFT JOIN users usr ON t.user_id = usr.id
    WHERE t.id = $1
  `,
    [topicId]
  );

  if (topicResult.rows.length === 0) return null;

  const rawTopic = topicResult.rows[0] as Record<string, unknown>;
  const rawTags = rawTopic.tags;
  const tagsNorm: string[] | null =
    rawTags == null
      ? null
      : Array.isArray(rawTags)
        ? rawTags.map((x) => String(x))
        : typeof rawTags === "string"
          ? [rawTags]
          : null;

  const topic = {
    ...rawTopic,
    tags: tagsNorm,
    created_at: toIso(rawTopic.created_at),
  } as ForumThreadPayload["topic"];

  const isTopicAuthor = Boolean(opts.userSession && topic.user_id === opts.userSession.id);

  let ignoredSessions: string[] = [];
  if (opts.currentSessionId) {
    const userRes = await query("SELECT ignored_sessions FROM user_profiles WHERE session_id = $1", [
      opts.currentSessionId,
    ]);
    if (userRes.rows.length > 0 && userRes.rows[0].ignored_sessions) {
      ignoredSessions = userRes.rows[0].ignored_sessions;
    }
  }

  const categoriesResult = await query("SELECT * FROM forum_categories ORDER BY id");
  const categories = categoriesResult.rows as Array<Record<string, unknown>>;

  let commentsOrderBy = "c.created_at ASC";
  if (sort === "newest") {
    commentsOrderBy = "c.created_at DESC";
  } else if (sort === "popular") {
    commentsOrderBy = "c.likes DESC, c.created_at ASC";
  }

  const commentsResult = await query(
    `
    SELECT c.*, u.karma as author_karma, usr.avatar_url as author_avatar, usr.display_name as author_display_name
    FROM forum_comments c
    LEFT JOIN user_profiles u ON c.author_session_id = u.session_id
    LEFT JOIN users usr ON c.user_id = usr.id
    WHERE c.topic_id = $1 
    ORDER BY c.is_best_answer DESC, ${commentsOrderBy}
  `,
    [topicId]
  );

  const allComments = (commentsResult.rows as Record<string, unknown>[])
    .filter((c) => {
      const sid = c.author_session_id as string | null;
      return !sid || !ignoredSessions.includes(sid);
    })
    .map((c) => ({
      id: c.id as number,
      content: String(c.content ?? ""),
      author_name: String(c.author_name ?? ""),
      likes: Number(c.likes ?? 0),
      dislikes: Number(c.dislikes ?? 0),
      parent_id: (c.parent_id as number | null) ?? null,
      created_at: toIso(c.created_at),
      author_session_id: (c.author_session_id as string | null) ?? null,
      user_id: (c.user_id as number | null) ?? null,
      is_best_answer: Boolean(c.is_best_answer),
      author_karma: (c.author_karma as number | null) ?? null,
      author_avatar: (c.author_avatar as string | null) ?? null,
      author_display_name: (c.author_display_name as string | null) ?? null,
    }));

  const pollRes = await query("SELECT * FROM forum_polls WHERE topic_id = $1", [topicId]);
  const pollRow = pollRes.rows.length > 0 ? (pollRes.rows[0] as Record<string, unknown>) : null;
  const poll = pollRow ? { ...pollRow } : null;

  let pollOptions: ForumThreadPayload["pollOptions"] = [];
  let hasVoted = false;
  let totalVotes = 0;

  if (poll && typeof poll.id === "number") {
    const optionsRes = await query("SELECT * FROM forum_poll_options WHERE poll_id = $1 ORDER BY id", [
      poll.id,
    ]);
    pollOptions = optionsRes.rows.map((opt: Record<string, unknown>) => ({
      ...opt,
      id: opt.id as number,
      text: String(opt.text ?? ""),
      votes: Number(opt.votes ?? 0),
    }));
    totalVotes = pollOptions.reduce((sum, opt) => sum + opt.votes, 0);

    if (opts.currentSessionId) {
      const voteRes = await query(
        "SELECT id FROM forum_poll_votes WHERE poll_id = $1 AND session_id = $2",
        [poll.id, opts.currentSessionId]
      );
      hasVoted = voteRes.rows.length > 0;
    }
  }

  let isSubscribed = false;
  if (opts.userSession) {
    const subRes = await query("SELECT id FROM forum_subscriptions WHERE user_id = $1 AND topic_id = $2", [
      opts.userSession.id,
      topicId,
    ]);
    isSubscribed = subRes.rows.length > 0;
  }

  return {
    topic,
    categories,
    allComments,
    poll,
    pollOptions,
    hasVoted,
    totalVotes,
    isSubscribed,
    userSession: opts.userSession,
    currentSessionId: opts.currentSessionId,
    isTopicAuthor,
    forum_moderation: opts.forumModeration ?? {
      delete_post: false,
      delete_topic: false,
      pin_topic: false,
      unpin_topic: false,
      close_topic: false,
      open_topic: false,
    },
    sort,
  };
}
