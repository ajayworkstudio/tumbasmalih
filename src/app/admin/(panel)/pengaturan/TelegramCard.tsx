"use client";
import { useActionState } from "react";
import { connectTelegram, type TelegramState } from "../../actions";

export function TelegramCard({ ready, webhookUrl, lastError }: { ready: boolean; webhookUrl: string; lastError: string }) {
  const [state, action, pending] = useActionState<TelegramState>(async () => connectTelegram(), {});
  return (
    <section aria-labelledby="tg-title" className="flex flex-col gap-3 rounded-2xl border border-line bg-white p-5">
      <div className="flex flex-col gap-1">
        <h2 id="tg-title" className="font-bold">Bot Telegram (Akbar, Venya, Bulan)</h2>
        <p className="text-sm text-muted">
          Perintah: <code>/akbar</code>, <code>/venya</code>, <code>/bulan</code>, <code>/bantuan</code>. Langkah lengkap ada di README bagian Bot Telegram.
        </p>
      </div>
      <dl className="grid gap-1 text-sm sm:grid-cols-[160px_1fr]">
        <dt className="text-muted">Env bot</dt>
        <dd className={ready ? "font-semibold text-ok" : "font-semibold text-danger"}>{ready ? "Lengkap" : "Belum lengkap"}</dd>
        <dt className="text-muted">Webhook terdaftar</dt>
        <dd className="break-all">{webhookUrl || "Belum ada"}</dd>
        {lastError && (
          <>
            <dt className="text-muted">Error terakhir dari Telegram</dt>
            <dd className="text-danger">{lastError}</dd>
          </>
        )}
      </dl>
      <form action={action} className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={pending || !ready} className="h-11 rounded-xl bg-brand px-5 text-sm font-bold text-white hover:bg-brand-dark disabled:opacity-50">
          {pending ? "Menghubungkan…" : webhookUrl ? "Hubungkan ulang bot" : "Hubungkan bot"}
        </button>
        <span role="status" className={`text-sm ${state.error ? "font-medium text-danger" : "font-semibold text-ok"}`}>
          {state.error ?? state.ok ?? ""}
        </span>
      </form>
    </section>
  );
}
