import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { jsonError } from "@/lib/api";

export const runtime = "nodejs";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await req.json().catch(() => ({}));
    const x1 = Number(body?.x1);
    const y1 = Number(body?.y1);
    const x2 = Number(body?.x2);
    const y2 = Number(body?.y2);
    const color = typeof body?.color === "string" ? body.color : "#000000";
    const weight = Number.isFinite(Number(body?.weight)) ? Number(body.weight) : 3;
    const opacity = Number.isFinite(Number(body?.opacity))
      ? Number(body.opacity)
      : 1.0;

    if (![x1, y1, x2, y2].every(Number.isFinite)) {
      return jsonError("Coordenadas inválidas");
    }

    const supabase = getSupabaseAdmin();
    const { data: map, error: mapError } = await supabase
      .from("maps")
      .select("id")
      .eq("id", id)
      .maybeSingle();
    if (mapError) throw mapError;
    if (!map) return jsonError("Mapa no encontrado", 404);

    const { data, error } = await supabase
      .from("lines")
      .insert({ map_id: id, x1, y1, x2, y2, color, weight, opacity })
      .select()
      .single();
    if (error) throw error;

    return NextResponse.json({ line: data }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error inesperado";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
