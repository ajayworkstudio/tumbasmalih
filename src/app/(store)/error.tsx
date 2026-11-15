"use client";
import Link from "next/link";
import { useEffect } from "react";
import { site, waLink } from "@/lib/site";

export default function StoreError({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div role="alert" className="mx-auto flex max-w-140 flex-col items-start gap-4 rounded-3xl border border-line bg-white p-6 md:p-8">
      <h1 className="text-xl font-extrabold md:text-2xl">Halaman ini gagal dimuat</h1>
      <p className="text-sm leading-relaxed text-muted">
        Data produk tidak bisa diambil sekarang, biasanya karena koneksi sedang bermasalah. Keranjang kamu tetap aman
        tersimpan di perangkat ini.
      </p>
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => retry()}
          className="h-11 rounded-xl bg-brand px-5 text-sm font-bold text-white hover:bg-brand-dark active:bg-[#122f8a]"
        >
          Coba muat ulang
        </button>
        <Link href="/keranjang" className="flex h-11 items-center rounded-xl border border-field px-5 text-sm font-bold hover:border-brand hover:bg-brand-soft">
          Buka keranjang
        </Link>
        <a
          href={waLink(`Halo ${site.name}, halaman tokonya tidak bisa dibuka.`)}
          target="_blank"
          rel="noopener"
          className="flex h-11 items-center px-1 text-sm font-bold text-brand hover:underline"
        >
          Kabari admin
        </a>
      </div>
    </div>
  );
}
