import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { jsonError } from "@/lib/api";

export const runtime = "nodejs";

const ICONS = ["city", "point"];

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await req.json().catch(() => ({}));
    const updates: Record<string, unknown> = {};

    if (Number.isFinite(Number(body?.x))) updates.x = Number(body.x);
    if (Number.isFinite(Number(body?.y))) updates.y = Number(body.y);
    if (typeof body?.label === "string") updates.label = body.label.trim();
    if (ICONS.includes(body?.icon)) updates.icon = body.icon;
    if ("tooltip" in (body ?? {})) {
      updates.tooltip =
        typeof body.tooltip === "string" && body.tooltip.trim()
          ? body.tooltip.trim()
          : null;
    }

    if (Object.keys(updates).length === 0) {
      return jsonError("Nada que actualizar");
    }

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("markers")
      .update(updates)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;

    return NextResponse.json({ marker: data });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error inesperado";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from("markers").delete().eq("id", id);
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error inesperado";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
