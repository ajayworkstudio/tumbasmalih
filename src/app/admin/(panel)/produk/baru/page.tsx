import Link from "next/link";
import { Suspense } from "react";
import { BlockSkeleton } from "@/components/Skeleton";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Category } from "@/lib/types";
import { ProductForm } from "../ProductForm";

export const metadata = { title: "Tambah produk | Admin" };

async function NewProduct() {
  await requireAdmin();
  const { data } = await createAdminClient().from("categories").select("*").order("sort");
  return (
    <div className="flex flex-col gap-5">
      <Link href="/admin/produk" className="inline-flex min-h-11 items-center text-sm font-semibold text-brand hover:underline">Semua produk</Link>
      <h1 className="text-2xl font-extrabold">Tambah produk</h1>
      <ProductForm categories={(data ?? []) as Category[]} />
    </div>
  );
}

export default function NewProductPage() {
  return (
    <Suspense fallback={<BlockSkeleton />}>
      <NewProduct />
    </Suspense>
  );
}
