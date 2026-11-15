"use client";
import { startTransition, useActionState } from "react";
import type { Category } from "@/lib/types";
import { deleteCategory, saveCategory, type FormState } from "../../actions";

const icons = [
  ["book", "Buku"],
  ["home", "Rumah"],
  ["key", "Kunci"],
  ["phone", "HP"],
  ["shirt", "Baju"],
  ["gift", "Kado"],
  ["bag", "Tas belanja"],
] as const;

const field = "h-11 w-full rounded-lg border border-field bg-white px-3 text-sm";

export function CategoryForm({ category, productCount = 0 }: { category?: Category; productCount?: number }) {
  const [state, action, pending] = useActionState<FormState, FormData>(saveCategory, {});
  const isNew = !category;

  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-line bg-white p-4">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const data = new FormData(e.currentTarget);
          startTransition(() => action(data));
          if (isNew) e.currentTarget.reset();
        }}
        className="grid gap-3 sm:grid-cols-[1.4fr_1fr_1fr_90px_auto] sm:items-end"
      >
        {category && <input type="hidden" name="id" value={category.id} />}
        <label className="flex flex-col gap-1 text-xs font-semibold">
          Nama
          <input name="name" required defaultValue={category?.name} className={field} />
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold">
          Slug
          <input name="slug" defaultValue={category?.slug} placeholder="otomatis" className={field} />
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold">
          Ikon
          <select name="icon" defaultValue={category?.icon ?? "bag"} className={field}>
            {icons.map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold">
          Urutan
          <input name="sort" inputMode="numeric" defaultValue={category?.sort ?? 0} className={field} />
        </label>
        <button type="submit" disabled={pending} className="h-11 rounded-xl bg-brand px-4 text-sm font-bold text-white hover:bg-brand-dark disabled:opacity-60">
          {pending ? "Menyimpan…" : isNew ? "Tambah" : "Simpan"}
        </button>
      </form>
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <span role="status" className={state.error ? "font-medium text-danger" : "text-muted"}>
          {state.error ?? (state.ok ? "Tersimpan." : category ? `${productCount} produk di kategori ini.` : "")}
        </span>
        {category && (
          <form
            action={deleteCategory}
            onSubmit={(e) => {
              const msg = productCount
                ? `Hapus kategori "${category.name}"? ${productCount} produk di dalamnya akan jadi tanpa kategori.`
                : `Hapus kategori "${category.name}"?`;
              if (!window.confirm(msg)) e.preventDefault();
            }}
          >
            <input type="hidden" name="id" value={category.id} />
            <button type="submit" className="h-11 rounded-lg px-3 text-sm font-semibold text-danger hover:bg-[#FDECEC]">
              Hapus
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
