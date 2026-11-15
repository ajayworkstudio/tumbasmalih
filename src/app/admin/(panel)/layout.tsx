import Link from "next/link";
import { signOut } from "../actions";

export const metadata = { robots: { index: false, follow: false } };

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="border-b border-line bg-white">
        <div className="mx-auto flex max-w-310 flex-wrap items-center gap-x-6 gap-y-2 px-5 py-3.5">
          <Link href="/admin" className="text-lg font-extrabold">
            tumbas<span className="text-brand">malih</span> <span className="text-sm font-semibold text-muted">admin</span>
          </Link>
          <nav className="flex gap-5 text-sm font-semibold text-[#374151]">
            <Link href="/admin" className="hover:text-brand">Pesanan</Link>
            <Link href="/admin/produk" className="hover:text-brand">Produk</Link>
            <Link href="/" target="_blank" className="hover:text-brand">Lihat toko ↗</Link>
          </nav>
          <form action={signOut} className="ml-auto">
            <button type="submit" className="h-9 rounded-lg px-3 text-sm font-semibold text-muted hover:bg-ground hover:text-ink">
              Keluar
            </button>
          </form>
        </div>
      </header>
      <main className="mx-auto w-full max-w-310 flex-1 px-5 py-6">{children}</main>
    </>
  );
}
