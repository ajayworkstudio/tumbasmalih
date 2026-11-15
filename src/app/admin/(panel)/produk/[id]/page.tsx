import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { BlockSkeleton } from "@/components/Skeleton";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import type { AdminProduct, Category } from "@/lib/types";
import { ProductForm } from "../ProductForm";

async function EditProduct({ params }: { params: PageProps<"/admin/produk/[id]">["params"] }) {
  await requireAdmin();
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const supabase = createAdminClient();
  const [{ data: product }, { data: categories }] = await Promise.all([
    supabase.from("products").select("*").eq("id", id).maybeSingle<AdminProduct>(),
    supabase.from("categories").select("*").order("sort"),
  ]);
  if (!product) notFound();
  return (
    <div className="flex flex-col gap-5">
      <Link href="/admin/produk" className="text-sm font-semibold text-brand hover:underline">← Semua produk</Link>
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-extrabold">Edit produk</h1>
        <Link href={`/produk/${product.slug}`} target="_blank" className="text-sm font-semibold text-brand hover:underline">Lihat di toko ↗</Link>
      </div>
      <ProductForm product={product} categories={(categories ?? []) as Category[]} />
    </div>
  );
}

export default function EditProductPage(props: PageProps<"/admin/produk/[id]">) {
  return (
    <Suspense fallback={<BlockSkeleton />}>
      <EditProduct params={props.params} />
    </Suspense>
  );
}
