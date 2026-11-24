import "server-only";
import { revalidateTag } from "next/cache";
import { statusLabels } from "@/lib/site";
import type { Order, OrderItem } from "@/lib/types";
import { esc, type Buttons, type Reply } from "./api";
import { logAction } from "./log";
import { adminUrl, candidatesText, db, findOrder, findProduct, margin, normCode, rp, type ProductRow } from "./shared";

const NAME = "Bulan (Inventori)";
const LOW = 3;

export const bulanHelp = [
  `<b>${NAME}</b>, menjaga stok, harga modal, dan pemesanan ke marketplace.`,
  "<code>/bulan</code> stok menipis dan habis",
  "<code>/bulan pesan</code> barang yang perlu dipesankan ke marketplace",
  "<code>/bulan cari KATA</code> cari slug produk",
  "<code>/bulan stok SLUG JUMLAH</code> ubah stok",
  "<code>/bulan modal SLUG HARGA</code> ubah harga modal, lihat margin",
  "<code>/bulan margin</code> 10 produk dengan margin paling tipis",
  "<code>/bulan sembunyikan SLUG</code> · <code>/bulan tampilkan SLUG</code>",
].join("\n");

function refreshCatalog() {
  try {
    revalidateTag("catalog", { expire: 0 });
  } catch (e) {
    console.error("revalidateTag:", e);
  }
}

function marginText(p: Pick<ProductRow, "price" | "source_price">): string {
  const m = margin(p);
  if (m === null) return "harga modal belum diisi";
  const pct = p.price ? Math.round((m / p.price) * 100) : 0;
  const warn = m <= 0 ? " RUGI" : pct < 10 ? " tipis" : "";
  return `margin ${rp(m)} (${pct}%)${warn}`;
}

async function stockReport(): Promise<Reply> {
  const { data, error } = await db()
    .from("products")
    .select("id, slug, name, type, price, stock, source_price, source_url, is_active")
    .eq("type", "fisik")
    .lte("stock", LOW)
    .order("stock", { ascending: true })
    .limit(30);
  if (error) return { text: `${NAME}: gagal membaca stok (${esc(error.message)}).` };
  const rows = (data ?? []) as ProductRow[];
  if (!rows.length) return { text: `<b>${NAME}</b>\nTidak ada barang fisik dengan stok ${LOW} atau kurang.` };
  const buttons: Buttons = rows
    .filter((p) => p.stock === 0 && p.is_active)
    .slice(0, 4)
    .map((p) => [{ text: `Sembunyikan ${p.name}`.slice(0, 60), data: `bu:hide:${p.id}` }]);
  return {
    text: [
      `<b>${NAME}</b>: ${rows.length} barang stoknya menipis`,
      ...rows.map((p) => `• ${p.stock === 0 ? "<b>HABIS</b>" : `sisa ${p.stock}`} · ${esc(p.name)} <code>${esc(p.slug)}</code>${p.is_active ? "" : " (tersembunyi)"}`),
      "",
      "Ubah stok: <code>/bulan stok SLUG JUMLAH</code>",
    ].join("\n"),
    buttons,
  };
}

type ItemWithProduct = OrderItem & { products: { source_url: string | null; source_price: number | null } | null };

async function toOrder(): Promise<Reply> {
  const supabase = db();
  const { data: orders } = await supabase
    .from("orders")
    .select("id, code, customer_name, phone, address, city, postal_code, status")
    .eq("status", "dibayar")
    .order("paid_at", { ascending: true })
    .limit(10);
  const list = (orders ?? []) as Pick<Order, "id" | "code" | "customer_name" | "phone" | "address" | "city" | "postal_code" | "status">[];
  const physical: { order: (typeof list)[number]; items: ItemWithProduct[] }[] = [];
  for (const o of list) {
    const { data: items } = await supabase.from("order_items").select("*, products(source_url, source_price)").eq("order_id", o.id).eq("type", "fisik");
    if (items?.length) physical.push({ order: o, items: items as ItemWithProduct[] });
  }
  if (!physical.length) return { text: `<b>${NAME}</b>\nTidak ada barang yang menunggu dipesankan ke marketplace.` };
  const blocks = physical.map(({ order, items }) =>
    [
      `<b>${esc(order.code)}</b> · ${esc(order.customer_name)} · +${esc(order.phone)}`,
      `${esc(order.address ?? "")}, ${esc(order.city ?? "")} ${esc(order.postal_code ?? "")}`,
      ...items.map((it) => `• ${esc(it.name)} x${it.qty}${it.products?.source_url ? ` · <a href="${esc(it.products.source_url)}">link sumber</a>` : " · link sumber belum diisi"}`),
    ].join("\n"),
  );
  return {
    text: [`<b>${NAME}</b>: ${physical.length} pesanan perlu dipesankan`, "Pesankan dengan alamat pembeli, lalu tekan tombolnya.", "", ...blocks].join("\n\n"),
    buttons: physical.map(({ order }) => [{ text: `${order.code} sudah dipesan`, data: `bu:ordered:${order.code}` }]),
  };
}

