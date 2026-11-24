"use client";
import { startTransition, useActionState } from "react";
import type { Settings } from "@/lib/settings";
import { saveSettings, type FormState } from "../../actions";
import { Uploader } from "../Uploader";

const field = "h-11 w-full rounded-lg border border-field bg-white px-3 text-sm";
const area = "w-full rounded-lg border border-field bg-white px-3 py-2.5 text-sm";
const label = "flex flex-col gap-1.5 text-sm font-semibold";
const hint = "text-xs font-normal text-muted";

export function SettingsForm({ settings }: { settings: Settings }) {
  const [state, action, pending] = useActionState<FormState, FormData>(saveSettings, {});
  const banks = [0, 1, 2].map((i) => settings.bankAccounts[i] ?? { bank: "", number: "", holder: "" });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        startTransition(() => action(data));
      }}
      className="flex flex-col gap-5"
    >
      <section aria-labelledby="kontak-title" className="flex flex-col gap-4 rounded-2xl border border-line bg-white p-5">
        <h2 id="kontak-title" className="font-bold">Kontak</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className={label}>
            Nomor WhatsApp admin
            <input name="whatsapp" type="tel" inputMode="tel" defaultValue={settings.whatsapp} placeholder="081234567890" className={field} />
            <span className={hint}>Dipakai di tombol WhatsApp toko dan halaman pesanan.</span>
          </label>
          <p className={hint}>
            Ongkir barang fisik diisi per pesanan, sesuai harga di pemasok: buka pesanan berstatus Menunggu ongkir, atau ketik
            /akbar ongkir KODE ANGKA di Telegram.
          </p>
        </div>
      </section>

      <section aria-labelledby="bayar-title" className="flex flex-col gap-4 rounded-2xl border border-line bg-white p-5">
        <h2 id="bayar-title" className="font-bold">Pembayaran</h2>
        <Uploader
          bucket="produk"
          name="qris_image_url"
          label="Gambar QRIS"
          hint="Tampil di halaman pesanan yang memilih QRIS. Kosongkan kalau QRIS dikirim lewat WhatsApp."
          defaultValue={settings.qrisImageUrl}
        />
        <fieldset className="flex flex-col gap-3">
          <legend className="mb-1 text-sm font-semibold">Rekening transfer (maksimal 3, kosongkan baris yang tidak dipakai)</legend>
          {banks.map((b, i) => (
            <div key={i} className="grid gap-2 sm:grid-cols-[1fr_1.4fr_1.6fr]">
              <label className="flex flex-col gap-1 text-xs font-semibold">
                Bank {i + 1}
                <input name={`bank_${i}`} defaultValue={b.bank} placeholder="BCA" className={field} />
              </label>
              <label className="flex flex-col gap-1 text-xs font-semibold">
                Nomor rekening
                <input name={`number_${i}`} inputMode="numeric" defaultValue={b.number} className={field} />
              </label>
              <label className="flex flex-col gap-1 text-xs font-semibold">
                Atas nama
                <input name={`holder_${i}`} defaultValue={b.holder} className={field} />
              </label>
            </div>
          ))}
        </fieldset>
      </section>

      <section aria-labelledby="kebijakan-title" className="flex flex-col gap-4 rounded-2xl border border-line bg-white p-5">
        <div className="flex flex-col gap-1">
          <h2 id="kebijakan-title" className="font-bold">Kebijakan toko</h2>
          <p className="text-sm text-muted">Tulis kebijakan yang benar-benar kamu jalankan. Selama kosong, pembeli melihat placeholder [ISI ...].</p>
        </div>
        <label className={label}>
          Estimasi pengiriman
          <input name="policy_shipping" defaultValue={settings.policyShipping} placeholder="Contoh: dikirim 1 hari kerja setelah pembayaran dikonfirmasi" className={field} />
        </label>
        <label className={label}>
          Retur barang fisik
          <textarea name="policy_returns" rows={3} defaultValue={settings.policyReturns} className={area} />
        </label>
        <label className={label}>
          Pengembalian ebook
          <textarea name="policy_ebook" rows={2} defaultValue={settings.policyEbook} className={area} />
        </label>
      </section>

      <div className="flex flex-wrap items-center gap-4">
        <button type="submit" disabled={pending} className="h-12 rounded-xl bg-brand px-6 font-bold text-white hover:bg-brand-dark disabled:opacity-60">
          {pending ? "Menyimpan…" : "Simpan pengaturan"}
        </button>
        <span role="status" className={`text-sm ${state.error ? "font-medium text-danger" : "font-semibold text-ok"}`}>
          {state.error ?? (state.ok ? "Pengaturan disimpan dan langsung dipakai di toko." : "")}
        </span>
      </div>
    </form>
  );
}
