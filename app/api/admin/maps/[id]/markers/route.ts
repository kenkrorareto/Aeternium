import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { jsonError } from "@/lib/api";

export const runtime = "nodejs";

const ICONS = ["city", "point"];

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await req.json().catch(() => ({}));
    const x = Number(body?.x);
    const y = Number(body?.y);
    const label = typeof body?.label === "string" ? body.label.trim() : "";
    const icon = ICONS.includes(body?.icon) ? body.icon : "city";
    const tooltip =
      typeof body?.tooltip === "string" && body.tooltip.trim()
        ? body.tooltip.trim()
        : null;

    if (!Number.isFinite(x) || !Number.isFinite(y)) {
      return jsonError("Coordenadas inválidas");
    }
    if (!label) return jsonError("El marcador necesita un nombre");

    const supabase = getSupabaseAdmin();
    const { data: map, error: mapError } = await supabase
      .from("maps")
      .select("id")
      .eq("id", id)
      .maybeSingle();
    if (mapError) throw mapError;
    if (!map) return jsonError("Mapa no encontrado", 404);

    const { data, error } = await supabase
      .from("markers")
      .insert({ map_id: id, x, y, label, icon, tooltip })
      .select()
      .single();
    if (error) throw error;

    return NextResponse.json({ marker: data }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error inesperado";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
