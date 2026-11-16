import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { createPublicClient } from "./supabase/public";
import { hasSupabaseEnv } from "./supabase/env";
import type { Category, Product, ProductDetail } from "./types";

/** Kolom publik produk. Harus sama dengan GRANT di supabase/schema.sql. */
export const PUBLIC_PRODUCT_COLUMNS =
  "id, slug, name, description, type, category_id, price, compare_price, image_url, stock, is_featured";

export async function getCategories(): Promise<Category[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag("catalog");
  if (!hasSupabaseEnv()) return [];
  const { data, error } = await createPublicClient()
    .from("categories")
    .select("id, slug, name, icon, sort")
    .order("sort", { ascending: true });
  if (error) throw new Error(`Gagal memuat kategori: ${error.message}`);
  return data ?? [];
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const categories = await getCategories();
  return categories.find((c) => c.slug === slug) ?? null;
}

type ProductQuery = {
  categoryId?: string;
  featured?: boolean;
  type?: "ebook" | "fisik";
  search?: string;
  limit?: number;
};

export async function getProducts(query: ProductQuery = {}): Promise<Product[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag("catalog");
  if (!hasSupabaseEnv()) return [];

  let q = createPublicClient()
    .from("products")
    .select(PUBLIC_PRODUCT_COLUMNS)
    .eq("is_active", true)
    .order("is_featured", { ascending: false })
    .order("created_at", { ascending: false });

  if (query.categoryId) q = q.eq("category_id", query.categoryId);
  if (query.featured) q = q.eq("is_featured", true);
  if (query.type) q = q.eq("type", query.type);
  if (query.search) {
    // Buang karakter yang punya arti khusus di filter PostgREST.
    const term = query.search.replace(/[%,()*]/g, " ").trim();
    if (term) q = q.ilike("name", `%${term}%`);
  }
  if (query.limit) q = q.limit(query.limit);

  const { data, error } = await q;
  if (error) throw new Error(`Gagal memuat produk: ${error.message}`);
  return (data ?? []) as Product[];
}

export async function getProductBySlug(slug: string): Promise<ProductDetail | null> {
  "use cache";
  cacheLife("minutes");
  cacheTag("catalog");
  if (!hasSupabaseEnv()) return null;
  const query = (columns: string) =>
    createPublicClient().from("products").select(columns).eq("is_active", true).eq("slug", slug).maybeSingle();

  let { data, error } = await query(`${PUBLIC_PRODUCT_COLUMNS}, images`);
  // Database yang belum menjalankan migrasi galeri belum punya kolom images: tetap tampil dengan foto sampul.
  if (error?.code === "42703") ({ data, error } = await query(PUBLIC_PRODUCT_COLUMNS));
  if (error) throw new Error(`Gagal memuat produk: ${error.message}`);
  if (!data) return null;
  const p = data as unknown as Product & { images?: string[] | null };
  const images = p.images?.length ? p.images : p.image_url ? [p.image_url] : [];
  return { ...p, images };
}
