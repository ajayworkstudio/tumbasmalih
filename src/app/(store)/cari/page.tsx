import type { Metadata } from "next";
import { Suspense } from "react";
import { ProductGrid } from "@/components/ProductCard";
import { SearchForm } from "@/components/SiteHeader";
import { GridSkeleton } from "@/components/Skeleton";
import { getProducts } from "@/lib/data";

export const metadata: Metadata = {
  title: "Semua produk",
  alternates: { canonical: "/cari" },
};

async function Results({ searchParams }: { searchParams: PageProps<"/cari">["searchParams"] }) {
  const sp = await searchParams;
  const q = (typeof sp.q === "string" ? sp.q : "").slice(0, 80).trim();
  const products = await getProducts({ search: q || undefined });
  return (
    <div className="flex flex-col gap-5">
      <SearchForm defaultValue={q} className="md:hidden" />
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-extrabold md:text-3xl">{q ? `Hasil untuk “${q}”` : "Semua produk"}</h1>
        <p className="text-sm text-muted">{products.length} produk</p>
      </div>
      <ProductGrid products={products} />
    </div>
  );
}

export default function SearchPage(props: PageProps<"/cari">) {
  return (
    <Suspense fallback={<GridSkeleton />}>
      <Results searchParams={props.searchParams} />
    </Suspense>
  );
}
