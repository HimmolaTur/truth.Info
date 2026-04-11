import { revalidatePath } from "next/cache";
import { query } from "@/lib/db";
import { slugify } from "@/lib/utils";

export async function revalidateForumTopicPath(topicId: number) {
  const r = await query("SELECT title FROM forum_topics WHERE id = $1", [topicId]);
  if (r.rows.length > 0) {
    revalidatePath(`/forum/${topicId}-${slugify(r.rows[0].title)}`);
  }
}
