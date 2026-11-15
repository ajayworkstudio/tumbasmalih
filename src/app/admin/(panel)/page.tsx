import Link from "next/link";
import { Suspense } from "react";
import { BlockSkeleton } from "@/components/Skeleton";
import { StatusBadge } from "@/components/StatusBadge";
import { requireAdmin } from "@/lib/auth";
import { formatDate, formatRupiah } from "@/lib/format";
import { getSettings } from "@/lib/settings";
import { paymentLabels } from "@/lib/site";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Order, OrderStatus } from "@/lib/types";

export const metadata = { title: "Ringkasan | Admin" };

const PAID: OrderStatus[] = ["dibayar", "diproses", "dikirim", "selesai"];

/** Awal bulan ini menurut jam WIB, dalam ISO UTC. */
function monthStartJakarta(): string {
  const wib = new Date(Date.now() + 7 * 3600_000);
  return new Date(Date.UTC(wib.getUTCFullYear(), wib.getUTCMonth(), 1) - 7 * 3600_000).toISOString();
}

async function Dashboard() {
  await requireAdmin();
  const supabase = createAdminClient();
  const count = (status: OrderStatus[]) =>
    supabase.from("orders").select("id", { count: "exact", head: true }).in("status", status);

  const [waitPay, waitCod, toShip, paidThisMonth, activeProducts, lowStock, queue, settings] = await Promise.all([
    count(["menunggu_pembayaran"]),
    count(["menunggu_konfirmasi"]),
    count(["dibayar", "diproses"]),
    supabase.from("orders").select("total").in("status", PAID).gte("paid_at", monthStartJakarta()),
    supabase.from("products").select("id", { count: "exact", head: true }).eq("is_active", true),
    supabase
      .from("products")
      .select("id, name, stock")
      .eq("type", "fisik")
      .eq("is_active", true)
      .lte("stock", 3)
      .order("stock", { ascending: true })
      .limit(8),
    supabase
      .from("orders")
      .select("id, code, customer_name, total, payment_method, status, created_at")
      .in("status", ["menunggu_pembayaran", "menunggu_konfirmasi", "dibayar", "diproses"])
      .order("created_at", { ascending: true })
      .limit(10),
    getSettings(),
  ]);

  const failed = [waitPay, waitCod, toShip, paidThisMonth, activeProducts, lowStock, queue].find((r) => r.error);
  if (failed?.error) throw new Error(`Gagal memuat ringkasan: ${failed.error.message}`);

  const revenue = (paidThisMonth.data ?? []).reduce((n, o) => n + (o.total as number), 0);
  const orders = (queue.data ?? []) as Pick<Order, "id" | "code" | "customer_name" | "total" | "payment_method" | "status" | "created_at">[];
  const low = (lowStock.data ?? []) as { id: string; name: string; stock: number }[];

  const setupGaps = [
    !settings.whatsapp && "nomor WhatsApp admin",
    settings.bankAccounts.length === 0 && !settings.qrisImageUrl && "rekening atau QRIS",
    !settings.policyShipping && "estimasi pengiriman",
    !settings.policyReturns && "kebijakan retur",
  ].filter(Boolean) as string[];

  const tiles = [
    { label: "Menunggu pembayaran", value: waitPay.count ?? 0, href: "/admin/pesanan?status=menunggu_pembayaran" },
    { label: "COD perlu dikonfirmasi", value: waitCod.count ?? 0, href: "/admin/pesanan?status=menunggu_konfirmasi" },
    { label: "Perlu dipesankan / dikirim", value: toShip.count ?? 0, href: "/admin/pesanan?status=dibayar" },
  ];

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-extrabold">Ringkasan</h1>

      {setupGaps.length > 0 && (
        <div className="flex flex-col items-start gap-2 rounded-2xl border border-[#E8C547] bg-[#FFF8E1] p-4 text-sm text-[#6B4E00]">
          <p>
            <strong>Toko belum lengkap:</strong> {setupGaps.join(", ")} belum diisi. Pembeli melihat placeholder sampai bagian ini diisi.
          </p>
          <Link href="/admin/pengaturan" className="flex min-h-11 items-center font-bold text-brand hover:underline">
            Buka pengaturan
          </Link>
        </div>
      )}

      <section aria-labelledby="perlu-title" className="flex flex-col gap-3">
        <h2 id="perlu-title" className="font-bold">Perlu tindakan</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {tiles.map((t) => (
            <Link
              key={t.label}
              href={t.href}
              className={`flex flex-col gap-1 rounded-2xl border bg-white p-4 hover:border-brand ${t.value > 0 ? "border-brand" : "border-line"}`}
            >
              <span className={`text-3xl font-extrabold ${t.value > 0 ? "text-brand" : "text-muted"}`}>{t.value}</span>
              <span className="text-sm font-semibold">{t.label}</span>
            </Link>
          ))}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <section aria-labelledby="antrian-title" className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <h2 id="antrian-title" className="font-bold">Antrian pesanan (terlama dulu)</h2>
            <Link href="/admin/pesanan" className="flex min-h-11 items-center text-sm font-semibold text-brand hover:underline">
              Semua pesanan
            </Link>
          </div>
          {orders.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-field bg-white p-6 text-sm text-muted">
              Tidak ada pesanan yang menunggu. Pesanan baru dari checkout akan muncul di sini.
            </p>
          ) : (
            <ul className="flex flex-col divide-y divide-line rounded-2xl border border-line bg-white">
              {orders.map((o) => (
                <li key={o.id}>
                  <Link href={`/admin/pesanan/${o.id}`} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3 hover:bg-ground">
                    <span className="font-bold text-brand">{o.code}</span>
                    <span className="min-w-0 flex-1 truncate text-sm">{o.customer_name}</span>
                    <span className="text-sm font-semibold">{formatRupiah(o.total)}</span>
                    <StatusBadge status={o.status} />
                    <span className="w-full text-xs text-muted">
                      {paymentLabels[o.payment_method]} · {formatDate(o.created_at)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <div className="flex flex-col gap-6">
          <section aria-labelledby="bulan-title" className="flex flex-col gap-1 rounded-2xl border border-line bg-white p-4">
            <h2 id="bulan-title" className="text-sm font-semibold text-muted">Omzet dibayar bulan ini</h2>
            <span className="text-2xl font-extrabold">{formatRupiah(revenue)}</span>
            <span className="text-xs text-muted">
              Total pesanan berstatus dibayar ke atas sejak tanggal 1 (WIB), termasuk ongkir. {activeProducts.count ?? 0} produk sedang tampil.
            </span>
          </section>

          <section aria-labelledby="stok-title" className="flex flex-col gap-2 rounded-2xl border border-line bg-white p-4">
            <h2 id="stok-title" className="font-bold">Stok hampir habis</h2>
            {low.length === 0 ? (
              <p className="text-sm text-muted">Tidak ada barang fisik dengan stok 3 atau kurang.</p>
            ) : (
              <ul className="flex flex-col">
                {low.map((p) => (
                  <li key={p.id}>
                    <Link href={`/admin/produk/${p.id}`} className="flex min-h-11 items-center justify-between gap-3 text-sm hover:text-brand">
                      <span className="truncate">{p.name}</span>
                      <span className={`shrink-0 font-bold ${p.stock === 0 ? "text-danger" : "text-warn"}`}>
                        {p.stock === 0 ? "Habis" : `Sisa ${p.stock}`}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

export default function AdminHome() {
  return (
    <Suspense fallback={<BlockSkeleton />}>
      <Dashboard />
    </Suspense>
  );
}
