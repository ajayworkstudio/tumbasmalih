"use client";
import { useEffect } from "react";

export default function AdminError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div role="alert" className="flex max-w-140 flex-col items-start gap-3 rounded-2xl border border-danger bg-[#FDECEC] p-5">
      <h1 className="text-lg font-extrabold text-danger">Halaman admin gagal dimuat</h1>
      <p className="text-sm text-ink">
        Penyebab paling sering: env <code>SUPABASE_SERVICE_ROLE_KEY</code> belum diisi di Vercel, atau project Supabase sedang
        di-pause. Setelah mengubah env, lakukan Redeploy.
      </p>
      {error.digest && (
        <p className="text-sm text-ink">
          Kode error: <code className="font-bold">{error.digest}</code>. Cari kode ini di Vercel › Logs untuk pesan lengkapnya.
        </p>
      )}
      <button type="button" onClick={() => retry()} className="h-11 rounded-xl bg-brand px-5 text-sm font-bold text-white hover:bg-brand-dark">
        Coba lagi
      </button>
    </div>
  );
}
