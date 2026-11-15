import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AddToCartButton } from "@/components/AddToCartButton";
import { Icon } from "@/components/Icon";
import { ProductGrid, productTag } from "@/components/ProductCard";
import { ProductImage } from "@/components/ProductImage";
import { BlockSkeleton } from "@/components/Skeleton";
import { TrackEvent } from "@/components/TrackEvent";
import { getCategories, getProductBySlug, getProducts } from "@/lib/data";
import { formatRupiah } from "@/lib/format";
import { site } from "@/lib/site";

export async function generateMetadata({ params }: PageProps<"/produk/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const p = await getProductBySlug(slug);
  if (!p) return { title: "Produk tidak ditemukan" };
  const description = (p.description || `${p.name} — ${formatRupiah(p.price)} di ${site.name}.`).slice(0, 160);
  return {
    title: p.name,
    description,
    alternates: { canonical: `/produk/${p.slug}` },
    openGraph: { title: p.name, description, images: p.image_url ? [p.image_url] : undefined },
  };
}

async function ProductDetail({ params }: { params: PageProps<"/produk/[slug]">["params"] }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const [categories, related] = await Promise.all([
    getCategories(),
    product.category_id ? getProducts({ categoryId: product.category_id, limit: 5 }) : Promise.resolve([]),
  ]);
  const category = categories.find((c) => c.id === product.category_id);
  const isEbook = product.type === "ebook";
  const soldOut = !isEbook && product.stock === 0;

  // Data terstruktur untuk Google (rich result produk).
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description || undefined,
    image: product.image_url ? [product.image_url] : undefined,
    url: `${site.url}/produk/${product.slug}`,
    offers: {
      "@type": "Offer",
      priceCurrency: "IDR",
      price: product.price,
      availability: soldOut ? "https://schema.org/OutOfStock" : "https://schema.org/InStock",
      url: `${site.url}/produk/${product.slug}`,
    },
  };

  return (
    <div className="flex flex-col gap-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <TrackEvent
        event="ViewContent"
        params={{ content_ids: [product.id], content_type: "product", value: product.price, currency: "IDR" }}
      />
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm text-muted">
        <Link href="/" className="hover:text-brand">Beranda</Link>
        {category && (
          <>
            <span aria-hidden="true">/</span>
            <Link href={`/kategori/${category.slug}`} className="hover:text-brand">{category.name}</Link>
          </>
        )}
      </nav>

      <div className="grid gap-6 md:grid-cols-2 md:gap-10">
        <div className="aspect-square overflow-hidden rounded-3xl border border-line bg-white">
          <ProductImage src={product.image_url} alt={product.name} type={product.type} iconSize={96} />
        </div>
        <div className="flex flex-col gap-4">
          <span className="text-sm font-semibold text-warn">{productTag(product)}</span>
          <h1 className="text-2xl leading-tight font-extrabold md:text-[32px]">{product.name}</h1>
          <div className="flex items-baseline gap-3">
            <span className="text-2xl font-extrabold text-brand md:text-3xl">{formatRupiah(product.price)}</span>
            {product.compare_price && product.compare_price > product.price && (
              <span className="text-muted line-through">{formatRupiah(product.compare_price)}</span>
            )}
          </div>
          <div className="flex flex-col gap-2 rounded-2xl border border-line bg-white p-4 text-sm">
            {isEbook ? (
              <>
                <p className="flex items-center gap-2"><Icon name="download" size={18} className="text-brand" /> Format digital (PDF), tidak ada pengiriman fisik</p>
                <p className="flex items-center gap-2"><Icon name="check" size={18} className="text-brand" /> Link unduh muncul di halaman pesanan setelah pembayaran dikonfirmasi</p>
              </>
            ) : (
              <>
                <p className="flex items-center gap-2"><Icon name="truck" size={18} className="text-brand" /> Dikirim ke seluruh Indonesia, estimasi 2–5 hari</p>
                <p className="flex items-center gap-2"><Icon name="check" size={18} className="text-brand" /> Bisa bayar di tempat (COD)</p>
              </>
            )}
          </div>
          {product.description && (
            <div className="flex flex-col gap-2">
              <h2 className="font-bold">Deskripsi</h2>
              <p className="text-sm leading-relaxed whitespace-pre-line text-[#374151]">{product.description}</p>
            </div>
          )}
          <div className="mt-2 flex gap-3">
            <AddToCartButton product={product} variant="full" />
          </div>
        </div>
      </div>

      {related.filter((r) => r.id !== product.id).length > 0 && (
        <section className="flex flex-col gap-4">
          <h2 className="text-lg font-extrabold md:text-2xl">Produk serupa</h2>
          <ProductGrid products={related.filter((r) => r.id !== product.id).slice(0, 4)} />
        </section>
      )}
    </div>
  );
}

export default function ProductPage(props: PageProps<"/produk/[slug]">) {
  return (
    <Suspense fallback={<BlockSkeleton />}>
      <ProductDetail params={props.params} />
    </Suspense>
  );
}
