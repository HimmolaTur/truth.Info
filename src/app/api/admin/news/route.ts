import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { assertPermission } from "@/lib/adminAuthUtils";
import { rewriteUnsplashToLocalImagePath } from "@/lib/localImageUrl";
import { savePublicImageUpload } from "@/lib/savePublicImageUpload";
import {
  parseNewsTagsFromForm,
  parseNewsPublishedAt,
} from "@/lib/newsAdmin";

function mapImageUploadError(code: "empty" | "too_large" | "invalid_type") {
  if (code === "too_large") return "image_too_large";
  if (code === "invalid_type") return "image_invalid_type";
  return "image_invalid_type";
}

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const action = form.get("action") as string | null;
    const perm =
      action === "delete"
        ? "content.news.delete"
        : action === "create"
          ? "content.news.create"
          : action === "update"
            ? "content.news.update"
            : null;
    if (!perm) {
      return NextResponse.json({ ok: false, error: "unknown action" }, { status: 400 });
    }
    const denied = await assertPermission(req, perm);
    if (denied) return denied;

    if (action === "delete") {
      const id = form.get("id");
      if (!id) return NextResponse.json({ ok: false, error: "missing id" }, { status: 400 });
      await query("DELETE FROM news WHERE id = $1", [Number(id)]);
      return NextResponse.json({ ok: true });
    }

    const title = String(form.get("title") || "").trim();
    const content = String(form.get("content") || "");
    const imageFile = form.get("image_file");
    let imageUrlStored: string | null = null;
    if (imageFile instanceof File && imageFile.size > 0) {
      const uploaded = await savePublicImageUpload(imageFile);
      if (!uploaded.ok) {
        return NextResponse.json(
          { ok: false, error: mapImageUploadError(uploaded.code) },
          { status: uploaded.code === "too_large" ? 413 : 400 }
        );
      }
      imageUrlStored = uploaded.url;
    } else {
      const imageUrlRaw = String(form.get("image_url") ?? form.get("image") ?? "").trim();
      imageUrlStored = imageUrlRaw
        ? rewriteUnsplashToLocalImagePath(imageUrlRaw) ?? imageUrlRaw
        : null;
    }
    const categoryRaw = String(form.get("category") ?? "").trim();
    const category = categoryRaw || "Общее";
    const tags = parseNewsTagsFromForm(String(form.get("tags") ?? ""));
    const isImportant = form.get("is_important") === "on";
    const isFeatured = form.get("is_featured") === "on";
    const publishedAt = parseNewsPublishedAt(String(form.get("created_at") ?? ""));

    if (action === "create") {
      if (!title) {
        return NextResponse.json({ ok: false, error: "title required" }, { status: 400 });
      }
      await query(
        `INSERT INTO news (title, content, image_url, category, tags, is_important, is_featured, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5::text[], $6, $7, COALESCE($8::timestamptz, NOW()), NOW())`,
        [
          title,
          content,
          imageUrlStored,
          category,
          tags,
          isImportant,
          isFeatured,
          publishedAt,
        ]
      );
      return NextResponse.json({ ok: true });
    }

    if (action === "update") {
      const id = form.get("id");
      if (!id) return NextResponse.json({ ok: false, error: "missing id" }, { status: 400 });
      if (!title) {
        return NextResponse.json({ ok: false, error: "title required" }, { status: 400 });
      }
      const idNum = Number(id);
      let createdAtForDb: Date;
      if (publishedAt) {
        createdAtForDb = publishedAt;
      } else {
        const existing = await query("SELECT created_at FROM news WHERE id = $1", [idNum]);
        if (existing.rows.length === 0) {
          return NextResponse.json({ ok: false, error: "not found" }, { status: 404 });
        }
        createdAtForDb = new Date(existing.rows[0].created_at);
      }
      await query(
        `UPDATE news SET
           title = $1,
           content = $2,
           image_url = $3,
           category = $4,
           tags = $5::text[],
           is_important = $6,
           is_featured = $7,
           created_at = $8::timestamptz,
           updated_at = NOW()
         WHERE id = $9`,
        [
          title,
          content,
          imageUrlStored,
          category,
          tags,
          isImportant,
          isFeatured,
          createdAtForDb,
          idNum,
        ]
      );
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: false, error: "unknown action" }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
