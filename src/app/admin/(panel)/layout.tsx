import Link from "next/link";
import { Suspense } from "react";
import { signOut } from "../actions";
import { AdminNav, AdminNavView } from "./AdminNav";

export const metadata = { robots: { index: false, follow: false } };

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="border-b border-line bg-white">
        <div className="mx-auto flex max-w-310 flex-col gap-1 px-5 pt-3 md:flex-row md:items-center md:gap-6 md:pt-0">
          <div className="flex items-center justify-between md:contents">
            <Link href="/admin" className="inline-flex min-h-11 items-center text-lg font-extrabold">
              tumbas<span className="marker">malih</span>&nbsp;<span className="text-sm font-semibold text-muted">admin</span>
            </Link>
            <div className="flex items-center gap-1 md:order-last md:ml-auto">
              <Link href="/" target="_blank" className="flex min-h-11 items-center px-2 text-sm font-semibold text-[#374151] hover:text-brand">
                Lihat toko ↗
              </Link>
              <form action={signOut}>
                <button type="submit" className="h-11 rounded-lg px-3 text-sm font-semibold text-muted hover:bg-ground hover:text-ink">
                  Keluar
                </button>
              </form>
            </div>
          </div>
          <Suspense fallback={<AdminNavView pathname="" />}>
            <AdminNav />
          </Suspense>
        </div>
      </header>
      <main className="mx-auto w-full max-w-310 flex-1 px-5 py-6">{children}</main>
    </>
  );
}
