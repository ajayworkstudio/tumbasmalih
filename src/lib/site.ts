import type { OrderStatus, PaymentMethod } from "./types";

export const site = {
  name: "tumbasmalih",
  tagline: "Barang pilihan, bayar gampang.",
  description:
    "Etalase kurasi barang dan ebook pilihan. Bayar pakai QRIS, transfer bank, atau COD untuk barang fisik.",
  url: (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, ""),
  whatsapp: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "",
  qrisImageUrl: process.env.NEXT_PUBLIC_QRIS_IMAGE_URL ?? "",
};

/**
 * Kebijakan toko. Isi dengan kebijakan yang benar-benar kamu jalankan; selama masih kosong,
 * halaman menampilkan placeholder [ISI ...] supaya tidak ada janji yang dikarang.
 */
export const policy = {
  shippingTime: process.env.NEXT_PUBLIC_POLICY_SHIPPING ?? "",
  returns: process.env.NEXT_PUBLIC_POLICY_RETURNS ?? "",
  ebookRefund: process.env.NEXT_PUBLIC_POLICY_EBOOK ?? "",
};

/** Ongkir flat per pesanan yang berisi barang fisik (rupiah). Final dikonfirmasi admin. */
export function shippingFlat(): number {
  const n = Number(process.env.SHIPPING_FLAT ?? "15000");
  return Number.isFinite(n) && n >= 0 ? Math.round(n) : 15000;
}

/** Format env BANK_ACCOUNTS: "BCA|1234567890|Nama Pemilik;BRI|0987654321|Nama Pemilik" */
export function bankAccounts(): { bank: string; number: string; holder: string }[] {
  return (process.env.BANK_ACCOUNTS ?? "")
    .split(";")
    .map((row) => row.split("|").map((s) => s.trim()))
    .filter((parts) => parts.length === 3 && parts.every(Boolean))
    .map(([bank, number, holder]) => ({ bank, number, holder }));
}

export function waLink(message: string): string {
  const number = site.whatsapp.replace(/\D/g, "");
  const text = encodeURIComponent(message);
  return number ? `https://wa.me/${number}?text=${text}` : `https://wa.me/?text=${text}`;
}

export const paymentLabels: Record<PaymentMethod, string> = {
  qris: "QRIS",
  transfer: "Transfer Bank",
  cod: "Bayar di Tempat (COD)",
};

export const statusLabels: Record<OrderStatus, string> = {
  menunggu_pembayaran: "Menunggu pembayaran",
  menunggu_konfirmasi: "Menunggu konfirmasi",
  dibayar: "Sudah dibayar",
  diproses: "Sedang diproses",
  dikirim: "Dikirim",
  selesai: "Selesai",
  dibatalkan: "Dibatalkan",
};

export const statusOrder: OrderStatus[] = [
  "menunggu_pembayaran",
  "menunggu_konfirmasi",
  "dibayar",
  "diproses",
  "dikirim",
  "selesai",
  "dibatalkan",
];