async function updateProduct(p: ProductRow, patch: Partial<ProductRow>, actor: string, what: string): Promise<string | null> {
  const { error } = await db().from("products").update(patch).eq("id", p.id);
  if (error) return error.message;
  refreshCatalog();
  await logAction("bulan", actor, what, p.slug);
  return null;
}

async function withProduct(query: string | undefined, example: string, fn: (p: ProductRow) => Promise<Reply>): Promise<Reply> {
  if (!query) return { text: `Sebutkan produknya. Contoh: <code>${esc(example.replace("SLUG", "rak-sepatu-susun-4"))}</code>` };
  const { product, candidates } = await findProduct(query);
  if (!product) return { text: candidatesText(query, candidates, example) };
  return fn(product);
}

export async function bulanCommand(args: string[], actor: string): Promise<Reply> {
  const [sub = "", a1, a2, ...rest] = args;
  switch (sub.toLowerCase()) {
    case "":
    case "stok":
      if (sub.toLowerCase() === "stok" && a1 && a2 !== undefined) {
        const qty = Number(a2.replace(/\D/g, ""));
        if (!Number.isInteger(qty) || a2.replace(/\D/g, "") === "") return { text: "Jumlah stok harus angka. Contoh: <code>/bulan stok rak-sepatu-susun-4 12</code>" };
        return withProduct(a1, "/bulan stok SLUG 12", async (p) => {
          if (p.type === "ebook") return { text: `${esc(p.name)} adalah ebook, stoknya tidak dibatasi.` };
          const err = await updateProduct(p, { stock: qty }, actor, `stok ${p.stock ?? "∞"} -> ${qty}`);
          return { text: err ? `Gagal: ${esc(err)}` : `${NAME}: stok <b>${esc(p.name)}</b> sekarang ${qty} (sebelumnya ${p.stock ?? "tidak dibatasi"}).` };
        });
      }
      return stockReport();
    case "pesan":
      return toOrder();
    case "cari": {
      const q = [a1, a2, ...rest].filter(Boolean).join(" ");
      if (!q) return { text: "Contoh: <code>/bulan cari rak</code>" };
      const { product, candidates } = await findProduct(q);
      const rows = product ? [product] : candidates;
      if (!rows.length) return { text: `Tidak ada produk yang cocok dengan "${esc(q)}".` };
      return {
        text: [
          `Hasil "${esc(q)}":`,
          ...rows.map((p) => `• <code>${esc(p.slug)}</code> ${esc(p.name)} · ${rp(p.price)} · ${p.type === "ebook" ? "ebook" : `stok ${p.stock ?? "∞"}`} · ${marginText(p)}`),
        ].join("\n"),
      };
    }
    case "modal":
      return withProduct(a1, "/bulan modal SLUG 72000", async (p) => {
        const value = Number((a2 ?? "").replace(/\D/g, ""));
        if (!a2 || !Number.isInteger(value) || value <= 0) return { text: "Harga modal harus angka. Contoh: <code>/bulan modal rak-sepatu-susun-4 72000</code>" };
        const before = p.source_price;
        const err = await updateProduct(p, { source_price: value }, actor, `modal ${before ?? "-"} -> ${value}`);
        if (err) return { text: `Gagal: ${esc(err)}` };
        const m = p.price - value;
        const lines = [`${NAME}: harga modal <b>${esc(p.name)}</b> ${before != null ? `${rp(before)} → ` : ""}${rp(value)}.`, `Harga jual ${rp(p.price)} · ${marginText({ price: p.price, source_price: value })}`];
        if (m <= 0 || m / p.price < 0.1) {
          const suggestion = Math.ceil((value * 1.15) / 1000) * 1000;
          lines.push(`Saran harga jual baru (margin sekitar 15%): ${rp(suggestion)}. Ubah di ${adminUrl(`/admin/produk/${p.id}`)}`);
        }
        return { text: lines.join("\n") };
      });
    case "margin": {
      const { data } = await db().from("products").select("id, slug, name, type, price, stock, source_price, source_url, is_active").eq("type", "fisik").not("source_price", "is", null).limit(200);
      const rows = ((data ?? []) as ProductRow[]).sort((x, y) => (margin(x) ?? 0) / x.price - (margin(y) ?? 0) / y.price).slice(0, 10);
      if (!rows.length) return { text: "Belum ada produk fisik dengan harga modal. Isi dengan <code>/bulan modal SLUG HARGA</code>." };
      return { text: [`<b>${NAME}</b>: margin paling tipis`, ...rows.map((p) => `• ${esc(p.name)} <code>${esc(p.slug)}</code> · ${marginText(p)}`)].join("\n") };
    }
    case "sembunyikan":
      return withProduct(a1, "/bulan sembunyikan SLUG", async (p) => ({
        text: `Sembunyikan <b>${esc(p.name)}</b> dari toko? Produk tetap tersimpan dan bisa ditampilkan lagi.`,
        buttons: [[{ text: "Ya, sembunyikan", data: `bu:hideok:${p.id}` }, { text: "Jangan", data: "bu:no:x" }]],
      }));
    case "tampilkan":
      return withProduct(a1, "/bulan tampilkan SLUG", async (p) => {
        const err = await updateProduct(p, { is_active: true }, actor, "tampilkan");
        return { text: err ? `Gagal: ${esc(err)}` : `${NAME}: <b>${esc(p.name)}</b> tampil lagi di toko.` };
      });
    case "bantuan":
    case "help":
      return { text: bulanHelp };
    default:
      return { text: `${NAME} belum paham perintah "${esc(sub)}".\n\n${bulanHelp}` };
  }
}

