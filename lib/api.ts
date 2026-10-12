import { NextResponse } from "next/server";

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

const EXT_BY_MIME: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/gif": "gif",
  "image/webp": "webp",
  "image/svg+xml": "svg",
  "image/avif": "avif",
  "image/bmp": "bmp",
};

export function extensionFor(file: File): string | null {
  if (file.type && EXT_BY_MIME[file.type]) return EXT_BY_MIME[file.type];
  const fromName = file.name.split(".").pop()?.toLowerCase();
  if (fromName && Object.values(EXT_BY_MIME).includes(fromName)) return fromName;
  return null;
}

export function isImage(file: File): boolean {
  if (file.type.startsWith("image/")) return true;
  return extensionFor(file) !== null;
}

/** Nombre de fichero único y seguro para el Storage. */
export function storageFileName(originalName: string): string {
  const base = originalName
    .replace(/\.[^/.]+$/, "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "archivo";
  const unique = crypto.randomUUID().slice(0, 8);
  return `${Date.now()}-${unique}-${base}`;
}
