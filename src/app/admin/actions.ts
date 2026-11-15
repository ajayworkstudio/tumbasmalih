"use server";

import { updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { slugify } from "@/lib/format";
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
