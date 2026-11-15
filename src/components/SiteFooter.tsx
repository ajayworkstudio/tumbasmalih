import Link from "next/link";
import { site, waLink } from "@/lib/site";
import { Logo } from "./Logo";

export function SiteFooter() {
  return (
    <footer className="mt-16 bg-navy text-[#C9D3EA]">
      <div className="mx-auto flex max-w-310 flex-wrap justify-between gap-x-16 gap-y-8 px-6 py-11 pb-32 md:pb-11">
        <div className="flex max-w-85 flex-col gap-2.5">
          <Logo dark className="text-[22px]" />
          <p className="text-sm leading-relaxed">
            Tumbas malih: ayo beli lagi. Etalase kurasi barang dan ebook pilihan dari Jawa Tengah.
          </p>
        </div>
        <div className="flex flex-wrap gap-x-16 gap-y-8 text-sm">
          <div className="flex flex-col gap-2.5">
            <span className="font-bold text-white">Belanja</span>
            <Link href="/kategori/ebook" className="hover:text-white">Ebook</Link>
            <Link href="/#kategori" className="hover:text-white">Kategori</Link>
            <Link href="/cari" className="hover:text-white">Semua produk</Link>
          </div>
          <div className="flex flex-col gap-2.5">
            <span className="font-bold text-white">Bantuan</span>
            <Link href="/cara-belanja" className="hover:text-white">Cara belanja</Link>
            <Link href="/cara-belanja#pengiriman" className="hover:text-white">Pengiriman &amp; retur</Link>
          </div>
          <div className="flex flex-col gap-2.5">
            <span className="font-bold text-white">Hubungi kami</span>
            <a href={waLink(`Halo ${site.name}, saya mau tanya.`)} target="_blank" rel="noopener" className="font-bold text-accent hover:underline">
              Chat WhatsApp
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
