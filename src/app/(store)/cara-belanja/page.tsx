import type { Metadata } from "next";
import { site, waLink } from "@/lib/site";

export const metadata: Metadata = {
  title: "Cara belanja",
  description: "Cara belanja di tumbasmalih: pilih produk, checkout, bayar QRIS/transfer/COD, lalu barang dikirim atau ebook siap diunduh.",
  alternates: { canonical: "/cara-belanja" },
};

const steps = [
  ["Pilih produk", "Masukkan barang atau ebook ke keranjang."],
  ["Checkout", "Isi nama, nomor WhatsApp, email, dan alamat (khusus barang fisik)."],
  ["Bayar", "Pilih QRIS atau transfer bank. Barang fisik juga bisa COD."],
  ["Konfirmasi", "Kirim bukti bayar lewat tombol WhatsApp di halaman pesanan."],
  ["Terima pesanan", "Ebook bisa langsung diunduh dari halaman pesanan; barang fisik dikirim beserta nomor resi."],
];

export default function HowToBuyPage() {
  return (
    <article className="mx-auto flex max-w-180 flex-col gap-8">
      <h1 className="text-2xl font-extrabold md:text-4xl">Cara belanja di {site.name}</h1>
      <ol className="flex flex-col gap-3">
        {steps.map(([title, body], i) => (
          <li key={title} className="flex gap-4 rounded-[18px] border border-line bg-white p-4">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand font-bold text-white">{i + 1}</span>
            <span className="flex flex-col gap-1">
              <span className="font-bold">{title}</span>
              <span className="text-sm text-muted">{body}</span>
            </span>
          </li>
        ))}
      </ol>
      <section id="pengiriman" className="flex scroll-mt-6 flex-col gap-2">
        <h2 className="text-xl font-extrabold">Pengiriman &amp; retur</h2>
        <p className="text-sm leading-relaxed text-[#374151]">
          Barang fisik dikirim 1–2 hari kerja setelah pembayaran dikonfirmasi (atau setelah pesanan COD dikonfirmasi),
          dengan estimasi tiba 2–5 hari. Jika barang rusak atau tidak sesuai, hubungi kami maksimal 2×24 jam setelah barang
          diterima dengan video unboxing. Ebook tidak bisa dikembalikan setelah diunduh.
        </p>
        <a href={waLink(`Halo ${site.name}, saya mau tanya soal pesanan.`)} target="_blank" rel="noopener" className="mt-2 self-start font-bold text-brand hover:underline">
          Tanya lewat WhatsApp →
        </a>
      </section>
    </article>
  );
}