export async function bulanCallback(action: string, arg: string, actor: string): Promise<Reply> {
  if (action === "no") return { text: "Oke, tidak ada yang diubah." };
  if (action === "ordered") {
    const order = await findOrder(normCode(arg));
    if (!order) return { text: "Pesanan tidak ditemukan." };
    if (order.status !== "dibayar") return { text: `${esc(order.code)} sudah berstatus ${esc(statusLabels[order.status])}.` };
    const { error } = await db().from("orders").update({ status: "diproses" }).eq("id", order.id);
    if (error) return { text: `Gagal: ${esc(error.message)}` };
    await logAction("bulan", actor, `${order.code} -> diproses`, "sudah dipesan ke marketplace");
    return { text: `${NAME}: <b>${esc(order.code)}</b> sudah dipesan, status jadi Diproses. Setelah dapat resi: <code>/akbar kirim ${esc(order.code)} RESI</code>` };
  }
  if (action === "hide" || action === "hideok") {
    if (!/^[0-9a-f-]{36}$/i.test(arg)) return { text: "Tombol ini sudah tidak berlaku." };
    const { data: p } = await db().from("products").select("id, slug, name, type, price, stock, source_price, source_url, is_active").eq("id", arg).maybeSingle<ProductRow>();
    if (!p) return { text: "Produk tidak ditemukan." };
    if (action === "hide") {
      return {
        text: `Sembunyikan <b>${esc(p.name)}</b> dari toko?`,
        buttons: [[{ text: "Ya, sembunyikan", data: `bu:hideok:${p.id}` }, { text: "Jangan", data: "bu:no:x" }]],
      };
    }
    const err = await updateProduct(p, { is_active: false }, actor, "sembunyikan");
    return { text: err ? `Gagal: ${esc(err)}` : `${NAME}: <b>${esc(p.name)}</b> disembunyikan dari toko. Tampilkan lagi: <code>/bulan tampilkan ${esc(p.slug)}</code>` };
  }
  return { text: "Tombol ini sudah tidak berlaku." };
}

/** Bagian laporan pagi dari Bulan. */
export async function bulanMorning(): Promise<Reply | null> {
  const report = await stockReport();
  return report.text.includes("Tidak ada barang") ? null : report;
}
