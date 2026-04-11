/** Preset forum avatars (paths under /public). Only these may be set via profile/admin picker. */
export const PRESET_AVATAR_URLS = [
  "/avatars/avatar1.svg",
  "/avatars/avatar2.svg",
  "/avatars/avatar3.svg",
  "/avatars/avatar4.svg",
  "/avatars/avatar5.svg",
  "/avatars/avatar6.svg",
  "/avatars/avatar7.svg",
  "/avatars/avatar8.svg",
  "/avatars/avatar9.svg",
  "/avatars/avatar10.svg",
] as const;

export type PresetAvatarUrl = (typeof PRESET_AVATAR_URLS)[number];

export function isPresetAvatarUrl(url: string | null | undefined): url is PresetAvatarUrl {
  if (!url || typeof url !== "string") return false;
  const t = url.trim();
  return (PRESET_AVATAR_URLS as readonly string[]).includes(t);
}

export function normalizePresetAvatarUrl(url: string | null | undefined): PresetAvatarUrl {
  if (isPresetAvatarUrl(url)) return url;
  return PRESET_AVATAR_URLS[0];
}
