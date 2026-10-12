/**
 * Comprueba que la configuración de Supabase es correcta antes de desplegar.
 *
 *   npm run verify
 *
 * Verifica: variables de entorno, acceso a las tablas y existencia de los
 * buckets de Storage.
 */
import { config } from "dotenv";
import {
  CHARACTERS_BUCKET,
  MAPS_BUCKET,
  getSupabaseAdmin,
} from "../lib/supabase-admin";

config({ path: ".env.local" });
config();

const REQUIRED = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "ADMIN_PASSWORD",
  "AUTH_SECRET",
];

async function main() {
  let failed = false;

  console.log("· Variables de entorno");
  for (const name of REQUIRED) {
    const present = Boolean(process.env[name]);
    console.log(`  ${present ? "✓" : "✗"} ${name}`);
    if (!present) failed = true;
  }

  if (failed) {
    console.error(
      "\nFaltan variables. Copia .env.example a .env.local y rellénalas."
    );
    process.exit(1);
  }

  const supabase = getSupabaseAdmin();

  console.log("\n· Tablas");
  for (const table of ["characters", "maps", "markers", "lines"]) {
    const { count, error } = await supabase
      .from(table)
      .select("*", { count: "exact", head: true });
    if (error) {
      console.log(`  ✗ ${table}: ${error.message}`);
      failed = true;
    } else {
      console.log(`  ✓ ${table}: ${count ?? 0} filas`);
    }
  }

  console.log("\n· Buckets de Storage");
  const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
  if (bucketError) {
    console.log(`  ✗ no se pudieron listar los buckets: ${bucketError.message}`);
    failed = true;
  } else {
    const names = new Set((buckets ?? []).map((b) => b.name));
    for (const bucket of [CHARACTERS_BUCKET, MAPS_BUCKET]) {
      const ok = names.has(bucket);
      console.log(`  ${ok ? "✓" : "✗"} ${bucket}`);
      if (!ok) failed = true;
    }
  }

  if (failed) {
    console.error("\nResultado: hay problemas por resolver.");
    process.exit(1);
  }
  console.log("\nResultado: todo correcto. Listo para `npm run seed`.");
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
