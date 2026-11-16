"use client";
import { useEffect } from "react";

export default function LoginError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <main className="flex flex-1 items-center justify-center px-5 py-16">
      <div role="alert" className="flex w-full max-w-90 flex-col gap-3 rounded-3xl border border-danger bg-[#FDECEC] p-6">
        <h1 className="text-lg font-extrabold text-danger">Halaman login gagal dimuat</h1>
        <p className="text-sm">Biasanya karena env Supabase di Vercel belum lengkap. Cek URL dan anon key, lalu redeploy.</p>
        {error.digest && <p className="text-xs text-muted">Kode error: {error.digest}</p>}
        <button type="button" onClick={() => retry()} className="h-11 rounded-xl bg-brand px-5 text-sm font-bold text-white hover:bg-brand-dark">
          Coba lagi
        </button>
      </div>
    </main>
  );
}
