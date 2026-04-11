import { ForumThreadClient } from "@/components/forum/ForumThreadClient";
import { query } from "@/lib/db";
import { loadForumThreadPayload } from "@/lib/forumThreadData";
import { notFound } from "next/navigation";
import { getSession } from "@/lib/auth";
import { cookies } from "next/headers";
import { getServerSession } from "next-auth";
import authOptions from "@/lib/authOptions";
import { forumModerationFromPermissions } from "@/lib/forumModeration";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

export async function generateMetadata({ params }: { params: { id: string; locale: string } }): Promise<Metadata> {
  const t = await getTranslations({ locale: params.locale, namespace: "Forum" });
  const topicId = parseInt(params.id, 10);
  if (isNaN(topicId)) return { title: t("threadTopicNotFound") };

  const topicResult = await query("SELECT title, content FROM forum_topics WHERE id = $1", [topicId]);
  if (topicResult.rows.length === 0) return { title: t("threadTopicNotFound") };

  const topic = topicResult.rows[0] as { title: string; content: string };
  const description = topic.content.substring(0, 160).replace(/\n/g, " ") + "...";

  return {
    title: `${topic.title} | ${t("threadMetaSuffix")}`,
    description,
    openGraph: {
      title: topic.title,
      description,
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: topic.title,
      description,
    },
  };
}

export default async function ForumThreadPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { sort?: string };
}) {
  const topicId = parseInt(params.id, 10);
  const sort = searchParams.sort || "oldest";

  if (isNaN(topicId)) {
    notFound();
  }

  const userSession = await getSession();
  const authSession = await getServerSession(authOptions);
  const modPerms = (Array.isArray(authSession?.user?.permissions)
    ? authSession.user.permissions
    : []) as string[];
  const forumModeration = forumModerationFromPermissions(modPerms);
  const cookieStore = cookies();
  const currentSessionId = cookieStore.get("anon_session")?.value ?? null;

  const userLite = userSession ? { id: userSession.id, username: userSession.username } : null;

  const initialData = await loadForumThreadPayload(topicId, sort, {
    bumpViews: true,
    userSession: userLite,
    currentSessionId,
    forumModeration,
  });

  if (!initialData) {
    notFound();
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "DiscussionForumPosting",
    headline: initialData.topic.title,
    articleBody: initialData.topic.content,
    author: {
      "@type": "Person",
      name: initialData.topic.author_name,
    },
    datePublished: new Date(initialData.topic.created_at).toISOString(),
    interactionStatistic: {
      "@type": "InteractionCounter",
      interactionType: "https://schema.org/CommentAction",
      userInteractionCount: initialData.allComments.length,
    },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ForumThreadClient initialData={initialData} topicId={topicId} />
    </>
  );
}
