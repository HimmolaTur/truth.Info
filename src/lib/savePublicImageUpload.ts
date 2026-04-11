import { writeFile } from "fs/promises";
import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";

const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/gif", "image/webp"]);

const EXT_BY_MIME: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/gif": ".gif",
  "image/webp": ".webp",
};

/** Max upload size for news and generic /api/upload (5 MiB). */
export const PUBLIC_IMAGE_UPLOAD_MAX_BYTES = 5 * 1024 * 1024;

function effectiveImageMime(file: File): string {
  const t = (file.type || "").toLowerCase();
  if (t && t !== "application/octet-stream") return t;
  const n = file.name.toLowerCase();
  if (n.endsWith(".jpg") || n.endsWith(".jpeg")) return "image/jpeg";
  if (n.endsWith(".png")) return "image/png";
  if (n.endsWith(".gif")) return "image/gif";
  if (n.endsWith(".webp")) return "image/webp";
  return t;
}

export type SavePublicImageResult =
  | { ok: true; url: string }
  | { ok: false; code: "empty" | "too_large" | "invalid_type" };

/**
 * Writes an image under public/uploads and returns a site-relative URL (/uploads/…).
 */
export async function savePublicImageUpload(file: File): Promise<SavePublicImageResult> {
  if (!(file instanceof File) || file.size <= 0) {
    return { ok: false, code: "empty" };
  }
  if (file.size > PUBLIC_IMAGE_UPLOAD_MAX_BYTES) {
    return { ok: false, code: "too_large" };
  }
  const mime = effectiveImageMime(file);
  if (!ALLOWED_MIME.has(mime)) {
    return { ok: false, code: "invalid_type" };
  }
  const ext = EXT_BY_MIME[mime];
  if (!ext) {
    return { ok: false, code: "invalid_type" };
  }
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const filename = `${Date.now()}-${randomUUID()}${ext}`;
  const uploadDir = path.join(process.cwd(), "public", "uploads");
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
  await writeFile(path.join(uploadDir, filename), buffer);
  return { ok: true, url: `/uploads/${filename}` };
}
