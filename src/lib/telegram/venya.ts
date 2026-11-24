import "server-only";
import { getSettings } from "@/lib/settings";
import { site } from "@/lib/site";
import { esc, type Reply } from "./api";
import { logAction } from "./log";
import { PAID, candidatesText, db, findProduct, rp, type ProductRow } from "./shared";

const NAME = "Venya (Marketing)";

export const venyaHelp = [
  `<b>${NAME}</b>, menyiapkan konten dan membaca penjualan.`,
  "<code>/venya laris</code> produk terlaris 30 hari terakhir",
  "<code>/venya caption SLUG</code> caption IG/TikTok + 3 hook",
  "<code>/venya iklan SLUG</code> 3 variasi teks iklan Meta",
  "<code>/venya ide</code> ide konten minggu ini",
  "<code>/venya PERTANYAAN</code> tanya bebas soal pemasaran toko",
  "Venya hanya membuat draf. Posting dan iklan tetap kamu yang jalankan.",
].join("\n");

const aiReady = () => Boolean(process.env.ANTHROPIC_API_KEY);

const RULES = `Kamu Venya, staf marketing toko online ${site.name} (${site.url}). "Tumbas malih" artinya "beli lagi" dalam bahasa Jawa.
Toko ini menjual barang pilihan dan ebook. Pembeli bisa bayar QRIS, transfer bank, atau COD untuk barang fisik. Admin membalas lewat WhatsApp.
Aturan menulis:
- Bahasa Indonesia santai, sapaan "kamu", boleh satu kata Jawa ringan.
- Hanya pakai fakta yang diberikan. Jangan mengarang diskon, promo, testimoni, jumlah terjual, rating, atau klaim "termurah/hemat".
- Jangan pakai em dash. Jangan pakai emoji berlebihan (maksimal satu per caption).
- Ajakan bertindak spesifik, misalnya "cek di ${site.url.replace(/^https?:\/\//, "")}".
- Jawab ringkas, siap salin. Format teks biasa tanpa markdown.`;

async function ask(prompt: string): Promise<string> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY ?? "",
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_MODEL || "claude-haiku-5-5",
      max_tokens: 900,
      system: RULES,
      messages: [{ role: "user", content: prompt }],
    }),
    cache: "no-store",
  });
  const json = (await res.json()) as { content?: { type: string; text?: string }[]; error?: { message: string } };
  if (!res.ok) throw new Error(json.error?.message ?? `HTTP ${res.status}`);
  return (json.content ?? []).filter((c) => c.type === "text").map((c) => c.text ?? "").join("\n").trim();
}

function productFacts(p: ProductRow & { description?: string }): string {
  return [
    `Nama: ${p.name}`,
    `Jenis: ${p.type === "ebook" ? "ebook (file digital, diunduh setelah bayar)" : "barang fisik (bisa COD)"}`,
    `Harga: ${rp(p.price)}`,
    p.type === "fisik" && p.stock !== null ? `Stok: ${p.stock}` : "",
    `Deskripsi dari pemilik: ${p.description || "(kosong)"}`,
    `Link: ${site.url}/produk/${p.slug}`,
  ]
    .filter(Boolean)
    .join("\n");
}

async function withAi(task: string, prompt: string, fallback: string, actor: string): Promise<Reply> {
  if (!aiReady()) {
    return { text: `${fallback}\n\n<i>Venya belum tersambung ke AI. Isi env ANTHROPIC_API_KEY di Vercel supaya draf ditulis otomatis.</i>` };
  }
  try {
    const out = await ask(prompt);
    await logAction("venya", actor, task, out.slice(0, 200));
    return { text: `<b>${NAME}</b>: draf ${esc(task)}\n\n${esc(out)}\n\n<i>Periksa dulu sebelum dipakai.</i>` };
  } catch (e) {
    return { text: `${NAME} gagal menghubungi AI: ${esc(e instanceof Error ? e.message : String(e))}\n\n${fallback}` };
  }
}

async function bestSellers(days = 30): Promise<{ name: string; slug: string; qty: number; omzet: number }[]> {
  const since = new Date(Date.now() - days * 86400_000).toISOString();
  const supabase = db();
  const { data: orders } = await supabase.from("orders").select("id").in("status", PAID).gte("paid_at", since).limit(500);
  const ids = (orders ?? []).map((o) => o.id as string);
  if (!ids.length) return [];
  const { data: items } = await supabase.from("order_items").select("name, qty, line_total, products(slug)").in("order_id", ids);
  const map = new Map<string, { name: string; slug: string; qty: number; omzet: number }>();
  for (const it of (items ?? []) as unknown as { name: string; qty: number; line_total: number; products: { slug: string } | null }[]) {
    const key = it.products?.slug ?? it.name;
    const row = map.get(key) ?? { name: it.name, slug: it.products?.slug ?? "-", qty: 0, omzet: 0 };
    row.qty += it.qty;
    row.omzet += it.line_total;
    map.set(key, row);
  }
  return [...map.values()].sort((a, b) => b.qty - a.qty).slice(0, 10);
}

