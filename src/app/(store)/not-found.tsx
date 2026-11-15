import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Halaman tidak ditemukan", robots: { index: false } };

export default function NotFound() {
  return (
    <div className="mx-auto flex w-full max-w-140 flex-col items-start gap-4 py-10">
      <h1 className="text-2xl font-extrabold md:text-3xl">Halaman ini tidak ada</h1>
      <p className="text-sm leading-relaxed text-muted">
        Mungkin produknya sudah tidak dijual, atau alamatnya salah ketik. Kalau kamu membuka link pesanan, pastikan kode
        pesanannya lengkap (TM diikuti 8 huruf dan angka).
      </p>
      <div className="flex flex-wrap gap-3">
        <Link href="/" className="flex h-11 items-center rounded-xl bg-brand px-5 text-sm font-bold text-white hover:bg-brand-dark">
          Ke beranda
        </Link>
        <Link href="/cari" className="flex h-11 items-center rounded-xl border border-field px-5 text-sm font-bold hover:border-brand hover:bg-brand-soft">
          Cari produk
        </Link>
      </div>
    </div>
  );
}
