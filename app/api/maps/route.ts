import { NextResponse } from "next/server";
import { MAPS_BUCKET, getSupabaseAdmin, publicUrl } from "@/lib/supabase-admin";
import type { MapDTO } from "@/lib/types";

export const runtime = "nodejs";

export async function GET() {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("maps")
      .select("*")
      .order("name", { ascending: true });

    if (error) throw error;

    const maps: MapDTO[] = (data ?? []).map((row) => ({
      ...row,
      image_url: publicUrl(MAPS_BUCKET, row.image_path),
    }));

    return NextResponse.json({ maps });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error inesperado";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
