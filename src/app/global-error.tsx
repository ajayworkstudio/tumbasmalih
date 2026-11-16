"use client";

/** Cadangan terakhir kalau error terjadi di luar semua error.tsx (misalnya di layout utama). */
export default function GlobalError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <html lang="id">
      <body style={{ margin: 0, fontFamily: "system-ui, sans-serif", background: "#F4F7FD", color: "#111827" }}>
        <main style={{ maxWidth: 520, margin: "0 auto", padding: "64px 20px", display: "flex", flexDirection: "column", gap: 16 }}>
          <h1 style={{ margin: 0, fontSize: 26 }}>tumbasmalih sedang bermasalah</h1>
          <p style={{ margin: 0, lineHeight: 1.6, color: "#5B6474" }}>
            Halaman gagal dimuat karena kesalahan di server. Keranjang kamu tetap tersimpan di perangkat ini. Coba muat ulang
            beberapa saat lagi.
          </p>
          {error.digest && (
            <p style={{ margin: 0, fontSize: 13, color: "#5B6474" }}>
              Kode error untuk admin: <code>{error.digest}</code>
            </p>
          )}
          <button
            type="button"
            onClick={() => retry()}
            style={{ alignSelf: "flex-start", height: 44, padding: "0 20px", border: 0, borderRadius: 12, background: "#1F4FE0", color: "#fff", fontWeight: 700, fontSize: 15, cursor: "pointer" }}
          >
            Muat ulang
          </button>
        </main>
      </body>
    </html>
  );
}
