import Link from "next/link";
import { Suspense } from "react";
import { BlockSkeleton } from "@/components/Skeleton";
import { StatusBadge } from "@/components/StatusBadge";
import { requireAdmin } from "@/lib/auth";
import { formatDate, formatRupiah } from "@/lib/format";
import { paymentLabels, statusLabels, statusOrder } from "@/lib/site";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Order, OrderStatus } from "@/lib/types";

export const metadata = { title: "Pesanan | Admin" };

async function Orders({ searchParams }: { searchParams: PageProps<"/admin">["searchParams"] }) {
  await requireAdmin();
  const sp = await searchParams;
  const status = typeof sp.status === "string" && statusOrder.includes(sp.status as OrderStatus) ? (sp.status as OrderStatus) : null;

  let q = createAdminClient()
    .from("orders")
    .select("id, code, customer_name, phone, total, payment_method, status, created_at")
    .order("created_at", { ascending: false })
    .limit(100);
  if (status) q = q.eq("status", status);
  const { data, error } = await q;
  const orders = (data ?? []) as Pick<Order, "id" | "code" | "customer_name" | "phone" | "total" | "payment_method" | "status" | "created_at">[];

  const tabs: { label: string; href: string; on: boolean }[] = [
    { label: "Semua", href: "/admin", on: !status },
    ...statusOrder.map((s) => ({ label: statusLabels[s], href: `/admin?status=${s}`, on: status === s })),
  ];

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-2xl font-extrabold">Pesanan</h1>
      <div className="no-scrollbar flex gap-2 overflow-x-auto">
        {tabs.map((t) => (
          <Link
            key={t.href}
            href={t.href}
            className={`flex h-11 shrink-0 items-center rounded-xl border px-3 text-sm font-semibold ${t.on ? "border-brand bg-brand text-white" : "border-line bg-white hover:border-brand"}`}
          >
            {t.label}
          </Link>
        ))}
      </div>
      {error && (
        <p role="alert" className="rounded-xl border border-danger bg-[#FDECEC] px-4 py-3 text-sm font-medium text-danger">
          Gagal memuat pesanan: {error.message}. Muat ulang halaman; kalau masih gagal, cek koneksi Supabase di env.
        </p>
      )}
      {error ? null : orders.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-field bg-white p-8 text-center text-sm text-muted">{status ? "Tidak ada pesanan dengan status ini." : "Belum ada pesanan. Pesanan baru dari checkout akan muncul di sini."}</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-line bg-white">
          <table className="w-full min-w-180 text-left text-sm">
            <thead className="border-b border-line text-xs text-muted">
              <tr>
                <th className="px-4 py-3 font-semibold">Kode</th>
                <th className="px-4 py-3 font-semibold">Tanggal</th>
                <th className="px-4 py-3 font-semibold">Pembeli</th>
                <th className="px-4 py-3 font-semibold">Pembayaran</th>
                <th className="px-4 py-3 text-right font-semibold">Total</th>
                <th className="px-4 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="border-b border-line last:border-0 hover:bg-ground">
                  <td className="px-4 py-3 font-bold">
                    <Link href={`/admin/pesanan/${o.id}`} className="text-brand hover:underline">{o.code}</Link>
                  </td>
                  <td className="px-4 py-3 text-muted">{formatDate(o.created_at)}</td>
                  <td className="px-4 py-3">{o.customer_name}</td>
                  <td className="px-4 py-3">{paymentLabels[o.payment_method]}</td>
                  <td className="px-4 py-3 text-right font-semibold">{formatRupiah(o.total)}</td>
                  <td className="px-4 py-3"><StatusBadge status={o.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function AdminOrdersPage(props: PageProps<"/admin">) {
  return (
    <Suspense fallback={<BlockSkeleton />}>
      <Orders searchParams={props.searchParams} />
    </Suspense>
  );
}
