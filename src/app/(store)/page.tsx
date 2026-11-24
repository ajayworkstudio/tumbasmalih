import Link from "next/link";
import { AddToCartButton } from "@/components/AddToCartButton";
import { CategoryTiles } from "@/components/CategoryTiles";
import { Icon } from "@/components/Icon";
import { ProductGrid } from "@/components/ProductCard";
import { ProductImage } from "@/components/ProductImage";
import { SearchForm } from "@/components/SiteHeader";
import { getCategories, getProducts } from "@/lib/data";
import { formatRupiah } from "@/lib/format";
import type { Product } from "@/lib/types";

const reasons = [
  {
    title: "Kami pilihkan dulu",
    body: "Barang di sini kami pilih sendiri, jadi kamu tidak perlu membandingkan banyak toko.",
  },
  {
    title: "Tanpa akun marketplace",
    body: "Cukup isi nama, nomor WhatsApp, dan alamat. Bayar lewat QRIS atau transfer bank.",
  },
  {
    title: "Ada admin yang membalas",
    body: "Pertanyaan produk, status pesanan, sampai urusan retur, semuanya lewat WhatsApp dengan admin.",
  },
];

function EbookRow({ product }: { product: Product }) {
  return (
    <li className="flex items-center gap-3.5 border-b border-line py-3.5 last:border-0">
      <Link href={`/produk/${product.slug}`} className="size-18 shrink-0 overflow-hidden rounded-xl">
        <ProductImage src={product.image_url} alt={product.name} type="ebook" iconSize={28} />
      </Link>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <h3 className="line-clamp-2 text-sm font-bold">
          <Link href={`/produk/${product.slug}`} className="hover:text-brand hover:underline">
            {product.name}
          </Link>
        </h3>
        <span className="text-sm font-semibold text-brand">{formatRupiah(product.price)}</span>
      </div>
      <AddToCartButton product={product} />
    </li>
  );
}

export default async function HomePage() {
  const [categories, featured, ebooks] = await Promise.all([
    getCategories(),
    getProducts({ featured: true, limit: 8 }),
    getProducts({ type: "ebook", limit: 6 }),
  ]);

  return (
    <div className="flex flex-col gap-10 md:gap-14">
      <SearchForm id="q-home" className="md:hidden" />

      <section className="grid gap-4 lg:grid-cols-[1fr_340px] lg:gap-5">
        <div className="flex flex-col justify-center gap-4 rounded-3xl bg-brand p-6 text-white md:p-11">
          <h1 className="text-[28px] leading-tight font-extrabold tracking-tight md:text-5xl">
            Mau <span className="marker-tag">tumbas</span> apa hari ini?
          </h1>
          <p className="max-w-110 text-[15px] leading-relaxed text-[#DCE5FF] md:text-base">
            Barang yang sudah kami pilih, plus ebook praktis. Bayar pakai QRIS atau transfer bank.
          </p>
          <div className="mt-1 flex flex-wrap gap-3">
            <Link
              href="#pilihan"
              className="flex h-12 items-center rounded-xl bg-accent px-5 text-[15px] font-bold text-ink hover:bg-accent-dark focus-visible:outline-white"
            >
              Lihat pilihan kurasi
            </Link>
            <Link
              href="/kategori/ebook"
              className="flex h-12 items-center rounded-xl border-2 border-white px-5 text-[15px] font-bold text-white hover:bg-white hover:text-brand focus-visible:outline-white"
            >
              Lihat ebook
            </Link>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
          <Link
            href="/kategori/ebook"
            className="flex flex-col gap-1.5 rounded-[20px] border border-line bg-white p-5 hover:border-brand"
          >
            <span className="flex items-center gap-2 font-bold">
              <Icon name="download" size={20} className="text-brand" /> Ebook
            </span>
            <span className="text-sm leading-relaxed text-muted">
              Link unduh muncul di halaman pesanan setelah pembayaran kamu dikonfirmasi admin.
            </span>
          </Link>
          <Link
            href="/cara-belanja"
            className="flex flex-col gap-1.5 rounded-[20px] border border-line bg-white p-5 hover:border-brand"
          >
            <span className="flex items-center gap-2 font-bold">
              <Icon name="truck" size={20} className="text-brand" /> Barang fisik
            </span>
            <span className="text-sm leading-relaxed text-muted">
              Ongkir dihitung sesuai alamatmu sebelum bayar. Nomor resi muncul di halaman pesanan begitu barang dikirim.
            </span>
          </Link>
        </div>
      </section>

      {categories.length > 0 && (
        <section id="kategori" aria-labelledby="kategori-title" className="flex scroll-mt-6 flex-col gap-3">
          <h2 id="kategori-title" className="text-lg font-extrabold md:text-xl">Kategori</h2>
          <CategoryTiles categories={categories} />
        </section>
      )}

      <section id="pilihan" aria-labelledby="pilihan-title" className="flex scroll-mt-6 flex-col gap-4">
        <div className="flex items-end justify-between gap-4">
          <h2 id="pilihan-title" className="text-xl font-extrabold md:text-3xl">Pilihan kurasi</h2>
          <Link href="/cari" className="flex min-h-11 items-center text-sm font-semibold text-brand hover:underline">
            Semua produk
          </Link>
        </div>
        <ProductGrid products={featured} />
      </section>

      {ebooks.length > 0 && (
        <section aria-labelledby="ebook-title" className="grid gap-4 rounded-3xl border border-line bg-white p-5 md:grid-cols-[260px_1fr] md:gap-10 md:p-8">
          <div className="flex flex-col gap-2">
            <h2 id="ebook-title" className="text-xl font-extrabold md:text-2xl">Ebook</h2>
            <p className="text-sm leading-relaxed text-muted">
              Format PDF. Tidak ada pengiriman, file diunduh dari halaman pesanan.
            </p>
            <Link href="/kategori/ebook" className="flex min-h-11 items-center text-sm font-semibold text-brand hover:underline">
              Semua ebook
            </Link>
          </div>
          <ul className="grid md:grid-cols-2 md:gap-x-8">
            {ebooks.map((p) => (
              <EbookRow key={p.id} product={p} />
            ))}
          </ul>
        </section>
      )}

      <section aria-labelledby="kenapa-title" className="grid gap-6 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] md:gap-12">
        <h2 id="kenapa-title" className="text-xl leading-snug font-extrabold md:text-3xl">
          Kenapa <span className="marker">tumbas</span> di sini?
        </h2>
        <ol className="flex flex-col">
          {reasons.map((r, i) => (
            <li key={r.title} className="flex gap-4 border-t border-line py-4 first:border-t-0 first:pt-0">
              <span className="w-6 shrink-0 text-lg font-extrabold text-brand" aria-hidden="true">{i + 1}</span>
              <div className="flex flex-col gap-1">
                <h3 className="font-bold">{r.title}</h3>
                <p className="text-sm leading-relaxed text-muted">{r.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
