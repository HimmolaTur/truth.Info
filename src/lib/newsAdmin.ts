import { rewriteUnsplashToLocalImagePath } from "@/lib/localImageUrl";

/** Краткий текст для карточек / карусели (убирает HTML-теги). */
export function newsPlainPreview(raw: string | null | undefined, maxLen = 240): string {
  const text = String(raw ?? "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!text) return "";
  return text.length > maxLen ? `${text.slice(0, maxLen)}…` : text;
}

/** URL картинки: приоритет image_url, затем устаревшая колонка image. Unsplash → /images/... локально. */
export function newsImageUrlFromRow(row: Record<string, unknown>): string | null {
  const u = row.image_url;
  if (typeof u === "string" && u.trim()) {
    return rewriteUnsplashToLocalImagePath(u.trim()) ?? u.trim();
  }
  const legacy = row.image;
  if (typeof legacy === "string" && legacy.trim()) {
    return rewriteUnsplashToLocalImagePath(legacy.trim()) ?? legacy.trim();
  }
  return null;
}

export type HomeNewsCard = {
  id: number;
  title: string;
  content_preview: string;
  category: string;
  is_important: boolean;
  image_url: string | null;
  created_at: Date | string;
};

export function rowToHomeNewsCard(row: Record<string, unknown>, previewLen = 220): HomeNewsCard {
  return {
    id: Number(row.id),
    title: String(row.title ?? ""),
    content_preview: newsPlainPreview(String(row.content ?? ""), previewLen),
    category:
      row.category != null && String(row.category).trim()
        ? String(row.category).trim()
        : "Общее",
    is_important: Boolean(row.is_important),
    image_url: newsImageUrlFromRow(row),
    created_at: row.created_at as Date | string,
  };
}

/** Теги из поля формы «через запятую» → массив для PostgreSQL text[] */
export function parseNewsTagsFromForm(raw: string | null | undefined): string[] {
  if (raw == null || typeof raw !== "string") return [];
  return raw
    .split(/[,;]+/)
    .map((t) => t.trim())
    .filter(Boolean);
}

/** Значение для input тегов из ответа БД */
export function newsTagsToInputValue(raw: unknown): string {
  if (raw == null) return "";
  if (Array.isArray(raw)) return raw.map(String).join(", ");
  if (typeof raw === "string") {
    try {
      const p = JSON.parse(raw) as unknown;
      return Array.isArray(p) ? p.map(String).join(", ") : raw;
    } catch {
      return raw;
    }
  }
  return "";
}

export function formatNewsDatetimeLocalInput(value: unknown): string {
  if (value == null) return "";
  const d = new Date(value as string);
  if (Number.isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const h = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${y}-${m}-${day}T${h}:${min}`;
}

/** Для отображения тегов на сайте (массив из БД или строка). */
export function newsTagsForDisplay(raw: unknown): string[] {
  if (raw == null) return [];
  if (Array.isArray(raw)) return raw.map(String).filter(Boolean);
  return parseNewsTagsFromForm(String(raw));
}

export function parseNewsPublishedAt(raw: string | null | undefined): Date | null {
  if (raw == null) return null;
  const s = String(raw).trim();
  if (!s) return null;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}
