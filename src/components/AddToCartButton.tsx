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
        className="flex h-13 flex-1 items-center justify-center gap-2 rounded-xl bg-brand px-6 text-[15px] font-bold text-white hover:bg-brand-dark active:bg-[#122f8a] disabled:bg-muted"
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
      className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-field bg-white text-brand hover:border-brand hover:bg-brand-soft active:bg-brand-tint disabled:border-line disabled:text-muted"
    >
      <Icon name={added ? "check" : "plus"} size={20} strokeWidth={2.2} />
      <span className="sr-only" aria-live="polite">{added ? "Sudah masuk keranjang" : ""}</span>
    </button>
  );
}
