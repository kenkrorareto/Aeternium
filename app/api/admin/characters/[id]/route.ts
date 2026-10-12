import { NextResponse } from "next/server";
import { CHARACTERS_BUCKET, getSupabaseAdmin } from "@/lib/supabase-admin";
import { jsonError } from "@/lib/api";

export const runtime = "nodejs";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const supabase = getSupabaseAdmin();
    const { data: row, error: fetchError } = await supabase
      .from("characters")
      .select("image_path")
      .eq("id", id)
      .maybeSingle();

    if (fetchError) throw fetchError;
    if (!row) return jsonError("Personaje no encontrado", 404);

    const { error: deleteError } = await supabase
      .from("characters")
      .delete()
      .eq("id", id);
    if (deleteError) throw deleteError;

    if (row.image_path) {
      await supabase.storage.from(CHARACTERS_BUCKET).remove([row.image_path]);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error inesperado";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
