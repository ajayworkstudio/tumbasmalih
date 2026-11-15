import type { MetadataRoute } from "next";
import { getCategories, getProducts } from "@/lib/data";
import { site } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [categories, products] = await Promise.all([getCategories(), getProducts()]);
  return [
    { url: site.url, changeFrequency: "daily", priority: 1 },
    { url: `${site.url}/cari`, changeFrequency: "daily", priority: 0.6 },
    { url: `${site.url}/cara-belanja`, changeFrequency: "monthly", priority: 0.3 },
    ...categories.map((c) => ({ url: `${site.url}/kategori/${c.slug}`, changeFrequency: "weekly" as const, priority: 0.8 })),
    ...products.map((p) => ({ url: `${site.url}/produk/${p.slug}`, changeFrequency: "weekly" as const, priority: 0.7 })),
  ];
}
