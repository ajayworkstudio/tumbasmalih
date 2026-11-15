"use client";
import { useState } from "react";
import { cart } from "@/lib/cart";
import { track } from "@/lib/pixel";
import type { Product } from "@/lib/types";
import { Icon } from "./Icon";

type Props = {
  product: Pick<Product, "id" | "slug" | "name" | "price" | "type" | "image_url" | "stock">;
  variant?: "icon" | "full";
};

export function AddToCartButton({ product, variant = "icon" }: Props) {
  const [added, setAdded] = useState(false);
  const soldOut = product.type === "fisik" && product.stock === 0;

  function add() {
    cart.add({
      id: product.id,
      slug: product.slug,
      name: product.name,
      price: product.price,
      type: product.type,
      image_url: product.image_url,
    });
    track("AddToCart", { content_ids: [product.id], content_type: "product", value: product.price, currency: "IDR" });
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1500);
  }

  if (variant === "full") {
    return (
      <button
        type="button"
        onClick={add}
        disabled={soldOut}
        className="flex h-13 flex-1 items-center justify-center gap-2 rounded-2xl bg-brand px-6 text-[15px] font-bold text-white transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:bg-muted"
      >
        <Icon name={added ? "check" : "cart"} size={20} />
        {soldOut ? "Stok habis" : added ? "Masuk keranjang" : "Tambah ke keranjang"}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={add}
      disabled={soldOut}
      aria-label={soldOut ? "Stok habis" : `Tambah ${product.name} ke keranjang`}
      className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent text-ink transition hover:bg-accent-dark disabled:cursor-not-allowed disabled:opacity-40"
    >
      <Icon name={added ? "check" : "plus"} size={18} strokeWidth={2.2} />
    </button>
  );
}
