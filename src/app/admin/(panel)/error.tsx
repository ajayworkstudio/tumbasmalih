"use client";
import { useEffect } from "react";

export default function AdminError({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  const message = error instanceof Error ? error.message : "Terjadi kesalahan.";

  return (
    <div role="alert" className="flex max-w-140 flex-col items-start gap-3 rounded-2xl border border-danger bg-[#FDECEC] p-5">
      <h1 className="text-lg font-extrabold text-danger">Halaman admin gagal dimuat</h1>
      <p className="text-sm text-ink">{message}</p>
      <p className="text-sm text-ink">Cek isi env Supabase (URL dan service role key), lalu coba lagi.</p>
      <button
        type="button"
        onClick={() => retry()}
        className="h-11 rounded-xl bg-brand px-5 text-sm font-bold text-white hover:bg-brand-dark"
      >
        Coba lagi
      </button>
    </div>
  );
}
