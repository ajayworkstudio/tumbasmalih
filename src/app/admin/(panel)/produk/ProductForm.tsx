"use client";
import { startTransition, useActionState, useState } from "react";
import type { AdminProduct, Category } from "@/lib/types";
import { saveProduct, type ProductFormState } from "../../actions";

const input = "h-11 rounded-lg border border-field bg-white px-3 text-sm";
const label = "flex flex-col gap-1.5 text-sm font-semibold";
const hint = "text-xs font-normal text-muted";

export function ProductForm({ product, categories }: { product?: AdminProduct; categories: Category[] }) {
  const [state, action, pending] = useActionState<ProductFormState, FormData>(saveProduct, {});
  const [type, setType] = useState(product?.type ?? "fisik");
  const v = state.values;
  const dv = (key: string, fallback: string | number | null | undefined) => (v ? (v[key] ?? "") : (fallback ?? ""));
  const checked = (key: string, fallback: boolean) => (v ? v[key] === "on" : fallback);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        startTransition(() => action(data));
      }}
      className="grid gap-5 lg:grid-cols-[1fr_320px]"
    >
      {product && <input type="hidden" name="id" value={product.id} />}

      <div className="flex flex-col gap-4 rounded-2xl border border-line bg-white p-5">
        {state.error && <p role="alert" className="rounded-xl bg-[#FDECEC] p-3 text-sm font-medium text-danger">{state.error}</p>}
        <label className={label}>
          Nama produk
          <input name="name" required defaultValue={dv("name", product?.name)} className={input} />
        </label>
        <label className={label}>
          Slug (URL)
          <input name="slug" defaultValue={dv("slug", product?.slug)} placeholder="otomatis dari nama" className={input} />
          <span className={hint}>Jadi alamat halaman: /produk/slug. Pakai kata kunci yang dicari orang, bagus untuk SEO.</span>
        </label>
        <label className={label}>
          Deskripsi
          <textarea name="description" rows={6} defaultValue={dv("description", product?.description)} className="rounded-lg border border-field px-3 py-2.5 text-sm" />
        </label>
        <label className={label}>
          URL gambar
          <input name="image_url" type="url" defaultValue={dv("image_url", product?.image_url)} placeholder="https://…" className={input} />
          <span className={hint}>Unggah gambar ke Supabase Storage bucket “produk”, lalu salin public URL-nya ke sini.</span>
        </label>
        {type === "ebook" ? (
          <label className={label}>
            Path file ebook
            <input name="file_path" defaultValue={dv("file_path", product?.file_path)} placeholder="contoh: hemat-anak-kos.pdf" className={input} />
            <span className={hint}>Unggah PDF ke bucket privat “ebooks” di Supabase Storage, lalu tulis nama/path file-nya di sini.</span>
          </label>
        ) : (
          <label className={label}>
            Link sumber (marketplace)
            <input name="source_url" type="url" defaultValue={dv("source_url", product?.source_url)} placeholder="https://shopee.co.id/…" className={input} />
            <span className={hint}>Hanya terlihat di admin, untuk memesankan barang ke marketplace.</span>
          </label>
        )}
      </div>

      <div className="flex h-fit flex-col gap-4 rounded-2xl border border-line bg-white p-5">
        <label className={label}>
          Jenis
          <select name="type" value={type} onChange={(e) => setType(e.target.value as "ebook" | "fisik")} className={input}>
            <option value="fisik">Barang fisik</option>
            <option value="ebook">Ebook</option>
          </select>
        </label>
        <label className={label}>
          Kategori
          <select name="category_id" defaultValue={dv("category_id", product?.category_id)} className={input}>
            <option value="">Tanpa kategori</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </label>
        <label className={label}>
          Harga jual (Rp)
          <input name="price" inputMode="numeric" required defaultValue={dv("price", product?.price)} className={input} />
        </label>
        <label className={label}>
          Harga coret (Rp, opsional)
          <input name="compare_price" inputMode="numeric" defaultValue={dv("compare_price", product?.compare_price)} className={input} />
          <span className={hint}>Isi hanya kalau produk ini memang pernah dijual dengan harga itu di tumbasmalih.</span>
        </label>
        <label className={label}>
          Harga modal (Rp, opsional)
          <input name="source_price" inputMode="numeric" defaultValue={dv("source_price", product?.source_price)} className={input} />
          <span className={hint}>Untuk menghitung margin. Tidak tampil di toko.</span>
        </label>
        {type === "fisik" && (
          <label className={label}>
            Stok
            <input name="stock" inputMode="numeric" defaultValue={dv("stock", product?.stock)} placeholder="kosong = tidak dibatasi" className={input} />
          </label>
        )}
        <label className="flex items-center gap-2.5 text-sm font-semibold">
          <input type="checkbox" name="is_active" defaultChecked={checked("is_active", product?.is_active ?? true)} className="size-4.5 accent-brand" />
          Tampilkan di toko
        </label>
        <label className="flex items-center gap-2.5 text-sm font-semibold">
          <input type="checkbox" name="is_featured" defaultChecked={checked("is_featured", product?.is_featured ?? false)} className="size-4.5 accent-brand" />
          Masuk “Pilihan Kurasi”
        </label>
        <button type="submit" disabled={pending} className="h-11 rounded-xl bg-brand font-bold text-white hover:bg-brand-dark disabled:opacity-60">
          {pending ? "Menyimpan…" : "Simpan produk"}
        </button>
      </div>
    </form>
  );
}
