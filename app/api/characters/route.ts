import { NextResponse } from "next/server";
import { CHARACTERS_BUCKET, getSupabaseAdmin, publicUrl } from "@/lib/supabase-admin";
import type { CharacterDTO } from "@/lib/types";

export const runtime = "nodejs";

export async function GET() {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("characters")
      .select("*");

    if (error) throw error;

    const characters: CharacterDTO[] = (data ?? [])
      .map((row) => ({
        ...row,
        image_url: publicUrl(CHARACTERS_BUCKET, row.image_path),
      }))
      .sort((a, b) => a.name.localeCompare(b.name, "es"));

    return NextResponse.json({ characters });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error inesperado";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
