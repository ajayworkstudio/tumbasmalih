import type { OrderStatus, PaymentMethod } from "./types";

export const site = {
  name: "tumbasmalih",
  tagline: "Barang pilihan, bayar gampang.",
  description:
    "Etalase kurasi barang dan ebook pilihan. Bayar pakai QRIS, transfer bank, atau COD untuk barang fisik.",
  url: (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, ""),
  /** Cadangan untuk halaman error saat database tidak bisa dibaca. Nomor utama diatur di /admin/pengaturan. */
  whatsappFallback: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "",
};

export function waLink(message: string, whatsapp: string = site.whatsappFallback): string {
  const number = whatsapp.replace(/\D/g, "");
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
