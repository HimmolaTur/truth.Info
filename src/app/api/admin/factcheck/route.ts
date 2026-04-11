import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { assertPermission } from "@/lib/adminAuthUtils";

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const action = form.get("action") as string | null;
    const perm =
      action === "delete"
        ? "content.factcheck.delete"
        : action === "create"
          ? "content.factcheck.create"
          : action === "update"
            ? "content.factcheck.update"
            : null;
    if (!perm) {
      return NextResponse.json({ ok: false, error: "unknown action" }, { status: 400 });
    }
    const denied = await assertPermission(req, perm);
    if (denied) return denied;

    if (action === "delete") {
      const id = form.get("id");
      if (!id) return NextResponse.json({ ok: false, error: "missing id" }, { status: 400 });
      await query("DELETE FROM factchecks WHERE id = $1", [Number(id)]);
      return NextResponse.json({ ok: true });
    }

    if (action === "create") {
      const claim = String(form.get("claim") || "");
      const truth = String(form.get("truth") || "");
      const sources = String(form.get("sources") || "");
      await query("INSERT INTO factchecks (claim, truth, sources, created_at) VALUES ($1,$2,$3,NOW())", [claim, truth, sources]);
      return NextResponse.json({ ok: true });
    }

    if (action === "update") {
      const id = form.get("id");
      if (!id) return NextResponse.json({ ok: false, error: "missing id" }, { status: 400 });
      const claim = String(form.get("claim") || "");
      const truth = String(form.get("truth") || "");
      const sources = String(form.get("sources") || "");
      await query("UPDATE factchecks SET claim=$1, truth=$2, sources=$3, updated_at=NOW() WHERE id=$4", [claim, truth, sources, Number(id)]);
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: false, error: "unknown action" }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}

