import { Suspense } from "react";
import { BlockSkeleton } from "@/components/Skeleton";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Category } from "@/lib/types";
import { CategoryForm } from "./CategoryForm";

export const metadata = { title: "Kategori | Admin" };

async function Categories({ searchParams }: { searchParams: PageProps<"/admin/kategori">["searchParams"] }) {
  await requireAdmin();
  const sp = await searchParams;
  const supabase = createAdminClient();
  const [{ data, error }, { data: products }] = await Promise.all([
    supabase.from("categories").select("*").order("sort"),
    supabase.from("products").select("category_id"),
  ]);
  if (error) throw new Error(`Gagal memuat kategori: ${error.message}`);
  const categories = (data ?? []) as Category[];
  const counts = new Map<string, number>();
  for (const p of products ?? []) if (p.category_id) counts.set(p.category_id, (counts.get(p.category_id) ?? 0) + 1);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-extrabold">Kategori</h1>
        <p className="text-sm text-muted">Urutan kecil tampil lebih dulu di toko. Slug jadi alamat halaman: /kategori/slug.</p>
      </div>
      {sp.dihapus === "1" && <p role="status" className="rounded-xl bg-[#E3F6EE] px-4 py-3 text-sm font-semibold text-ok">Kategori dihapus.</p>}
      <section aria-labelledby="baru-title" className="flex flex-col gap-2">
        <h2 id="baru-title" className="font-bold">Tambah kategori</h2>
        <CategoryForm />
      </section>
      <section aria-labelledby="daftar-title" className="flex flex-col gap-2">
        <h2 id="daftar-title" className="font-bold">Kategori yang ada ({categories.length})</h2>
        {categories.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-field bg-white p-6 text-sm text-muted">Belum ada kategori. Tambahkan lewat form di atas.</p>
        ) : (
          categories.map((c) => <CategoryForm key={`${c.id}-${c.name}-${c.slug}-${c.icon}-${c.sort}`} category={c} productCount={counts.get(c.id) ?? 0} />)
        )}
      </section>
    </div>
  );
}

export default function CategoriesPage(props: PageProps<"/admin/kategori">) {
  return (
    <Suspense fallback={<BlockSkeleton />}>
      <Categories searchParams={props.searchParams} />
    </Suspense>
  );
}
