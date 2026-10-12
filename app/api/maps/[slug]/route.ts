import { NextResponse } from "next/server";
import { MAPS_BUCKET, getSupabaseAdmin, publicUrl } from "@/lib/supabase-admin";
import type { MapDetailDTO } from "@/lib/types";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  try {
    const supabase = getSupabaseAdmin();
    const { data: map, error: mapError } = await supabase
      .from("maps")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();

    if (mapError) throw mapError;
    if (!map) {
      return NextResponse.json({ error: "Mapa no encontrado" }, { status: 404 });
    }

    const [{ data: markers, error: markersError }, { data: lines, error: linesError }] =
      await Promise.all([
        supabase.from("markers").select("*").eq("map_id", map.id),
        supabase.from("lines").select("*").eq("map_id", map.id),
      ]);

    if (markersError) throw markersError;
    if (linesError) throw linesError;

    const detail: MapDetailDTO = {
      ...map,
      image_url: publicUrl(MAPS_BUCKET, map.image_path),
      markers: markers ?? [],
      lines: lines ?? [],
    };

    return NextResponse.json({ map: detail });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error inesperado";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
