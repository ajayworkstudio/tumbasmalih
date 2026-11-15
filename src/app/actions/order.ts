"use server";

import { randomInt } from "node:crypto";
import { redirect } from "next/navigation";
import { normalizePhone } from "@/lib/format";
import { getSettings } from "@/lib/settings";
import { createAdminClient } from "@/lib/supabase/admin";
import type { PaymentMethod, ProductType } from "@/lib/types";

export type CheckoutValues = Partial<Record<"name" | "phone" | "email" | "address" | "city" | "postal_code" | "note", string>>;

export type CheckoutState = {
  error?: string;
  /** Isian terakhir, supaya form tidak kosong lagi setelah validasi gagal. */
  values?: CheckoutValues;
  fieldErrors?: Partial<Record<"name" | "phone" | "email" | "address" | "city" | "postal_code" | "payment", string>>;
};

const MAX_LINES = 30;
const MAX_QTY = 20;
// Tanpa huruf/angka yang mirip (0/O, 1/I/L) supaya kode mudah dibacakan lewat WA.
const CODE_ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";

function orderCode(): string {
  let s = "TM";
  for (let i = 0; i < 8; i++) s += CODE_ALPHABET[randomInt(CODE_ALPHABET.length)];
  return s;
}

function str(formData: FormData, key: string, max = 200): string {
  const v = formData.get(key);
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}

function parseItems(raw: string): { id: string; qty: number }[] | null {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0 || parsed.length > MAX_LINES) return null;
    const merged = new Map<string, number>();
    for (const row of parsed) {
      const id = typeof row?.id === "string" ? row.id : "";
      const qty = Number(row?.qty);
      if (!/^[0-9a-f-]{36}$/i.test(id) || !Number.isInteger(qty) || qty < 1) return null;
      merged.set(id, Math.min(MAX_QTY, (merged.get(id) ?? 0) + qty));
    }
    return [...merged].map(([id, qty]) => ({ id, qty }));
  } catch {
    return null;
  }
}

export async function createOrder(_prev: CheckoutState, formData: FormData): Promise<CheckoutState> {
  const name = str(formData, "name", 100);
  const phoneRaw = str(formData, "phone", 30);
  const email = str(formData, "email", 150).toLowerCase();
  const address = str(formData, "address", 500);
  const city = str(formData, "city", 100);
  const postalCode = str(formData, "postal_code", 10);
  const note = str(formData, "note", 500);
  const payment = str(formData, "payment_method", 20) as PaymentMethod;
  const items = parseItems(str(formData, "items", 10_000));
  const values: CheckoutValues = { name, phone: phoneRaw, email, address, city, postal_code: postalCode, note };

  if (!items) return { error: "Keranjang kosong atau tidak valid. Muat ulang halaman lalu coba lagi.", values };

  const supabase = createAdminClient();
  const { data: products, error: productError } = await supabase
    .from("products")
    .select("id, name, type, price, stock")
    .in("id", items.map((i) => i.id))
    .eq("is_active", true);

  if (productError) {
    console.error("createOrder products:", productError.message);
    return { error: "Gagal memproses pesanan. Coba lagi sebentar lagi.", values };
  }

  const byId = new Map((products ?? []).map((p) => [p.id as string, p]));
  if (byId.size !== items.length) {
    return { error: "Ada produk di keranjang yang sudah tidak tersedia. Hapus produk itu lalu coba lagi.", values };
  }

  // Harga diambil dari database, bukan dari keranjang di browser.
  const lines = items.map(({ id, qty }) => {
    const p = byId.get(id)!;
    const type = p.type as ProductType;
    const finalQty = type === "ebook" ? 1 : qty;
    return { product_id: id, name: p.name as string, type, price: p.price as number, qty: finalQty, line_total: (p.price as number) * finalQty, stock: p.stock as number | null };
  });

  const soldOut = lines.find((l) => l.type === "fisik" && l.stock !== null && l.stock < l.qty);
  if (soldOut) {
    return { error: `Stok "${soldOut.name}" tidak cukup (tersisa ${soldOut.stock}). Kurangi jumlahnya di keranjang.`, values };
  }

  const hasPhysical = lines.some((l) => l.type === "fisik");
  const allPhysical = lines.every((l) => l.type === "fisik");

  const fieldErrors: CheckoutState["fieldErrors"] = {};
  if (name.length < 2) fieldErrors.name = "Isi nama lengkap.";
  const phone = normalizePhone(phoneRaw);
  if (!phone) fieldErrors.phone = "Nomor WhatsApp tidak valid (contoh: 081234567890).";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) fieldErrors.email = "Email tidak valid.";
  if (hasPhysical) {
    if (address.length < 10) fieldErrors.address = "Isi alamat lengkap (jalan, RT/RW, kelurahan, kecamatan).";
    if (city.length < 3) fieldErrors.city = "Isi kota/kabupaten.";
    if (!/^\d{5}$/.test(postalCode)) fieldErrors.postal_code = "Kode pos 5 angka.";
  }
  if (!["qris", "transfer", "cod"].includes(payment)) fieldErrors.payment = "Pilih metode pembayaran.";
  if (payment === "cod" && !allPhysical) fieldErrors.payment = "COD hanya untuk pesanan yang semuanya barang fisik.";
  if (Object.keys(fieldErrors).length > 0) return { fieldErrors, values };

  const subtotal = lines.reduce((n, l) => n + l.line_total, 0);
  const shippingFee = hasPhysical ? (await getSettings()).shippingFlat : 0;

  let orderId: string | null = null;
  let code = "";
  for (let attempt = 0; attempt < 3 && !orderId; attempt++) {
    code = orderCode();
    const { data, error } = await supabase
      .from("orders")
      .insert({
        code,
        customer_name: name,
        phone,
        email,
        address: hasPhysical ? address : null,
        city: hasPhysical ? city : null,
        postal_code: hasPhysical ? postalCode : null,
        note: note || null,
        payment_method: payment,
        status: payment === "cod" ? "menunggu_konfirmasi" : "menunggu_pembayaran",
        subtotal,
        shipping_fee: shippingFee,
        total: subtotal + shippingFee,
      })
      .select("id")
      .single();
    if (data) orderId = data.id as string;
    else if (error && error.code !== "23505") {
      console.error("createOrder insert:", error.message);
      return { error: "Gagal menyimpan pesanan. Coba lagi sebentar lagi.", values };
    }
  }
  if (!orderId) return { error: "Gagal membuat kode pesanan. Coba lagi.", values };

  const { error: itemsError } = await supabase
    .from("order_items")
    .insert(
      lines.map((l) => ({
        order_id: orderId,
        product_id: l.product_id,
        name: l.name,
        type: l.type,
        price: l.price,
        qty: l.qty,
        line_total: l.line_total,
      })),
    );
  if (itemsError) {
    console.error("createOrder items:", itemsError.message);
    await supabase.from("orders").delete().eq("id", orderId);
    return { error: "Gagal menyimpan pesanan. Coba lagi sebentar lagi.", values };
  }

  redirect(`/pesanan/${code}?baru=1`);
}
