import { NextResponse } from "next/server";
import { imageSize } from "image-size";
import { MAPS_BUCKET, getSupabaseAdmin, publicUrl } from "@/lib/supabase-admin";
import { extensionFor, isImage, jsonError, slugify, storageFileName } from "@/lib/api";
import type { MapDTO } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const name = String(form.get("name") ?? "").trim();
    const file = form.get("file");

    if (!name) return jsonError("Falta el nombre del mapa");
    if (!(file instanceof File) || file.size === 0) {
      return jsonError("Falta la imagen del mapa");
    }
    if (!isImage(file)) return jsonError("El archivo no es una imagen válida");

    const bytes = new Uint8Array(await file.arrayBuffer());

    let width: number | undefined;
    let height: number | undefined;
    try {
      const size = imageSize(bytes);
      width = size.width;
      height = size.height;
    } catch {
      return jsonError("No se pudieron leer las dimensiones de la imagen");
    }
    if (!width || !height) {
      return jsonError(
        "La imagen no expone dimensiones (prueba con PNG o JPG en lugar de SVG)"
      );
    }

    const desiredSlug = String(form.get("slug") ?? "").trim();
    const slug = slugify(desiredSlug || name) || `mapa-${Date.now()}`;

    const ext = extensionFor(file) ?? "png";
    const path = `${storageFileName(file.name)}.${ext}`;

    const supabase = getSupabaseAdmin();

    const { data: existing, error: slugError } = await supabase
      .from("maps")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();
    if (slugError) throw slugError;
    if (existing) return jsonError("Ya existe un mapa con ese slug", 409);

    const { error: uploadError } = await supabase.storage
      .from(MAPS_BUCKET)
      .upload(path, bytes, {
        contentType: file.type || "image/png",
        upsert: false,
      });
    if (uploadError) throw uploadError;

    const { data, error } = await supabase
      .from("maps")
      .insert({ name, slug, image_path: path, width, height })
      .select()
      .single();
    if (error) throw error;

    const map: MapDTO = { ...data, image_url: publicUrl(MAPS_BUCKET, path) };
    return NextResponse.json({ map }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error inesperado";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
