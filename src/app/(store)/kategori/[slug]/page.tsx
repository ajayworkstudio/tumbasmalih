import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { CategoryTiles } from "@/components/CategoryTiles";
import { ProductGrid } from "@/components/ProductCard";
import { GridSkeleton } from "@/components/Skeleton";
import { getCategories, getCategoryBySlug, getProducts } from "@/lib/data";

export async function generateMetadata({ params }: PageProps<"/kategori/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) return { title: "Kategori tidak ditemukan" };
  return {
    title: `${category.name} pilihan`,
    description: `Belanja ${category.name.toLowerCase()} pilihan yang sudah dikurasi tumbasmalih. Bayar QRIS, transfer, atau COD.`,
    alternates: { canonical: `/kategori/${category.slug}` },
  };
}

async function CategoryContent({ params }: { params: PageProps<"/kategori/[slug]">["params"] }) {
  const { slug } = await params;
  const [categories, category] = await Promise.all([getCategories(), getCategoryBySlug(slug)]);
  if (!category) notFound();
  const products = await getProducts({ categoryId: category.id });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-extrabold md:text-3xl">{category.name}</h1>
        <p className="text-sm text-muted">{products.length} produk pilihan</p>
      </div>
      <CategoryTiles categories={categories} activeSlug={category.slug} />
      <ProductGrid products={products} />
    </div>
  );
}

export default function CategoryPage(props: PageProps<"/kategori/[slug]">) {
  return (
    <Suspense fallback={<GridSkeleton />}>
      <CategoryContent params={props.params} />
    </Suspense>
  );
}
