"use client";
import { useSyncExternalStore } from "react";
import type { CartItem } from "./types";

// Keranjang disimpan di localStorage browser. Harga di sini hanya untuk tampilan;
// total final selalu dihitung ulang di server saat checkout.

const KEY = "tumbasmalih:cart:v1";
const EMPTY: CartItem[] = [];
const MAX_QTY = 20;

let items: CartItem[] = EMPTY;
let loaded = false;
const listeners = new Set<() => void>();

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const raw = window.localStorage.getItem(KEY);
    const parsed = raw ? (JSON.parse(raw) as CartItem[]) : [];
    items = Array.isArray(parsed) ? parsed.filter((i) => i && i.id && i.qty > 0) : [];
  } catch {
    items = [];
  }
  // Sinkron antar-tab.
  window.addEventListener("storage", (e) => {
    if (e.key !== KEY) return;
    loaded = false;
    load();
    emit();
  });
}

function save(next: CartItem[]) {
  items = next;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // localStorage bisa penuh/terblokir; keranjang tetap jalan di memori.
  }
  emit();
}

function emit() {
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  load();
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  load();
  return items;
}

function getServerSnapshot() {
  return EMPTY;
}

export const cart = {
  add(item: Omit<CartItem, "qty">, qty = 1) {
    load();
    const existing = items.find((i) => i.id === item.id);
    // Ebook cukup dibeli sekali.
    const limit = item.type === "ebook" ? 1 : MAX_QTY;
    if (existing) {
      save(items.map((i) => (i.id === item.id ? { ...i, ...item, qty: Math.min(limit, i.qty + qty) } : i)));
    } else {
      save([...items, { ...item, qty: Math.min(limit, qty) }]);
    }
  },
  setQty(id: string, qty: number) {
    load();
    save(
      items
        .map((i) => (i.id === id ? { ...i, qty: Math.min(i.type === "ebook" ? 1 : MAX_QTY, qty) } : i))
        .filter((i) => i.qty > 0),
    );
  },
  remove(id: string) {
    load();
    save(items.filter((i) => i.id !== id));
  },
  clear() {
    load();
    save([]);
  },
};

export function useCart() {
  const list = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const count = list.reduce((n, i) => n + i.qty, 0);
  const subtotal = list.reduce((n, i) => n + i.qty * i.price, 0);
  const hasPhysical = list.some((i) => i.type === "fisik");
  return { items: list, count, subtotal, hasPhysical };
}
