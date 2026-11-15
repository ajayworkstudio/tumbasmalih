"use server";

import { randomUUID } from "node:crypto";
import { updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { normalizePhone, slugify } from "@/lib/format";
import { statusOrder } from "@/lib/site";
import { createAdminClient } from "@/lib/supabase/admin";
import { createSessionClient } from "@/lib/supabase/server";
import type { OrderStatus } from "@/lib/types";

export async function signOut() {
  const supabase = await createSessionClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}

function text(fd: FormData, key: string, max = 2000): string {
  const v = fd.get(key);
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}

function intOrNull(fd: FormData, key: string): number | null | "invalid" {
  const raw = text(fd, key, 20).replace(/[.\s]/g, "");
  if (!raw) return null;
  const n = Number(raw);
  return Number.isInteger(n) && n >= 0 ? n : "invalid";
}


export async function updateOrder(formData: FormData) {
  await requireAdmin();
  const id = text(formData, "id", 40);
  const status = text(formData, "status", 30) as OrderStatus;
  const tracking = text(formData, "tracking_number", 60);
  if (!id || !statusOrder.includes(status)) return;

  const supabase = createAdminClient();
  const { data: current } = await supabase.from("orders").select("paid_at").eq("id", id).maybeSingle();
  const becamePaid = ["dibayar", "diproses", "dikirim", "selesai"].includes(status) && !current?.paid_at;

  const { error } = await supabase
    .from("orders")
    .update({
      status,
      tracking_number: tracking || null,
      ...(becamePaid ? { paid_at: new Date().toISOString() } : {}),
    })
    .eq("id", id);
  if (error) console.error("updateOrder:", error.message);
  redirect(`/admin/pesanan/${id}?disimpan=1`);
}


export type ProductFormState = { error?: string; values?: Record<string, string> };

export async function saveProduct(_prev: ProductFormState, formData: FormData): Promise<ProductFormState> {
  await requireAdmin();
  const values = Object.fromEntries(
    [...formData.entries()].filter(([k, v]) => typeof v === "string" && !k.startsWith("$")),
  ) as Record<string, string>;

  const id = text(formData, "id", 40);
  const name = text(formData, "name", 150);
  const slug = slugify(text(formData, "slug", 100) || name);
  const type = text(formData, "type", 10);
  const price = intOrNull(formData, "price");
  const comparePrice = intOrNull(formData, "compare_price");
  const stock = intOrNull(formData, "stock");
  const sourcePrice = intOrNull(formData, "source_price");
  const categoryId = text(formData, "category_id", 40) || null;

  if (name.length < 3) return { error: "Nama produk minimal 3 karakter.", values };
  if (!slug) return { error: "Slug tidak valid.", values };
  if (type !== "ebook" && type !== "fisik") return { error: "Pilih jenis produk.", values };
  if (price === null || price === "invalid") return { error: "Harga jual wajib angka bulat (contoh: 29000).", values };
  if (comparePrice === "invalid" || stock === "invalid" || sourcePrice === "invalid") {
    return { error: "Harga coret, stok, dan harga modal harus angka bulat atau dikosongkan.", values };
  }

  const row = {
    name,
    slug,
    type,
    price,
    compare_price: comparePrice,
    stock: type === "ebook" ? null : stock,
    category_id: categoryId,
    description: text(formData, "description", 5000),
    image_url: text(formData, "image_url", 500) || null,
    file_path: type === "ebook" ? text(formData, "file_path", 300) || null : null,
    source_url: text(formData, "source_url", 500) || null,
    source_price: sourcePrice,
    is_active: formData.get("is_active") === "on",
    is_featured: formData.get("is_featured") === "on",
  };

  const supabase = createAdminClient();
  const { error } = id
    ? await supabase.from("products").update(row).eq("id", id)
    : await supabase.from("products").insert(row);

  if (error) {
    if (error.code === "23505") return { error: `Slug "${slug}" sudah dipakai produk lain. Ganti slug-nya.`, values };
    console.error("saveProduct:", error.message);
    return { error: "Gagal menyimpan produk.", values };
  }

  updateTag("catalog");
  redirect("/admin/produk?disimpan=1");
}

export type FormState = { error?: string; ok?: boolean };

export async function saveSettings(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const whatsappRaw = text(formData, "whatsapp", 30);
  const whatsapp = normalizePhone(whatsappRaw);
  if (whatsappRaw && !whatsapp) return { error: "Nomor WhatsApp tidak valid. Contoh: 081234567890." };

  const shipping = intOrNull(formData, "shipping_flat");
  if (shipping === null || shipping === "invalid") return { error: "Ongkir flat wajib angka bulat (contoh: 15000)." };

  const banks = [0, 1, 2]
    .map((i) => ({
      bank: text(formData, `bank_${i}`, 40),
      number: text(formData, `number_${i}`, 40),
      holder: text(formData, `holder_${i}`, 80),
    }))
    .filter((b) => b.bank || b.number || b.holder);
  if (banks.some((b) => !b.bank || !b.number || !b.holder)) {
    return { error: "Setiap rekening perlu nama bank, nomor, dan nama pemilik. Kosongkan baris yang tidak dipakai." };
  }

  const { error } = await createAdminClient()
    .from("settings")
    .upsert({
      id: 1,
      whatsapp: whatsapp ?? "",
      bank_accounts: banks,
      qris_image_url: text(formData, "qris_image_url", 500),
      shipping_flat: shipping,
      policy_shipping: text(formData, "policy_shipping", 500),
      policy_returns: text(formData, "policy_returns", 1500),
      policy_ebook: text(formData, "policy_ebook", 1000),
    });
  if (error) {
    console.error("saveSettings:", error.message);
    return { error: "Gagal menyimpan pengaturan." };
  }
  updateTag("settings");
  return { ok: true };
}

const CATEGORY_ICONS = ["book", "home", "key", "phone", "shirt", "gift", "bag"];

export async function saveCategory(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const id = text(formData, "id", 40);
  const name = text(formData, "name", 60);
  const slug = slugify(text(formData, "slug", 60) || name);
  const icon = text(formData, "icon", 20);
  const sort = intOrNull(formData, "sort");
  if (name.length < 2) return { error: "Nama kategori minimal 2 karakter." };
  if (!slug) return { error: "Slug tidak valid." };
  if (!CATEGORY_ICONS.includes(icon)) return { error: "Pilih ikon dari daftar." };
  if (sort === "invalid") return { error: "Urutan harus angka bulat." };

  const supabase = createAdminClient();
  const row = { name, slug, icon, sort: sort ?? 0 };
  const { error } = id
    ? await supabase.from("categories").update(row).eq("id", id)
    : await supabase.from("categories").insert(row);
  if (error) {
    if (error.code === "23505") return { error: `Slug "${slug}" sudah dipakai kategori lain.` };
    console.error("saveCategory:", error.message);
    return { error: "Gagal menyimpan kategori." };
  }
  updateTag("catalog");
  return { ok: true };
}

export async function deleteCategory(formData: FormData) {
  await requireAdmin();
  const id = text(formData, "id", 40);
  if (!/^[0-9a-f-]{36}$/i.test(id)) return;
  const { error } = await createAdminClient().from("categories").delete().eq("id", id);
  if (error) console.error("deleteCategory:", error.message);
  updateTag("catalog");
  redirect("/admin/kategori?dihapus=1");
}

const UPLOAD_RULES = {
  produk: { exts: ["jpg", "jpeg", "png", "webp"], label: "gambar JPG, PNG, atau WEBP" },
  ebooks: { exts: ["pdf", "epub"], label: "file PDF atau EPUB" },
} as const;

export type UploadTicket = { error?: string; path?: string; token?: string; publicUrl?: string };

/**
 * Membuat link upload sekali pakai ke Supabase Storage. File dikirim langsung dari browser
 * ke Storage, jadi ukuran file tidak dibatasi batas body server action atau Vercel.
 */
export async function createUploadTicket(bucket: "produk" | "ebooks", fileName: string): Promise<UploadTicket> {
  await requireAdmin();
  const rule = UPLOAD_RULES[bucket];
  if (!rule) return { error: "Bucket tidak dikenal." };
  const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
  if (!(rule.exts as readonly string[]).includes(ext)) return { error: `Pilih ${rule.label}.` };

  const base = slugify(fileName.replace(/\.[^.]+$/, "")) || "file";
  const path = `${new Date().toISOString().slice(0, 10)}/${base}-${randomUUID().slice(0, 8)}.${ext}`;
  const storage = createAdminClient().storage.from(bucket);
  const { data, error } = await storage.createSignedUploadUrl(path);
  if (error || !data) {
    console.error("createUploadTicket:", error?.message);
    return { error: "Gagal menyiapkan upload. Pastikan bucket sudah dibuat dari schema.sql." };
  }
  return {
    path: data.path,
    token: data.token,
    publicUrl: bucket === "produk" ? storage.getPublicUrl(data.path).data.publicUrl : undefined,
  };
}
