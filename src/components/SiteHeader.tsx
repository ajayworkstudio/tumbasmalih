import Link from "next/link";
import { CartButton } from "./CartButton";
import { Icon } from "./Icon";
import { Logo } from "./Logo";

export function SearchForm({
  defaultValue = "",
  className = "",
  id = "q",
}: {
  defaultValue?: string;
  className?: string;
  id?: string;
}) {
  return (
    <form action="/cari" role="search" className={className}>
      <div className="flex h-13 items-center gap-2 rounded-xl border border-field bg-white pr-1 pl-3 focus-within:outline-3 focus-within:outline-offset-2 focus-within:outline-brand">
        <label htmlFor={id} className="flex shrink-0 items-center gap-1.5 text-sm font-semibold text-ink">
          <Icon name="search" size={18} />
          Cari
        </label>
        <input
          id={id}
          type="search"
          name="q"
          defaultValue={defaultValue}
          placeholder="rice cooker, ebook…"
          className="min-w-0 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-muted"
        />
        <button
          type="submit"
          className="h-11 shrink-0 rounded-lg bg-brand px-4 text-sm font-bold text-white hover:bg-brand-dark"
        >
          Cari
        </button>
      </div>
    </form>
  );
}

export function SiteHeader() {
  return (
    <header className="border-b border-line bg-white">
      <div className="mx-auto flex max-w-310 items-center gap-4 px-5 py-3 md:gap-7 md:px-6 md:py-4">
        <Logo className="text-[22px] md:text-2xl" />
        <SearchForm id="q-header" className="hidden max-w-140 flex-1 md:block" />
        <nav aria-label="Menu" className="hidden items-center text-sm font-semibold text-[#374151] lg:flex">
          <Link href="/kategori/ebook" className="flex h-11 items-center px-2.5 hover:text-brand">Ebook</Link>
          <Link href="/cari" className="flex h-11 items-center px-2.5 hover:text-brand">Semua produk</Link>
          <Link href="/cara-belanja" className="flex h-11 items-center px-2.5 hover:text-brand">Cara belanja</Link>
        </nav>
        <div className="ml-auto flex items-center gap-2.5">
          <CartButton className="rounded-full md:rounded-xl" />
        </div>
      </div>
    </header>
  );
}
