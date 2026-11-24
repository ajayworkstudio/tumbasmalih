import "server-only";
import { formatRupiah } from "@/lib/format";
import { paymentLabels, site } from "@/lib/site";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Order } from "@/lib/types";

/** Ongkir hanya boleh diisi atau dikoreksi sebelum pesanan dibayar. */
const EDITABLE = new Set(["menunggu_konfirmasi", "menunggu_pembayaran"]);
const MAX_FEE = 5_000_000;

export function parseFee(raw: string | undefined | null): number | null {
  const clean = (raw ?? "").replace(/[^\d]/g, "");
  if (!clean) return null;
  const n = Number(clean);
  return Number.isSafeInteger(n) && n <= MAX_FEE ? n : null;
}

/**
 * Simpan ongkir hasil cek di pemasok. Total ikut dihitung ulang dan pesanan
 * pindah ke "Menunggu pembayaran" supaya pembeli bisa membayar.
 */
export async function setShippingFee(
  by: { id: string } | { code: string },
  fee: number,
): Promise<{ order: Order } | { error: string }> {
  const supabase = createAdminClient();
  const query = supabase.from("orders").select("*");
  const { data: order } = await ("id" in by ? query.eq("id", by.id) : query.eq("code", by.code)).maybeSingle<Order>();
  if (!order) return { error: "Pesanan tidak ditemukan." };
  if (!EDITABLE.has(order.status)) return { error: "Ongkir hanya bisa diisi sebelum pesanan dibayar." };
  if (!order.address) return { error: "Pesanan ini tidak berisi barang fisik, jadi tidak perlu ongkir." };

  const changes = { shipping_fee: fee, total: order.subtotal + fee, status: "menunggu_pembayaran" as const };
  const { error } = await supabase.from("orders").update(changes).eq("id", order.id);
  if (error) return { error: error.message };
  return { order: { ...order, ...changes } };
}

/** Pesan WhatsApp ke pembeli berisi ongkir dan total yang harus dibayar. */
export function shippingQuoteMessage(order: Order): string {
  return [
    `Halo Kak ${order.customer_name}, ongkir pesanan ${order.code} ke ${order.city ?? "alamatmu"} ${formatRupiah(order.shipping_fee)}.`,
    `Total yang perlu dibayar ${formatRupiah(order.total)} via ${paymentLabels[order.payment_method]}.`,
    `Cara bayarnya ada di ${site.url}/pesanan/${order.code}. Setelah bayar, kirim buktinya di chat ini ya.`,
  ].join(" ");
}

export function shippingQuoteLink(order: Order): string {
  return `https://wa.me/${order.phone}?text=${encodeURIComponent(shippingQuoteMessage(order))}`;
}
