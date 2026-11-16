"use client";
import { useRef, useState } from "react";
import type { ProductType } from "@/lib/types";
import { ProductImage } from "./ProductImage";

/**
 * Galeri foto halaman produk. Di HP foto bisa digeser (scroll-snap); di layar lebar ada deretan thumbnail.
 * Tanpa foto, tampil placeholder ikon yang sama dengan kartu produk.
 */
export function ProductGallery({ images, name, type }: { images: string[]; name: string; type: ProductType }) {
  const [active, setActive] = useState(0);
  const track = useRef<HTMLDivElement>(null);

  if (images.length <= 1) {
    return (
      <div className="aspect-square overflow-hidden rounded-3xl border border-line bg-white">
        <ProductImage src={images[0] ?? null} alt={name} type={type} iconSize={96} priority />
      </div>
    );
  }

  function go(i: number) {
    setActive(i);
    const el = track.current;
    if (el) el.scrollTo({ left: el.clientWidth * i, behavior: "smooth" });
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="relative">
        <div
          ref={track}
          onScroll={(e) => {
            const el = e.currentTarget;
            const i = Math.round(el.scrollLeft / el.clientWidth);
            if (i !== active) setActive(i);
          }}
          className="no-scrollbar flex aspect-square snap-x snap-mandatory overflow-x-auto rounded-3xl border border-line bg-white"
          aria-roledescription="galeri"
          aria-label={`Foto ${name}`}
        >
          {images.map((src, i) => (
            <div key={src + i} className="w-full shrink-0 snap-center" aria-hidden={i !== active}>
              <img
                src={src}
                alt={`${name}, foto ${i + 1} dari ${images.length}`}
                width={800}
                height={800}
                loading={i === 0 ? "eager" : "lazy"}
                fetchPriority={i === 0 ? "high" : "auto"}
                className="aspect-square h-full w-full object-cover"
              />
            </div>
          ))}
        </div>
        <span className="absolute right-3 bottom-3 rounded-lg bg-ink/80 px-2.5 py-1 text-xs font-bold text-white" aria-live="polite">
          {active + 1} / {images.length}
        </span>
      </div>
      <div className="no-scrollbar flex gap-2 overflow-x-auto" role="group" aria-label="Pilih foto">
        {images.map((src, i) => (
          <button
            key={src + i}
            type="button"
            onClick={() => go(i)}
            aria-label={`Lihat foto ${i + 1}`}
            aria-current={i === active ? "true" : undefined}
            className={`size-16 shrink-0 overflow-hidden rounded-xl border-2 md:size-18 ${i === active ? "border-brand" : "border-transparent hover:border-field"}`}
          >
            <img src={src} alt="" width={72} height={72} loading="lazy" className="h-full w-full object-cover" />
          </button>
        ))}
      </div>
    </div>
  );
}
