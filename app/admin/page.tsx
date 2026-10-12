import type { Metadata } from "next";
import AdminPanel from "@/components/AdminPanel";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Administración",
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return <AdminPanel />;
}
