/**
 * Migra el contenido de los sitios estáticos a Supabase.
 *
 * Uso:
 *   cp .env.example .env.local   # rellena URL + service role key
 *   npm run seed
 *
 * Es idempotente: los personajes se omiten si ya existe uno con el mismo
 * nombre, los mapas si ya existe el slug, y los marcadores si el mapa ya tiene.
 */
import { config } from "dotenv";
import { readFileSync, readdirSync } from "node:fs";
import { basename, join } from "node:path";
import { imageSize } from "image-size";
import {
  CHARACTERS_BUCKET,
  MAPS_BUCKET,
  getSupabaseAdmin,
  publicUrl,
} from "../lib/supabase-admin";

config({ path: ".env.local" });
config();

const GALLERY_IMAGES = join(process.cwd(), "..", "Aeternium_Gallery", "images");
const MAP_IMAGES = join(process.cwd(), "..", "Aeternium_Map", "images");
const MAP_DATA = join(process.cwd(), "..", "Aeternium_Map");

const IMAGE_EXT = [".png", ".jpg", ".jpeg", ".gif", ".webp", ".avif", ".bmp"];

function isImage(file: string): boolean {
  return IMAGE_EXT.some((ext) => file.toLowerCase().endsWith(ext));
}

/** Clave de Storage válida (sin acentos ni caracteres especiales). */
function safeKey(file: string): string {
  return (
    file
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9._-]+/g, "-")
      .replace(/^-+|-+$/g, "") || "archivo"
  );
}

const MIME: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  webp: "image/webp",
  svg: "image/svg+xml",
  avif: "image/avif",
  bmp: "image/bmp",
};

function mimeFor(file: string): string {
  const ext = file.split(".").pop()?.toLowerCase() ?? "";
  return MIME[ext] ?? "application/octet-stream";
}

/** Replica el nombre legible de la galería original (camelCase → espacios). */
function characterName(fileName: string): string {
  const withoutExt = fileName.replace(/\.[^/.]+$/, "");
  return withoutExt.replace(/([a-z])([A-Z])/g, "$1 $2");
}

interface SeedMap {
  slug: string;
  name: string;
  image: string;
  data?: string;
  // Espacio de coordenadas original de los datos (bounds del JS previo).
  // Si se indica, los marcadores se escalan al tamaño real de la imagen.
  sourceWidth?: number;
  sourceHeight?: number;
}

const SEED_MAPS: SeedMap[] = [
  {
    slug: "aeternium",
    name: "Aeternium",
    image: "Aeternium.jpg",
    data: "Aeternium.json",
    sourceWidth: 6000,
    sourceHeight: 4500,
  },
  {
    slug: "caenanis",
    name: "Caenanis",
    image: "Caenanis.jpg",
    data: "Caenanis.json",
    sourceWidth: 6000,
    sourceHeight: 4500,
  },
];

async function seedCharacters() {
  const supabase = getSupabaseAdmin();
  const { data: existing, error } = await supabase
    .from("characters")
    .select("name");
  if (error) throw error;
  const known = new Set((existing ?? []).map((c) => c.name));

  const files = readdirSync(GALLERY_IMAGES).filter(isImage).sort();
  let added = 0;

  for (const file of files) {
    const name = characterName(basename(file));
    if (known.has(name)) {
      console.log(`· personaje ya existe: ${name}`);
      continue;
    }
    const bytes = new Uint8Array(readFileSync(join(GALLERY_IMAGES, file)));
    const path = `${Date.now()}-${safeKey(file)}`;
    const { error: uploadError } = await supabase.storage
      .from(CHARACTERS_BUCKET)
      .upload(path, bytes, { upsert: false, contentType: mimeFor(file) });
    if (uploadError) throw uploadError;

    const { error: insertError } = await supabase
      .from("characters")
      .insert({ name, image_path: path });
    if (insertError) throw insertError;
    added++;
    console.log(`+ personaje: ${name}`);
  }
  console.log(`Personajes añadidos: ${added}`);
}

async function seedMaps() {
  const supabase = getSupabaseAdmin();
  for (const seed of SEED_MAPS) {
    const { data: existing } = await supabase
      .from("maps")
      .select("id")
      .eq("slug", seed.slug)
      .maybeSingle();
    if (existing) {
      console.log(`· mapa ya existe: ${seed.slug}`);
      continue;
    }

    const imagePath = join(MAP_IMAGES, seed.image);
    const bytes = new Uint8Array(readFileSync(imagePath));
    const size = imageSize(bytes);
    if (!size.width || !size.height) {
      console.warn(`! sin dimensiones para ${seed.image}, se omite`);
      continue;
    }

    const storagePath = `${Date.now()}-${safeKey(seed.image)}`;
    const { error: uploadError } = await supabase.storage
      .from(MAPS_BUCKET)
      .upload(storagePath, bytes, { upsert: false, contentType: mimeFor(seed.image) });
    if (uploadError) throw uploadError;

    const { data: mapRow, error: insertError } = await supabase
      .from("maps")
      .insert({
        slug: seed.slug,
        name: seed.name,
        image_path: storagePath,
        width: size.width,
        height: size.height,
      })
      .select()
      .single();
    if (insertError) throw insertError;
    console.log(
      `+ mapa: ${seed.name} (${size.width}×${size.height}) → ${publicUrl(
        MAPS_BUCKET,
        storagePath
      )}`
    );

    if (!seed.data) continue;
    const dataPath = join(MAP_DATA, seed.data);
    let points: Array<{ loc: [number, number]; link?: string }> = [];
    try {
      const parsed = JSON.parse(readFileSync(dataPath, "utf8"));
      points = Array.isArray(parsed.points) ? parsed.points : [];
    } catch {
      console.log(`· sin marcadores para ${seed.slug}`);
      continue;
    }

    const scaleX = seed.sourceWidth ? size.width! / seed.sourceWidth : 1;
    const scaleY = seed.sourceHeight ? size.height! / seed.sourceHeight : 1;

    for (const point of points) {
      const { error: markerError } = await supabase.from("markers").insert({
        map_id: mapRow.id,
        x: Number((point.loc[1] * scaleX).toFixed(2)),
        y: Number((point.loc[0] * scaleY).toFixed(2)),
        label: point.link ?? "",
        icon: "city",
        tooltip: null,
      });
      if (markerError) throw markerError;
      console.log(
        `  + marcador: ${point.link ?? "(sin nombre)"} (${(point.loc[1] * scaleX).toFixed(0)}, ${(point.loc[0] * scaleY).toFixed(0)})`
      );
    }
  }
}

async function main() {
  console.log("Sembrando Supabase…");
  await seedCharacters();
  await seedMaps();
  console.log("Listo.");
}

main().catch((err) => {
  console.error("Error en el seed:", err);
  process.exit(1);
});
