"use client";
import { useEffect } from "react";
import { cart } from "@/lib/cart";
import { track } from "@/lib/pixel";

/** Dijalankan sekali setelah pesanan baru dibuat: kosongkan keranjang & kirim event Purchase. */
export function NewOrderEffects({ value, code }: { value: number; code: string }) {
  useEffect(() => {
    const key = `tumbasmalih:tracked:${code}`;
    if (window.sessionStorage.getItem(key)) return;
    window.sessionStorage.setItem(key, "1");
    cart.clear();
    track("Purchase", { value, currency: "IDR" });
  }, [value, code]);
  return null;
}
