import Link from "next/link";
import { formatRupiah } from "@/lib/format";
import type { Product } from "@/lib/types";
import { AddToCartButton } from "./AddToCartButton";
import { ProductImage } from "./ProductImage";

export function productTag(p: Pick<Product, "type" | "stock">): string | null {
  if (p.type === "ebook") return "Ebook, unduh setelah bayar";
  if (p.stock === 0) return "Stok habis";
  if (p.stock !== null && p.stock <= 20) return `Sisa ${p.stock} stok`;
  return null;
}

type Heading = "h2" | "h3";

export function ProductCard({ product, heading = "h3" }: { product: Product; heading?: Heading }) {
  const Title = heading;
  const tag = productTag(product);
  return (
    <article className="flex flex-col gap-2 rounded-[18px] border border-line bg-white p-2.5 sm:rounded-[20px] sm:p-3">
      <Link href={`/produk/${product.slug}`} className="relative block overflow-hidden rounded-[14px] sm:rounded-2xl">
        <ProductImage src={product.image_url} alt={product.name} type={product.type} />
        <span className="absolute bottom-2 left-2 rounded-lg bg-brand px-2.5 py-1 text-xs font-bold text-white sm:text-[13px]">
          {formatRupiah(product.price)}
        </span>
      </Link>
      {tag && <span className="text-[11px] font-semibold text-warn sm:text-xs">{tag}</span>}
      <Title className="line-clamp-2 text-[13px] leading-snug font-semibold sm:text-[15px] sm:font-bold">
        <Link href={`/produk/${product.slug}`} className="hover:text-brand hover:underline">
          {product.name}
        </Link>
      </Title>
      <div className="mt-auto flex items-center justify-between gap-2">
        {product.compare_price && product.compare_price > product.price ? (
          <span className="text-xs text-muted">
            <span className="sr-only">Harga sebelumnya </span>
            <s>{formatRupiah(product.compare_price)}</s>
          </span>
        ) : (
          <span />
        )}
        <AddToCartButton product={product} />
      </div>
    </article>
  );
}

export function ProductGrid({
  products,
  heading = "h3",
  empty,
}: {
  products: Product[];
  heading?: Heading;
  empty?: React.ReactNode;
}) {
  if (products.length === 0) {
    return (
      <div className="flex flex-col items-start gap-3 rounded-2xl border border-dashed border-field bg-white p-6 text-sm text-muted">
        {empty ?? (
          <>
            <p>Produk untuk bagian ini belum ditambahkan.</p>
            <Link href="/cari" className="flex min-h-11 items-center font-bold text-brand hover:underline">
              Lihat semua produk
            </Link>
          </>
        )}
      </div>
    );
  }
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-[repeat(auto-fill,minmax(210px,1fr))] sm:gap-4.5">
      {products.map((p) => (
        <ProductCard key={p.id} product={p} heading={heading} />
      ))}
    </div>
  );
}
