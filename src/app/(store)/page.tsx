import Link from "next/link";
import { CategoryTiles } from "@/components/CategoryTiles";
import { Icon, type IconName } from "@/components/Icon";
import { ProductGrid } from "@/components/ProductCard";
import { SearchForm } from "@/components/SiteHeader";
import { getCategories, getProducts } from "@/lib/data";

const reasons: { icon: IconName; title: string; body: string }[] = [
  {
    icon: "check",
    title: "Sudah dikurasi",
    body: "Tidak perlu membandingkan ratusan toko. Kami pilihkan barang yang layak dibeli.",
  },
  {
    icon: "qris",
    title: "Bayar semudahnya",
    body: "QRIS, transfer bank, atau COD untuk barang fisik. Tanpa perlu akun marketplace.",
  },
  {
    icon: "chat",
    title: "Dibantu lewat WhatsApp",
    body: "Tanya produk, cek status pesanan, sampai urus retur, langsung ngobrol dengan admin.",
  },
];

export default async function HomePage() {
  const [categories, featured, ebooks] = await Promise.all([
    getCategories(),
    getProducts({ featured: true, limit: 8 }),
    getProducts({ type: "ebook", limit: 4 }),
  ]);
  const ebookCategory = categories.find((c) => c.slug === "ebook");

  return (
    <div className="flex flex-col gap-10 md:gap-12">
      <SearchForm className="md:hidden" />

      {/* Hero */}
      <section className="flex flex-wrap gap-5">
        <div className="relative flex min-h-[150px] flex-[2_1_560px] flex-wrap items-center gap-8 overflow-hidden rounded-[22px] bg-brand p-5 text-white md:min-h-85 md:rounded-[28px] md:p-11">
          <div aria-hidden="true" className="absolute -top-20 -right-20 size-90 rounded-full bg-[#2C5DF0]" />
          <div className="relative flex flex-[1_1_260px] flex-col gap-3 md:gap-3.5">
            <span className="self-start rounded-full bg-white px-3 py-1.5 text-xs font-bold text-brand">
              Promo pembukaan
            </span>
            <h1 className="text-2xl leading-tight font-extrabold tracking-tight md:text-[44px]">
              Belanja lagi, hemat lagi.
            </h1>
            <p className="max-w-105 text-sm leading-relaxed text-[#DCE5FF] md:text-base">
              Barang pilihan yang sudah kami kurasi, plus ebook praktis yang langsung bisa diunduh. Bayar pakai
              QRIS, transfer, atau COD.
            </p>
            <div className="mt-1 flex flex-wrap gap-3">
              <Link
                href="#pilihan"
                className="flex h-11 items-center rounded-[14px] bg-accent px-5 text-sm font-bold text-ink hover:bg-accent-dark md:h-12.5 md:text-[15px]"
              >
                Belanja Sekarang
              </Link>
              <Link
                href="/kategori/ebook"
                className="flex h-11 items-center rounded-[14px] border-[1.5px] border-[#8FA8F5] px-5 text-sm font-bold text-white hover:bg-white/10 md:h-12.5 md:text-[15px]"
              >
                Lihat Ebook
              </Link>
            </div>
          </div>
          <div aria-hidden="true" className="relative hidden items-end gap-3.5 sm:flex">
            <div className="flex h-42.5 w-32.5 -rotate-6 items-center justify-center rounded-2xl bg-white text-brand shadow-[0_16px_32px_rgba(10,30,90,0.3)]">
              <Icon name="book" size={56} strokeWidth={1.5} />
            </div>
            <div className="flex h-35 w-27.5 rotate-[8deg] items-center justify-center rounded-2xl bg-accent text-ink shadow-[0_16px_32px_rgba(10,30,90,0.3)]">
              <Icon name="bag" size={48} strokeWidth={1.5} />
            </div>
          </div>
        </div>

        <div className="flex flex-[1_1_300px] flex-col gap-5 max-md:hidden">
          <Link
            href="/kategori/paket-kado"
            className="flex min-h-40 flex-1 flex-col justify-between gap-3 rounded-3xl bg-[#FFF1D6] p-6.5"
          >
            <span className="flex flex-col gap-1.5">
              <span className="text-xs font-bold text-[#8A5300]">Paket bundling</span>
              <span className="text-[22px] leading-tight font-extrabold">Paket Siap Ngekos</span>
              <span className="text-[13px] text-[#5B4A2A]">Perlengkapan kos + ebook hemat dalam satu paket.</span>
            </span>
            <span className="text-sm font-bold text-brand">Lihat paket →</span>
          </Link>
          <Link
            href="/kategori/ebook"
            className="flex min-h-40 flex-1 flex-col justify-between gap-3 rounded-3xl bg-[#E3F6EE] p-6.5"
          >
            <span className="flex flex-col gap-1.5">
              <span className="text-xs font-bold text-[#1F6B45]">Ebook</span>
              <span className="text-[22px] leading-tight font-extrabold">Bayar, langsung unduh</span>
              <span className="text-[13px] text-[#2F5443]">Link unduhan muncul setelah pembayaran dikonfirmasi.</span>
            </span>
            <span className="text-sm font-bold text-brand">Lihat ebook →</span>
          </Link>
        </div>
      </section>

      <section id="kategori" className="flex scroll-mt-6 flex-col gap-4">
        <h2 className="text-lg font-extrabold md:text-2xl">Kategori</h2>
        <CategoryTiles categories={categories} />
      </section>

      <section id="pilihan" className="flex scroll-mt-6 flex-col gap-4">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="text-lg font-extrabold md:text-2xl">Pilihan Kurasi</h2>
          <Link href="/cari" className="text-[13px] font-semibold text-brand hover:text-brand-dark md:text-sm">
            Lihat semua
          </Link>
        </div>
        <ProductGrid products={featured} />
      </section>

      {ebooks.length > 0 && (
        <section className="flex flex-col gap-4">
          <div className="flex items-baseline justify-between gap-4">
            <h2 className="text-lg font-extrabold md:text-2xl">Ebook Praktis</h2>
            {ebookCategory && (
              <Link href="/kategori/ebook" className="text-[13px] font-semibold text-brand hover:text-brand-dark md:text-sm">
                Lihat semua
              </Link>
            )}
          </div>
          <ProductGrid products={ebooks} />
        </section>
      )}

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-extrabold md:text-2xl">Kenapa tumbas di tumbasmalih?</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {reasons.map((r) => (
            <div key={r.title} className="flex flex-col gap-2.5 rounded-[20px] border border-line bg-white p-6">
              <span className="flex size-11.5 items-center justify-center rounded-[14px] bg-brand-soft text-brand">
                <Icon name={r.icon} size={22} />
              </span>
              <h3 className="text-[17px] font-bold">{r.title}</h3>
              <p className="text-sm leading-relaxed text-muted">{r.body}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
