/**
 * Любые сохранённые в БД ссылки на Unsplash переписываем на файлы из public/images.
 * Имена: photo-{id}-{hash}.jpg (как в оригинальных URL Unsplash).
 */
export function rewriteUnsplashToLocalImagePath(url: string | null | undefined): string | null {
  if (url == null || typeof url !== "string") return null;
  const u = url.trim();
  if (!u) return null;
  if (u.startsWith("/") && !u.startsWith("//")) return u;

  if (/unsplash\.com/i.test(u)) {
    const m = u.match(/photo-(\d+-[a-zA-Z0-9]+)/);
    if (m) return `/images/photo-${m[1]}.jpg`;
  }

  return u;
}
