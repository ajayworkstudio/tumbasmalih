import Link from "next/link";
import { CartButton } from "./CartButton";
import { Icon } from "./Icon";
import { Logo } from "./Logo";

export function SearchForm({ defaultValue = "", className = "" }: { defaultValue?: string; className?: string }) {
  return (
    <form action="/cari" role="search" className={className}>
      <label className="flex h-12 items-center gap-2.5 rounded-2xl border border-line bg-white px-3.5 text-muted focus-within:border-brand md:bg-ground">
        <Icon name="search" size={20} />
        <span className="sr-only">Cari produk</span>
        <input
          type="search"
          name="q"
          defaultValue={defaultValue}
          placeholder="Mau tumbas apa hari ini?"
          className="min-w-0 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-muted"
        />
      </label>
    </form>
  );
}

export function SiteHeader() {
  return (
    <header className="border-b border-line bg-white">
      <div className="mx-auto flex max-w-310 items-center gap-4 px-5 py-4 md:gap-7 md:px-6">
        <Logo className="text-[22px] md:text-2xl" />
        <SearchForm className="hidden max-w-140 flex-1 md:block" />
        <nav aria-label="Menu" className="hidden items-center gap-5.5 text-sm font-semibold text-[#374151] lg:flex">
          <Link href="/kategori/ebook" className="hover:text-brand">Ebook</Link>
          <Link href="/#kategori" className="hover:text-brand">Kategori</Link>
          <Link href="/#pilihan" className="hover:text-brand">Promo</Link>
          <Link href="/cara-belanja" className="hover:text-brand">Cara Belanja</Link>
        </nav>
        <div className="ml-auto flex items-center gap-2.5">
          <CartButton className="rounded-full md:rounded-[14px]" />
        </div>
      </div>
    </header>
  );
}
