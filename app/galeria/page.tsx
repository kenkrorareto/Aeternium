import type { Metadata } from "next";
import Gallery from "@/components/Gallery";

export const metadata: Metadata = {
  title: "Galería",
  description: "Galería de personajes del mundo de Aeternium.",
};

export default function GaleriaPage() {
  return <Gallery />;
}
