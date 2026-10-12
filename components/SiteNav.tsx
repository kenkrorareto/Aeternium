"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/mapa", label: "Mapa" },
  { href: "/galeria", label: "Galería" },
];

export default function SiteNav() {
  const pathname = usePathname();

  return (
    <nav className="site-nav">
      <Link href="/mapa" className="site-nav__brand">
        Aeternium
      </Link>

      <div className="site-nav__tabs">
        {LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={
              pathname?.startsWith(link.href)
                ? "site-nav__tab is-active"
                : "site-nav__tab"
            }
          >
            {link.label}
          </Link>
        ))}
        <Link
          href="/admin"
          className={
            pathname?.startsWith("/admin")
              ? "site-nav__tab is-active"
              : "site-nav__tab"
          }
        >
          Admin
        </Link>
      </div>
    </nav>
  );
}
