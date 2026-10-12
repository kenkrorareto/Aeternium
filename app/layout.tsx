import type { Metadata } from "next";
import { Cinzel, EB_Garamond, MedievalSharp } from "next/font/google";
import SiteNav from "@/components/SiteNav";
import "./globals.css";

const cinzel = Cinzel({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-cinzel",
  display: "swap",
});

const ebGaramond = EB_Garamond({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-eb-garamond",
  display: "swap",
});

const medieval = MedievalSharp({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-medieval",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Aeternium",
  description: "Atlas y galería del mundo de Aeternium",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="es"
      className={`${cinzel.variable} ${ebGaramond.variable} ${medieval.variable}`}
    >
      <body>
        <SiteNav />
        {children}
      </body>
    </html>
  );
}
