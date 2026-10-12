import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export const CHARACTERS_BUCKET =
  process.env.SUPABASE_CHARACTERS_BUCKET || "characters";
export const MAPS_BUCKET = process.env.SUPABASE_MAPS_BUCKET || "maps";

export function getSupabaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) throw new Error("Falta NEXT_PUBLIC_SUPABASE_URL");
  return url.replace(/\/$/, "");
}

/**
 * Cliente con service role. SOLO debe usarse en el servidor (route handlers,
 * scripts de seed). Nunca exponer la service role key al navegador.
 */
export function getSupabaseAdmin(): SupabaseClient {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("Falta SUPABASE_SERVICE_ROLE_KEY");
  return createClient(getSupabaseUrl(), key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** URL pública de un objeto del Storage (los buckets son de lectura pública). */
export function publicUrl(bucket: string, path: string): string {
  const clean = path.replace(/^\/+/, "");
  return `${getSupabaseUrl()}/storage/v1/object/public/${bucket}/${clean}`;
}
