import { Icon } from "./Icon";
import type { ProductType } from "@/lib/types";

export function ProductImage({
  src,
  alt,
  type,
  className = "",
  iconSize = 52,
  priority = false,
}: {
  src: string | null;
  alt: string;
  type: ProductType;
  className?: string;
  iconSize?: number;
  /** true untuk gambar utama halaman (dimuat duluan, tidak lazy). */
  priority?: boolean;
}) {
  if (src) {
    return (
      <img
        src={src}
        alt={alt}
        width={800}
        height={800}
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : "auto"}
        className={`aspect-square h-full w-full object-cover ${className}`}
      />
    );
  }
  const ebook = type === "ebook";
  return (
    <div
      role={alt ? "img" : undefined}
      aria-label={alt ? `${alt} (belum ada foto)` : undefined}
      className={`flex aspect-square h-full w-full items-center justify-center ${ebook ? "bg-brand-tint text-brand" : "bg-accent-tint text-[#8A5300]"} ${className}`}
    >
      <Icon name={ebook ? "book" : "bag"} size={iconSize} strokeWidth={1.6} />
    </div>
  );
}
