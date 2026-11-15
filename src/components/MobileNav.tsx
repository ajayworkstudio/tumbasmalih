"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, type IconName } from "./Icon";

const items: { href: string; label: string; icon: IconName; match: (p: string) => boolean }[] = [
  { href: "/", label: "Beranda", icon: "home", match: (p) => p === "/" },
  { href: "/kategori/ebook", label: "Ebook", icon: "book", match: (p) => p.startsWith("/kategori") },
  { href: "/cari", label: "Cari", icon: "search", match: (p) => p.startsWith("/cari") },
  { href: "/keranjang", label: "Keranjang", icon: "cart", match: (p) => p === "/keranjang" || p === "/checkout" },
];

export function MobileNav() {
  return <MobileNavView pathname={usePathname()} />;
}

/** Versi tanpa hook, dipakai juga sebagai fallback Suspense saat prerender. */
export function MobileNavView({ pathname }: { pathname: string }) {
  return (
    <nav
      aria-label="Navigasi utama"
      className="fixed inset-x-0 bottom-0 z-30 grid h-19.5 grid-cols-4 items-stretch border-t border-line bg-white pb-1.5 md:hidden"
    >
      {items.map((it) => {
        const active = it.match(pathname);
        return (
          <Link
            key={it.href}
            href={it.href}
            aria-current={active ? "page" : undefined}
            className={`flex h-full flex-col items-center justify-center gap-1 text-[11px] ${active ? "font-bold text-brand" : "font-semibold text-muted"}`}
          >
            <Icon name={it.icon} size={22} strokeWidth={active ? 2.2 : 1.8} />
            {it.label}
          </Link>
        );
      })}
    </nav>
  );
}
