import Link from "next/link";
import { formatRupiah } from "@/lib/format";
import type { Product } from "@/lib/types";
import { AddToCartButton } from "./AddToCartButton";
import { ProductImage } from "./ProductImage";

export function productTag(p: Pick<Product, "type" | "stock">): string {
  if (p.type === "ebook") return "Ebook · Unduh instan";
  if (p.stock === 0) return "Stok habis";
  if (p.stock !== null && p.stock <= 20) return `Sisa ${p.stock} stok`;
  return "Siap dikirim";
}

export function ProductCard({ product }: { product: Product }) {
  return (
    <article className="flex flex-col gap-2 rounded-[18px] border border-line bg-white p-2.5 sm:rounded-[20px] sm:p-3">
      <Link
        href={`/produk/${product.slug}`}
        className="relative block aspect-square overflow-hidden rounded-[14px] sm:rounded-2xl"
      >
        <ProductImage src={product.image_url} alt={product.name} type={product.type} />
        <span className="absolute bottom-2 left-2 rounded-[9px] bg-brand px-2.5 py-1 text-xs font-bold text-white sm:text-[13px]">
          {formatRupiah(product.price)}
        </span>
      </Link>
      <span className="text-[11px] font-semibold text-warn sm:text-xs">{productTag(product)}</span>
      <h3 className="line-clamp-2 text-[13px] leading-snug font-semibold sm:text-[15px] sm:font-bold">
        <Link href={`/produk/${product.slug}`} className="hover:text-brand">
          {product.name}
        </Link>
      </h3>
      <div className="mt-auto flex items-center justify-between gap-2">
        {product.compare_price && product.compare_price > product.price ? (
          <span className="text-xs text-muted line-through">{formatRupiah(product.compare_price)}</span>
        ) : (
          <span />
        )}
        <AddToCartButton product={product} />
      </div>
    </article>
  );
}

export function ProductGrid({ products }: { products: Product[] }) {
  if (products.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-line bg-white p-8 text-center text-sm text-muted">
        Belum ada produk di sini.
      </p>
    );
  }
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-[repeat(auto-fill,minmax(210px,1fr))] sm:gap-4.5">
      {products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  );
}
