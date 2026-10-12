import MapView from "@/components/MapView";
import { isAdmin } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function MapaPage() {
  const admin = await isAdmin();
  return <MapView isAdmin={admin} />;
}
