import { NextResponse } from "next/server";
import { MAPS_BUCKET, getSupabaseAdmin } from "@/lib/supabase-admin";
import { jsonError, slugify } from "@/lib/api";

export const runtime = "nodejs";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await req.json().catch(() => ({}));
    const updates: Record<string, string> = {};

    if (typeof body?.name === "string" && body.name.trim()) {
      updates.name = body.name.trim();
    }
    if (typeof body?.slug === "string" && body.slug.trim()) {
      updates.slug = slugify(body.slug);
    }
    if (Object.keys(updates).length === 0) {
      return jsonError("Nada que actualizar");
    }

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("maps")
      .update(updates)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;

    return NextResponse.json({ map: data });
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
    const { data: row, error: fetchError } = await supabase
      .from("maps")
      .select("image_path")
      .eq("id", id)
      .maybeSingle();

    if (fetchError) throw fetchError;
    if (!row) return jsonError("Mapa no encontrado", 404);

    const { error: deleteError } = await supabase
      .from("maps")
      .delete()
      .eq("id", id);
    if (deleteError) throw deleteError;

    if (row.image_path) {
      await supabase.storage.from(MAPS_BUCKET).remove([row.image_path]);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error inesperado";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
