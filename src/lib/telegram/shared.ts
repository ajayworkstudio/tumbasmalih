import "server-only";
import { formatRupiah } from "@/lib/format";
import { site, statusLabels } from "@/lib/site";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Order, OrderItem, OrderStatus } from "@/lib/types";
import { esc } from "./api";

export const db = () => createAdminClient();

export const PAID: OrderStatus[] = ["dibayar", "diproses", "dikirim", "selesai"];

export function rp(n: number | null | undefined): string {
  return formatRupiah(n ?? 0);
}

export function adminUrl(path: string): string {
  return `${site.url}${path}`;
}

export function normCode(raw: string | undefined): string {
  return (raw ?? "").trim().toUpperCase();
}

export async function findOrder(code: string): Promise<(Order & { items: OrderItem[] }) | null> {
  if (!/^TM[0-9A-Z]{8}$/.test(code)) return null;
  const supabase = db();
  const { data: order } = await supabase.from("orders").select("*").eq("code", code).maybeSingle<Order>();
  if (!order) return null;
  const { data: items } = await supabase.from("order_items").select("*").eq("order_id", order.id);
  return { ...order, items: (items ?? []) as OrderItem[] };
}

export type ProductRow = {
  id: string;
  slug: string;
  name: string;
  type: "ebook" | "fisik";
  price: number;
  stock: number | null;
  source_price: number | null;
  source_url: string | null;
  is_active: boolean;
};

const PRODUCT_COLS = "id, slug, name, type, price, stock, source_price, source_url, is_active";

/**
 * Cari produk dari slug persis, atau dari potongan nama.
 * Mengembalikan satu produk, atau daftar kandidat kalau hasilnya lebih dari satu.
 */
export async function findProduct(query: string): Promise<{ product?: ProductRow; candidates: ProductRow[] }> {
  const q = query.trim().toLowerCase();
  if (!q) return { candidates: [] };
  const supabase = db();
  const { data: exact } = await supabase.from("products").select(PRODUCT_COLS).eq("slug", q).maybeSingle<ProductRow>();
  if (exact) return { product: exact, candidates: [] };
  const term = q.replace(/[%,()*]/g, " ").replace(/-/g, " ").trim();
  const { data } = await supabase.from("products").select(PRODUCT_COLS).ilike("name", `%${term}%`).limit(6);
  const rows = (data ?? []) as ProductRow[];
  return rows.length === 1 ? { product: rows[0], candidates: [] } : { candidates: rows };
}

export function candidatesText(query: string, rows: ProductRow[], example: string): string {
  if (!rows.length) return `Produk "${esc(query)}" tidak ditemukan. Cari dulu dengan <code>/bulan cari kata</code>.`;
  return [
    `Ada ${rows.length} produk yang cocok dengan "${esc(query)}". Pakai slug-nya:`,
    ...rows.map((p) => `• <code>${esc(p.slug)}</code> ${esc(p.name)}`),
    "",
    `Contoh: <code>${esc(example.replace("SLUG", rows[0].slug))}</code>`,
  ].join("\n");
}

export function orderLine(o: Pick<Order, "code" | "customer_name" | "total" | "status">): string {
  return `<b>${esc(o.code)}</b> · ${esc(o.customer_name)} · ${rp(o.total)} · ${esc(statusLabels[o.status])}`;
}

export function margin(p: Pick<ProductRow, "price" | "source_price">): number | null {
  return p.source_price == null ? null : p.price - p.source_price;
}
