import { NextResponse } from "next/server";
import { CHARACTERS_BUCKET, getSupabaseAdmin, publicUrl } from "@/lib/supabase-admin";
import { extensionFor, isImage, jsonError, storageFileName } from "@/lib/api";
import type { CharacterDTO } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const name = String(form.get("name") ?? "").trim();
    const file = form.get("file");

    if (!name) return jsonError("Falta el nombre del personaje");
    if (!(file instanceof File) || file.size === 0) {
      return jsonError("Falta la imagen del personaje");
    }
    if (!isImage(file)) return jsonError("El archivo no es una imagen válida");

    const ext = extensionFor(file) ?? "png";
    const path = `${storageFileName(file.name)}.${ext}`;
    const bytes = new Uint8Array(await file.arrayBuffer());

    const supabase = getSupabaseAdmin();
    const { error: uploadError } = await supabase.storage
      .from(CHARACTERS_BUCKET)
      .upload(path, bytes, {
        contentType: file.type || "image/png",
        upsert: false,
      });
    if (uploadError) throw uploadError;

    const { data, error } = await supabase
      .from("characters")
      .insert({ name, image_path: path })
      .select()
      .single();
    if (error) throw error;

    const character: CharacterDTO = {
      ...data,
      image_url: publicUrl(CHARACTERS_BUCKET, path),
    };
    return NextResponse.json({ character }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error inesperado";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
