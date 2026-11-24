"use client";
import Link from "next/link";
import { startTransition, useActionState, useEffect, useState } from "react";
import { createOrder, type CheckoutState } from "@/app/actions/order";
import { Icon, type IconName } from "@/components/Icon";
import { ProductImage } from "@/components/ProductImage";
import { useCart } from "@/lib/cart";
import { formatRupiah } from "@/lib/format";
import { track } from "@/lib/pixel";
import type { PaymentMethod } from "@/lib/types";

const methods: { id: PaymentMethod; label: string; sub: string; icon: IconName }[] = [
  { id: "qris", label: "QRIS", sub: "Scan dari e-wallet atau m-banking", icon: "qris" },
  { id: "transfer", label: "Transfer Bank", sub: "Transfer manual ke rekening kami", icon: "bank" },
];

const inputCls =
  "h-12 w-full rounded-lg border border-field bg-white px-3.5 text-sm aria-[invalid=true]:border-2 aria-[invalid=true]:border-danger";

function Field({
  label,
  name,
  error,
  ...rest
}: { label: string; name: string; error?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="flex flex-col gap-1.5 text-sm font-semibold">
      {label}
      <input name={name} aria-invalid={error ? true : undefined} className={inputCls} {...rest} />
      {error && <span className="text-xs font-medium text-danger">{error}</span>}
    </label>
  );
}

