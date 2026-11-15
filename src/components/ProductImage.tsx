import { Icon } from "./Icon";
import type { ProductType } from "@/lib/types";

export function ProductImage({
  src,
  alt,
  type,
  className = "",
  iconSize = 52,
}: {
  src: string | null;
  alt: string;
  type: ProductType;
  className?: string;
  iconSize?: number;
}) {
  if (src) {
    return <img src={src} alt={alt} loading="lazy" className={`h-full w-full object-cover ${className}`} />;
  }
  const ebook = type === "ebook";
  return (
    <div
      className={`flex h-full w-full items-center justify-center ${ebook ? "bg-[#E7EEFF] text-brand/60" : "bg-[#FFF1D6] text-[#B26A00]/70"} ${className}`}
    >
      <Icon name={ebook ? "book" : "bag"} size={iconSize} strokeWidth={1.4} />
    </div>
  );
}
