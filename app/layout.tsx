import type { Metadata, Viewport } from "next";
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

const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).host
  : null;

export const viewport: Viewport = {
  themeColor: "#2c0136",
  colorScheme: "dark",
};

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "https://aeternium-nine.vercel.app"
  ),
  title: {
    default: "Aeternium",
    template: "%s · Aeternium",
  },
  description: "Atlas y galería del mundo de Aeternium",
  applicationName: "Aeternium",
  icons: {
    icon: "/icon.svg",
    apple: "/apple-icon.png",
  },
  openGraph: {
    type: "website",
    locale: "es_ES",
    siteName: "Aeternium",
    title: "Aeternium",
    description: "Atlas y galería del mundo de Aeternium",
  },
  twitter: {
    card: "summary_large_image",
    title: "Aeternium",
    description: "Atlas y galería del mundo de Aeternium",
  },
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
      <head>
        {supabaseHost && <link rel="preconnect" href={`https://${supabaseHost}`} />}
      </head>
      <body>
        <a className="skip-link" href="#contenido">
          Saltar al contenido
        </a>
        <SiteNav />
        <main id="contenido">{children}</main>
        <footer className="site-footer">
          <p>
            Aeternium · Atlas y Galería· © {new Date().getFullYear()}
          </p>
        </footer>
      </body>
    </html>
  );
}