async function getProductWithDescription(query: string) {
  const { product, candidates } = await findProduct(query);
  if (!product) return { candidates };
  const { data } = await db().from("products").select("description").eq("id", product.id).maybeSingle();
  return { product: { ...product, description: (data?.description as string) ?? "" }, candidates };
}

export async function venyaCommand(args: string[], actor: string): Promise<Reply> {
  const [sub = "", ...rest] = args;
  const lower = sub.toLowerCase();

  if (lower === "" || lower === "bantuan" || lower === "help") return { text: venyaHelp };

  if (lower === "laris") {
    const rows = await bestSellers();
    if (!rows.length) return { text: `${NAME}: belum ada pesanan dibayar dalam 30 hari terakhir.` };
    return {
      text: [`<b>${NAME}</b>: terlaris 30 hari terakhir`, ...rows.map((r, i) => `${i + 1}. ${esc(r.name)} · ${r.qty} terjual · ${rp(r.omzet)}`), "", "Buat caption: <code>/venya caption SLUG</code>"].join("\n"),
    };
  }

  if (lower === "caption" || lower === "iklan") {
    const query = rest.join(" ");
    const example = `/venya ${lower} SLUG`;
    if (!query) return { text: `Sebutkan produknya. Contoh: <code>/venya ${lower} rice-cooker-mini</code>` };
    const { product, candidates } = await getProductWithDescription(query);
    if (!product) return { text: candidatesText(query, candidates, example) };
    const facts = productFacts(product);
    if (lower === "caption") {
      const fallback = `<b>Template caption</b>\n${esc(product.name)}, ${rp(product.price)}.\n${esc(product.description || "[TULIS MANFAAT UTAMA]")}\n${product.type === "fisik" ? "Bisa COD." : "Bayar, langsung unduh dari halaman pesanan."}\nCek di ${esc(site.url)}/produk/${esc(product.slug)}`;
      return withAi(
        `caption ${product.slug}`,
        `Buat 1 caption Instagram (maksimal 90 kata) dan 3 pilihan hook pembuka video TikTok/Reels (maksimal 12 kata masing-masing), plus 5 hashtag relevan. Data produk:\n${facts}`,
        fallback,
        actor,
      );
    }
    const fallback = `<b>Template iklan</b>\nJudul: ${esc(product.name)}\nTeks: ${esc(product.description || "[TULIS MANFAAT UTAMA]")} ${rp(product.price)}. ${product.type === "fisik" ? "Bisa COD." : ""}`;
    return withAi(
      `iklan ${product.slug}`,
      `Buat 3 variasi teks iklan Meta (Facebook/Instagram). Tiap variasi: teks utama maksimal 40 kata, judul maksimal 6 kata, dan saran tombol (Belanja Sekarang/Pelajari Selengkapnya). Sudut pandang berbeda tiap variasi (masalah yang diselesaikan, cara pakai, kemudahan bayar). Data produk:\n${facts}`,
      fallback,
      actor,
    );
  }

  if (lower === "ide") {
    const [rows, { data: fresh }, settings] = await Promise.all([
      bestSellers(),
      db().from("products").select("name, type, price").eq("is_active", true).order("created_at", { ascending: false }).limit(5),
      getSettings().catch(() => null),
    ]);
    const context = [
      `Terlaris 30 hari: ${rows.map((r) => `${r.name} (${r.qty})`).join(", ") || "belum ada data"}`,
      `Produk terbaru: ${(fresh ?? []).map((p) => `${p.name} ${rp(p.price as number)}`).join(", ") || "belum ada"}`,
      `Estimasi kirim: ${settings?.policyShipping || "belum diisi"}`,
    ].join("\n");
    return withAi(
      "ide konten minggu ini",
      `Susun rencana 5 konten untuk minggu ini (Senin sampai Jumat) untuk Instagram dan TikTok. Tiap hari: format (reels/carousel/story), judul, dan 1 kalimat isi. Gunakan data ini:\n${context}`,
      `<b>Ide dasar</b>\n1. Reels unboxing produk terlaris\n2. Carousel cara belanja tanpa akun marketplace\n3. Story tanya jawab soal COD\n4. Reels "isi meja anak kos"\n5. Carousel ebook: 3 hal yang dipelajari`,
      actor,
    );
  }

  const question = [sub, ...rest].join(" ");
  return withAi(
    "jawaban",
    `Pemilik toko bertanya: "${question}". Jawab sebagai staf marketing, praktis dan spesifik untuk toko ini.`,
    `${NAME} belum paham "${esc(question)}".\n\n${venyaHelp}`,
    actor,
  );
}
