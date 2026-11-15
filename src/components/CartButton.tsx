"use client";
import Link from "next/link";
import { useCart } from "@/lib/cart";
import { Icon } from "./Icon";

export function CartButton({ className = "" }: { className?: string }) {
  const { count } = useCart();
  return (
    <Link
      href="/keranjang"
      aria-label={count ? `Keranjang, ${count} barang` : "Keranjang"}
      className={`relative flex size-11.5 items-center justify-center border border-line bg-white text-ink hover:border-brand ${className}`}
    >
      <Icon name="cart" size={22} />
      {count > 0 && (
        <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-danger px-1 text-[11px] font-bold text-white">
          {count}
        </span>
      )}
    </Link>
  );
}
