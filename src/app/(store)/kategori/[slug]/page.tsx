import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { CategoryTiles } from "@/components/CategoryTiles";
import Link from "next/link";
import { ProductGrid } from "@/components/ProductCard";
import { GridSkeleton } from "@/components/Skeleton";
import { getCategories, getCategoryBySlug, getProducts } from "@/lib/data";

export async function generateMetadata({ params }: PageProps<"/kategori/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) return { title: "Kategori tidak ditemukan" };
  return {
    title: category.name,
    description: `${category.name} pilihan di tumbasmalih. Bayar pakai QRIS, transfer bank, atau COD untuk barang fisik.`,
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
        <p className="text-sm text-muted">{products.length} produk</p>
      </div>
      <CategoryTiles categories={categories} activeSlug={category.slug} />
      <ProductGrid
        products={products}
        heading="h2"
        empty={
          <>
            <p>Belum ada produk di kategori {category.name}.</p>
            <Link href="/cari" className="flex min-h-11 items-center font-bold text-brand hover:underline">
              Lihat semua produk
            </Link>
          </>
        }
      />
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
