"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "@/lib/cart";
import { formatRupiah } from "@/lib/format";

/** Bar keranjang melayang di mobile, muncul kalau keranjang berisi. */
export function CartBar() {
  const { count, subtotal } = useCart();
  const pathname = usePathname();
  if (count === 0 || pathname === "/keranjang" || pathname === "/checkout" || pathname.startsWith("/pesanan")) {
    return null;
  }
  return (
    <Link
      href="/keranjang"
      className="fixed inset-x-4 bottom-[92px] z-30 flex h-15.5 items-center justify-between rounded-[20px] bg-brand px-5 text-white shadow-[0_14px_30px_rgba(31,79,224,0.35)] md:hidden"
    >
      <span className="flex items-center gap-2.5 text-[15px] font-semibold">
        Lihat keranjang
        <span className="rounded-[10px] bg-white px-2 py-0.5 text-xs font-extrabold text-brand">{count} barang</span>
      </span>
      <span className="text-[17px] font-extrabold">{formatRupiah(subtotal)}</span>
    </Link>
  );
}
