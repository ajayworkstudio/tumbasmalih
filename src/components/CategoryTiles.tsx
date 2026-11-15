import Link from "next/link";
import type { Category } from "@/lib/types";
import { Icon, isIconName } from "./Icon";

export function CategoryTiles({ categories, activeSlug }: { categories: Category[]; activeSlug?: string }) {
  if (categories.length === 0) return null;
  return (
    <div className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5 md:mx-0 md:grid md:grid-cols-[repeat(auto-fill,minmax(150px,1fr))] md:gap-3.5 md:overflow-visible md:px-0">
      {categories.map((c) => {
        const active = c.slug === activeSlug;
        return (
          <Link
            key={c.id}
            href={`/kategori/${c.slug}`}
            aria-current={active ? "page" : undefined}
            className={`flex h-21 w-19 shrink-0 flex-col items-center justify-center gap-1.5 rounded-2xl border text-[11px] font-semibold md:h-29 md:w-auto md:gap-2.5 md:rounded-[20px] md:text-sm ${
              active ? "border-brand bg-brand text-white" : "border-line bg-white text-[#374151] hover:border-brand"
            }`}
          >
            <span
              className={`flex size-10 items-center justify-center rounded-full md:size-12.5 ${active ? "bg-white text-brand" : "bg-brand-soft text-brand"}`}
            >
              <Icon name={isIconName(c.icon) ? c.icon : "bag"} size={22} strokeWidth={1.7} />
            </span>
            <span className="px-1 text-center leading-tight">{c.name}</span>
          </Link>
        );
      })}
    </div>
  );
}
