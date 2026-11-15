"use client";
import Link from "next/link";
import { Icon } from "@/components/Icon";
import { ProductImage } from "@/components/ProductImage";
import { cart, useCart } from "@/lib/cart";
import { formatRupiah } from "@/lib/format";

export function CartView() {
  const { items, count, subtotal } = useCart();

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-3xl border border-line bg-white px-6 py-16 text-center">
        <span className="flex size-16 items-center justify-center rounded-full bg-brand-soft text-brand">
          <Icon name="cart" size={30} />
        </span>
        <h1 className="text-xl font-extrabold">Keranjang masih kosong</h1>
        <p className="max-w-80 text-sm text-muted">Produk yang kamu tambahkan akan muncul di sini.</p>
        <Link href="/#pilihan" className="flex h-12 items-center rounded-xl bg-brand px-6 font-bold text-white hover:bg-brand-dark">
          Lihat produk pilihan
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <section className="flex flex-col gap-4">
        <h1 className="text-xl font-extrabold md:text-3xl">Keranjang ({count})</h1>
        <ul className="flex flex-col gap-3">
          {items.map((it) => (
            <li key={it.id} className="flex gap-3 rounded-[18px] border border-line bg-white p-3">
              <Link href={`/produk/${it.slug}`} className="size-20 shrink-0 overflow-hidden rounded-xl">
                <ProductImage src={it.image_url} alt={it.name} type={it.type} iconSize={30} />
              </Link>
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <Link href={`/produk/${it.slug}`} className="-my-3 line-clamp-2 py-3 text-sm font-semibold hover:text-brand hover:underline">
                  {it.name}
                </Link>
                <span className="text-xs font-semibold text-muted">{it.type === "ebook" ? "Ebook" : "Barang fisik"}</span>
                <div className="mt-auto flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
                  <span className="font-bold">{formatRupiah(it.price * it.qty)}</span>
                  <div className="flex items-center gap-1.5">
                    {it.type === "fisik" && (
                      <div className="flex items-center rounded-lg border border-field">
                        <button
                          type="button"
                          aria-label="Kurangi jumlah"
                          onClick={() => cart.setQty(it.id, it.qty - 1)}
                          className="flex size-11 items-center justify-center rounded-lg text-ink hover:bg-brand-soft hover:text-brand"
                        >
                          <Icon name="minus" size={16} strokeWidth={2.2} />
                        </button>
                        <span className="w-7 text-center text-sm font-bold" aria-live="polite">{it.qty}</span>
                        <button
                          type="button"
                          aria-label="Tambah jumlah"
                          onClick={() => cart.setQty(it.id, it.qty + 1)}
                          className="flex size-11 items-center justify-center rounded-lg text-ink hover:bg-brand-soft hover:text-brand"
                        >
                          <Icon name="plus" size={16} strokeWidth={2.2} />
                        </button>
                      </div>
                    )}
                    <button
                      type="button"
                      aria-label={`Hapus ${it.name}`}
                      onClick={() => cart.remove(it.id)}
                      className="flex size-11 items-center justify-center rounded-lg text-muted hover:bg-[#FDECEC] hover:text-danger"
                    >
                      <Icon name="trash" size={18} />
                    </button>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <aside className="flex h-fit flex-col gap-3 rounded-[20px] border border-line bg-white p-5 lg:sticky lg:top-6 lg:mt-12">
        <h2 className="font-bold">Ringkasan</h2>
        <div className="flex justify-between text-sm text-muted">
          <span>Subtotal ({count} barang)</span>
          <span className="font-semibold text-ink">{formatRupiah(subtotal)}</span>
        </div>
        <p className="text-xs text-muted">Ongkir dihitung di halaman checkout.</p>
        <Link
          href="/checkout"
          className="mt-1 flex h-13 items-center justify-center rounded-xl bg-brand font-bold text-white hover:bg-brand-dark"
        >
          Lanjut ke checkout
        </Link>
      </aside>
    </div>
  );
}
