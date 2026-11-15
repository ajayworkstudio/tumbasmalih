import Link from "next/link";
import { site, waLink } from "@/lib/site";
import { Logo } from "./Logo";

const linkCls = "flex min-h-11 items-center hover:text-white hover:underline";

export function SiteFooter() {
  return (
    <footer className="on-dark mt-16 bg-navy text-[#C9D3EA]">
      <div className="mx-auto flex max-w-310 flex-wrap justify-between gap-x-16 gap-y-8 px-6 py-11 pb-32 md:pb-11">
        <div className="flex max-w-85 flex-col gap-2.5">
          <Logo dark className="text-[22px]" />
          <p className="text-sm leading-relaxed">
            Tumbas malih artinya beli lagi. Etalase barang dan ebook yang kami pilih sendiri.
          </p>
        </div>
        <div className="flex flex-wrap gap-x-16 gap-y-6 text-sm">
          <div className="flex flex-col">
            <h2 className="mb-1 font-bold text-white">Belanja</h2>
            <Link href="/kategori/ebook" className={linkCls}>Ebook</Link>
            <Link href="/cari" className={linkCls}>Semua produk</Link>
          </div>
          <div className="flex flex-col">
            <h2 className="mb-1 font-bold text-white">Bantuan</h2>
            <Link href="/cara-belanja" className={linkCls}>Cara belanja</Link>
            <Link href="/cara-belanja#pengiriman" className={linkCls}>Pengiriman dan retur</Link>
            <a href={waLink(`Halo ${site.name}, saya mau tanya.`)} target="_blank" rel="noopener" className={`${linkCls} font-bold text-accent`}>
              Chat admin di WhatsApp
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
