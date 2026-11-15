import Link from "next/link";
import { Suspense } from "react";
import { BlockSkeleton } from "@/components/Skeleton";
import { requireAdmin } from "@/lib/auth";
import { formatRupiah } from "@/lib/format";
import { createAdminClient } from "@/lib/supabase/admin";
import type { AdminProduct } from "@/lib/types";

async function ProductList({ searchParams }: { searchParams: PageProps<"/admin/produk">["searchParams"] }) {
  await requireAdmin();
  const sp = await searchParams;
  const { data } = await createAdminClient()
    .from("products")
    .select("id, slug, name, type, price, source_price, stock, is_active, is_featured")
    .order("created_at", { ascending: false });
  const products = (data ?? []) as Pick<AdminProduct, "id" | "slug" | "name" | "type" | "price" | "source_price" | "stock" | "is_active" | "is_featured">[];

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-extrabold">Produk</h1>
        <Link href="/admin/produk/baru" className="flex h-10 items-center rounded-xl bg-brand px-4 text-sm font-bold text-white hover:bg-brand-dark">
          + Tambah produk
        </Link>
      </div>
      {sp.disimpan === "1" && <p role="status" className="rounded-xl bg-[#E3F6EE] px-4 py-3 text-sm font-semibold text-ok">Produk disimpan.</p>}
      <div className="overflow-x-auto rounded-2xl border border-line bg-white">
        <table className="w-full min-w-180 text-left text-sm">
          <thead className="border-b border-line text-xs text-muted">
            <tr>
              <th className="px-4 py-3 font-semibold">Nama</th>
              <th className="px-4 py-3 font-semibold">Jenis</th>
              <th className="px-4 py-3 text-right font-semibold">Harga jual</th>
              <th className="px-4 py-3 text-right font-semibold">Modal</th>
              <th className="px-4 py-3 text-right font-semibold">Stok</th>
              <th className="px-4 py-3 font-semibold">Tampil</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="border-b border-line last:border-0 hover:bg-ground">
                <td className="px-4 py-3">
                  <Link href={`/admin/produk/${p.id}`} className="font-semibold text-brand hover:underline">{p.name}</Link>
                  {p.is_featured && <span className="ml-2 rounded-full bg-accent px-2 py-0.5 text-[11px] font-bold">Kurasi</span>}
                </td>
                <td className="px-4 py-3">{p.type === "ebook" ? "Ebook" : "Fisik"}</td>
                <td className="px-4 py-3 text-right">{formatRupiah(p.price)}</td>
                <td className="px-4 py-3 text-right text-muted">{p.source_price != null ? formatRupiah(p.source_price) : "–"}</td>
                <td className="px-4 py-3 text-right">{p.type === "ebook" ? "–" : p.stock ?? "∞"}</td>
                <td className="px-4 py-3">{p.is_active ? "Ya" : <span className="text-danger">Disembunyikan</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {products.length === 0 && <p className="p-8 text-center text-sm text-muted">Belum ada produk.</p>}
      </div>
    </div>
  );
}

export default function AdminProductsPage(props: PageProps<"/admin/produk">) {
  return (
    <Suspense fallback={<BlockSkeleton />}>
      <ProductList searchParams={props.searchParams} />
    </Suspense>
  );
}
