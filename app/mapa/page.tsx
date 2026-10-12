import type { Metadata } from "next";
import MapView from "@/components/MapView";
import { isAdmin } from "@/lib/session";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Mapa",
  description: "Explora el atlas de los reinos de Aeternium.",
};

export default async function MapaPage() {
  const admin = await isAdmin();
  return <MapView isAdmin={admin} />;
}