export function CheckoutForm() {
  const { items, count, subtotal, hasPhysical } = useCart();
  const [method, setMethod] = useState<PaymentMethod>("qris");
  const [state, action, pending] = useActionState<CheckoutState, FormData>(createOrder, {});
  const fe = state.fieldErrors ?? {};
  const v = state.values ?? {};
  
  useEffect(() => {
    if (count > 0) track("InitiateCheckout", { value: subtotal, currency: "IDR", num_items: count });
    // Cukup sekali saat halaman dibuka.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-3xl border border-line bg-white px-6 py-16 text-center">
        <h1 className="text-xl font-extrabold">Keranjang kosong</h1>
        <Link href="/#pilihan" className="flex h-12 items-center rounded-xl bg-brand px-6 font-bold text-white hover:bg-brand-dark">
          Lihat produk pilihan
        </Link>
      </div>
    );
  }

  return (
    <form
      // Dikirim lewat onSubmit (bukan prop action) supaya React tidak mengosongkan form saat validasi gagal.
      onSubmit={(e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        startTransition(() => action(data));
      }}
      className="grid gap-5 lg:grid-cols-[1fr_380px]"
    >
      <input type="hidden" name="items" value={JSON.stringify(items.map((i) => ({ id: i.id, qty: i.qty })))} />

      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/keranjang"
            aria-label="Kembali ke keranjang"
            className="flex size-11.5 items-center justify-center rounded-full border border-field bg-white hover:border-brand hover:bg-brand-soft"
          >
            <Icon name="back" size={20} strokeWidth={2} />
          </Link>
          <h1 className="text-xl font-extrabold md:text-3xl">Checkout</h1>
        </div>

        {state.error && (
          <p role="alert" className="rounded-xl border border-danger bg-[#FDECEC] p-4 text-sm font-medium text-danger">
            {state.error}
          </p>
        )}

        <section className="flex flex-col gap-3.5 rounded-[18px] border border-line bg-white p-4 md:p-5">
          <h2 className="flex items-center gap-2 font-bold">
            <Icon name="user" size={18} className="text-brand" /> Data pembeli
          </h2>
          <Field label="Nama lengkap" name="name" defaultValue={v.name} autoComplete="name" required error={fe.name} />
          <div className="grid gap-3.5 sm:grid-cols-2">
            <Field label="Nomor WhatsApp" name="phone" defaultValue={v.phone} type="tel" inputMode="tel" autoComplete="tel" placeholder="08xxxxxxxxxx" required error={fe.phone} />
            <Field label="Email" name="email" defaultValue={v.email} type="email" autoComplete="email" required error={fe.email} />
          </div>
          {!hasPhysical && <p className="text-xs text-muted">Ebook akan bisa diunduh dari halaman pesanan setelah pembayaran dikonfirmasi.</p>}
        </section>

        {hasPhysical && (
          <section className="flex flex-col gap-3.5 rounded-[18px] border border-line bg-white p-4 md:p-5">
            <h2 className="flex items-center gap-2 font-bold">
              <Icon name="pin" size={18} className="text-brand" /> Alamat pengiriman
            </h2>
            <label className="flex flex-col gap-1.5 text-sm font-semibold">
              Alamat lengkap
              <textarea
                name="address"
                defaultValue={v.address}
                rows={3}
                required
                autoComplete="street-address"
                aria-invalid={fe.address ? true : undefined}
                placeholder="Nama jalan, nomor rumah, RT/RW, kelurahan, kecamatan"
                className="w-full rounded-lg border border-field px-3.5 py-3 text-sm aria-[invalid=true]:border-2 aria-[invalid=true]:border-danger"
              />
              {fe.address && <span className="text-xs font-medium text-danger">{fe.address}</span>}
            </label>
            <div className="grid gap-3.5 sm:grid-cols-[1fr_160px]">
              <Field label="Kota / Kabupaten" name="city" defaultValue={v.city} autoComplete="address-level2" required error={fe.city} />
              <Field label="Kode pos" name="postal_code" defaultValue={v.postal_code} inputMode="numeric" maxLength={5} autoComplete="postal-code" required error={fe.postal_code} />
            </div>
          </section>
        )}

        <section className="flex flex-col gap-2.5 rounded-[18px] border border-line bg-white p-4 md:p-5">
          <h2 className="font-bold">Metode pembayaran</h2>
          <fieldset className="flex flex-col gap-2.5">
            <legend className="sr-only">Pilih metode pembayaran</legend>
            {methods.map((m) => {
              const on = method === m.id;
              return (
                <label
                  key={m.id}
                  className={`flex min-h-15 items-center gap-3 rounded-xl border px-3 py-2.5 hover:border-brand ${
                    on ? "border-2 border-brand bg-[#F3F6FF]" : "border-field bg-white"
                  }`}
                >
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-brand">
                    <Icon name={m.icon} size={20} />
                  </span>
                  <span className="flex flex-1 flex-col gap-0.5">
                    <span className="text-sm font-bold">{m.label}</span>
                    <span className="text-xs text-muted">{m.sub}</span>
                  </span>
                  <input
                    type="radio"
                    name="payment_method"
                    value={m.id}
                    checked={on}
                    onChange={() => setMethod(m.id)}
                    className="size-5 shrink-0 accent-brand"
                  />
                </label>
              );
            })}
          </fieldset>
          {fe.payment && <span className="text-xs font-medium text-danger">{fe.payment}</span>}
          {hasPhysical && (
            <p className="flex items-start gap-2 rounded-xl bg-[#FFF8E1] px-3 py-2.5 text-xs leading-relaxed text-[#6B4E00]">
              <Icon name="info" size={16} className="mt-px shrink-0" />
              Ongkir kami hitung dulu sesuai alamatmu. Total yang harus dibayar muncul di halaman pesanan dan kami kabari lewat
              WhatsApp, biasanya dalam beberapa jam.
            </p>
          )}
        </section>

        <label className="flex flex-col gap-1.5 rounded-[18px] border border-line bg-white p-4 text-sm font-semibold md:p-5">
          Catatan (opsional)
          <input name="note" defaultValue={v.note} maxLength={500} className={inputCls} placeholder="Contoh: warna hitam, titip ke satpam" />
        </label>
      </div>

      <aside className="flex h-fit flex-col gap-3 rounded-[20px] border border-line bg-white p-4 md:p-5 lg:sticky lg:top-6 lg:mt-15">
        <h2 className="font-bold">Pesanan ({count})</h2>
        <ul className="flex flex-col gap-3">
          {items.map((it) => (
            <li key={it.id} className="flex items-center gap-3">
              <span className="size-14 shrink-0 overflow-hidden rounded-xl">
                <ProductImage src={it.image_url} alt="" type={it.type} iconSize={24} />
              </span>
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="line-clamp-2 text-[13px] leading-snug font-semibold">{it.name}</span>
                <span className="text-xs text-muted">x{it.qty}</span>
              </span>
              <span className="text-[13px] font-bold">{formatRupiah(it.price * it.qty)}</span>
            </li>
          ))}
        </ul>
        <div className="my-1 h-px bg-line" />
        <div className="flex justify-between text-sm text-muted">
          <span>Subtotal</span>
          <span className="font-semibold text-ink">{formatRupiah(subtotal)}</span>
        </div>
        {hasPhysical && (
          <div className="flex justify-between text-sm text-muted">
            <span>Ongkos kirim</span>
            <span className="font-semibold text-ink">Dihitung admin</span>
          </div>
        )}
        <div className="flex justify-between text-base font-extrabold">
          <span>{hasPhysical ? "Total (belum ongkir)" : "Total"}</span>
          <span>{formatRupiah(subtotal)}</span>
        </div>

        <button
          type="submit"
          disabled={pending}
          className="mt-1 h-13.5 w-full rounded-xl bg-brand text-[15px] font-bold text-white hover:bg-brand-dark active:bg-[#122f8a] disabled:opacity-60"
        >
          {pending ? "Membuat pesanan…" : "Buat pesanan"}
        </button>
        <p className="text-xs leading-relaxed text-muted">
          {hasPhysical
            ? "Belum perlu bayar sekarang. Tunggu total dengan ongkir dari kami, lalu bayar dari halaman pesanan."
            : "Instruksi pembayaran muncul di halaman berikutnya."}
        </p>
      </aside>
    </form>
  );
}
