import type { Metadata } from "next";
import { getSettings } from "@/lib/settings";
import { site, waLink } from "@/lib/site";

export const metadata: Metadata = {
  title: "Cara belanja",
  description:
    "Cara belanja di tumbasmalih: pilih produk, checkout, bayar lewat QRIS atau transfer (COD untuk barang fisik), lalu pantau pesanan dari halaman pesanan.",
  alternates: { canonical: "/cara-belanja" },
};

const steps = [
  ["Pilih produk", "Masukkan barang atau ebook ke keranjang."],
  ["Checkout", "Isi nama, nomor WhatsApp, email, dan alamat (khusus barang fisik)."],
  ["Bayar", "Pilih QRIS atau transfer bank. Pesanan yang semuanya barang fisik juga bisa COD."],
  ["Kirim bukti bayar", "Tekan tombol WhatsApp di halaman pesanan, lalu kirim bukti transfer ke admin."],
  ["Terima pesanan", "Ebook diunduh dari halaman pesanan. Barang fisik dikirim, dan nomor resinya muncul di halaman yang sama."],
];

export default async function HowToBuyPage() {
  const settings = await getSettings();
  return (
    <article className="mx-auto flex max-w-180 flex-col gap-8">
      <h1 className="text-2xl font-extrabold md:text-4xl">Cara belanja di {site.name}</h1>
      <ol className="flex flex-col">
        {steps.map(([title, body], i) => (
          <li key={title} className="flex gap-4 border-t border-line py-4 first:border-t-0">
            <span className="w-6 shrink-0 text-lg font-extrabold text-brand" aria-hidden="true">{i + 1}</span>
            <div className="flex flex-col gap-1">
              <h2 className="font-bold">{title}</h2>
              <p className="text-sm text-muted">{body}</p>
            </div>
          </li>
        ))}
      </ol>
      <section id="pengiriman" aria-labelledby="pengiriman-title" className="flex scroll-mt-6 flex-col gap-3 rounded-[20px] border border-line bg-white p-5">
        <h2 id="pengiriman-title" className="text-xl font-extrabold">Pengiriman dan retur</h2>
        <dl className="flex flex-col gap-3 text-sm leading-relaxed">
          <div>
            <dt className="font-bold">Estimasi pengiriman</dt>
            <dd className="text-[#374151]">{settings.policyShipping || "[ISI ESTIMASI PENGIRIMAN]"}</dd>
          </div>
          <div>
            <dt className="font-bold">Retur barang fisik</dt>
            <dd className="text-[#374151]">{settings.policyReturns || "[ISI KEBIJAKAN RETUR]"}</dd>
          </div>
          <div>
            <dt className="font-bold">Ebook</dt>
            <dd className="text-[#374151]">{settings.policyEbook || "[ISI KEBIJAKAN PENGEMBALIAN EBOOK]"}</dd>
          </div>
        </dl>
        <a
          href={waLink(`Halo ${site.name}, saya mau tanya soal pesanan.`, settings.whatsapp)}
          target="_blank"
          rel="noopener"
          className="flex min-h-11 items-center self-start font-bold text-brand hover:underline"
        >
          Tanya admin di WhatsApp
        </a>
      </section>
    </article>
  );
}
