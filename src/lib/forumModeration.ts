export type ForumModerationFlags = {
  delete_post: boolean;
  delete_topic: boolean;
  pin_topic: boolean;
  unpin_topic: boolean;
  close_topic: boolean;
  open_topic: boolean;
};

export function forumModerationFromPermissions(perms: string[]): ForumModerationFlags {
  const has = (k: string) => perms.includes(k);
  return {
    delete_post: has("forum.moderate.delete_post"),
    delete_topic: has("forum.moderate.delete_topic"),
    pin_topic: has("forum.moderate.pin_topic"),
    unpin_topic: has("forum.moderate.unpin_topic"),
    close_topic: has("forum.moderate.close_topic"),
    open_topic: has("forum.moderate.open_topic"),
  };
}
