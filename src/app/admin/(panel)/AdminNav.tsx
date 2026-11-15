"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/admin", label: "Ringkasan", match: (p: string) => p === "/admin" },
  { href: "/admin/pesanan", label: "Pesanan", match: (p: string) => p.startsWith("/admin/pesanan") },
  { href: "/admin/produk", label: "Produk", match: (p: string) => p.startsWith("/admin/produk") },
  { href: "/admin/kategori", label: "Kategori", match: (p: string) => p.startsWith("/admin/kategori") },
  { href: "/admin/pengaturan", label: "Pengaturan", match: (p: string) => p.startsWith("/admin/pengaturan") },
];

export function AdminNav() {
  return <AdminNavView pathname={usePathname()} />;
}

export function AdminNavView({ pathname }: { pathname: string }) {
  return (
    <nav aria-label="Menu admin" className="no-scrollbar -mx-5 flex overflow-x-auto px-5 text-sm font-semibold md:mx-0 md:px-0">
      {items.map((it) => {
        const on = it.match(pathname);
        return (
          <Link
            key={it.href}
            href={it.href}
            aria-current={on ? "page" : undefined}
            className={`flex min-h-11 shrink-0 items-center border-b-2 px-3 ${on ? "border-brand text-brand" : "border-transparent text-[#374151] hover:text-brand"}`}
          >
            {it.label}
          </Link>
        );
      })}
    </nav>
  );
}
