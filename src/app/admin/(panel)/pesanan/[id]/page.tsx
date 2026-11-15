import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { BlockSkeleton } from "@/components/Skeleton";
import { StatusBadge } from "@/components/StatusBadge";
import { requireAdmin } from "@/lib/auth";
import { formatDate, formatRupiah } from "@/lib/format";
import { paymentLabels, site, statusLabels, statusOrder } from "@/lib/site";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Order, OrderItem } from "@/lib/types";
import { updateOrder } from "../../../actions";

export const metadata = { title: "Detail pesanan | Admin" };

type ItemWithSource = OrderItem & { products: { source_url: string | null; source_price: number | null; file_path: string | null } | null };

async function OrderDetail({ params, searchParams }: PageProps<"/admin/pesanan/[id]">) {
  await requireAdmin();
  const { id } = await params;
  const sp = await searchParams;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const supabase = createAdminClient();
  const { data: order } = await supabase.from("orders").select("*").eq("id", id).maybeSingle<Order>();
  if (!order) notFound();
  const { data: itemRows } = await supabase
    .from("order_items")
    .select("*, products(source_url, source_price, file_path)")
    .eq("order_id", id);
  const items = (itemRows ?? []) as ItemWithSource[];

  const modal = items.reduce((n, it) => n + (it.products?.source_price ?? 0) * it.qty, 0);
  const hasAllCost = items.every((it) => it.products?.source_price != null);
  const customerWa = `https://wa.me/${order.phone}?text=${encodeURIComponent(
    `Halo ${order.customer_name}, ini admin ${site.name} terkait pesanan ${order.code}.`,
  )}`;

  return (
    <div className="flex flex-col gap-5">
      <Link href="/admin" className="text-sm font-semibold text-brand hover:underline">← Semua pesanan</Link>
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-extrabold">{order.code}</h1>
        <StatusBadge status={order.status} />
        <Link href={`/pesanan/${order.code}`} target="_blank" className="text-sm font-semibold text-brand hover:underline">
          Halaman pembeli ↗
        </Link>
      </div>
      {sp.disimpan === "1" && <p role="status" className="rounded-xl bg-[#E3F6EE] px-4 py-3 text-sm font-semibold text-ok">Perubahan disimpan.</p>}

      <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
        <div className="flex flex-col gap-5">
          <section className="flex flex-col gap-3 rounded-2xl border border-line bg-white p-5">
            <h2 className="font-bold">Barang</h2>
            <ul className="flex flex-col gap-3">
              {items.map((it) => (
                <li key={it.id} className="flex flex-wrap items-start justify-between gap-2 border-b border-line pb-3 text-sm last:border-0 last:pb-0">
                  <span className="flex min-w-0 flex-1 flex-col gap-1">
                    <span className="font-semibold">{it.name} <span className="text-muted">x{it.qty}</span></span>
                    <span className="text-xs text-muted">
                      {it.type === "ebook" ? "Ebook" : "Fisik"} · harga jual {formatRupiah(it.price)}
                      {it.products?.source_price != null && ` · modal ${formatRupiah(it.products.source_price)}`}
                    </span>
                    {it.type === "fisik" && it.products?.source_url && (
                      <a href={it.products.source_url} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-brand hover:underline">
                        Pesan di marketplace ↗
                      </a>
                    )}
                    {it.type === "ebook" && !it.products?.file_path && (
                      <span className="text-xs font-bold text-danger">File ebook belum diisi di produk.</span>
                    )}
                  </span>
                  <span className="font-bold">{formatRupiah(it.line_total)}</span>
                </li>
              ))}
            </ul>
            <div className="flex flex-col gap-1 border-t border-line pt-3 text-sm">
              <div className="flex justify-between"><span className="text-muted">Subtotal</span><span>{formatRupiah(order.subtotal)}</span></div>
              <div className="flex justify-between"><span className="text-muted">Ongkir</span><span>{formatRupiah(order.shipping_fee)}</span></div>
              <div className="flex justify-between font-extrabold"><span>Total</span><span>{formatRupiah(order.total)}</span></div>
              {hasAllCost && (
                <div className="flex justify-between text-ok"><span>Perkiraan margin (di luar ongkir)</span><span className="font-bold">{formatRupiah(order.subtotal - modal)}</span></div>
              )}
            </div>
          </section>

          <section className="flex flex-col gap-1.5 rounded-2xl border border-line bg-white p-5 text-sm">
            <h2 className="mb-1 font-bold">Pembeli</h2>
            <p className="font-semibold">{order.customer_name}</p>
            <p>
              <a href={customerWa} target="_blank" rel="noopener" className="font-semibold text-brand hover:underline">+{order.phone}</a> · {order.email}
            </p>
            {order.address && (
              <p className="mt-2 whitespace-pre-line text-[#374151]">
                {order.address}
                {"\n"}
                {order.city} {order.postal_code}
              </p>
            )}
            {order.note && <p className="mt-2 rounded-lg bg-ground p-3"><strong>Catatan:</strong> {order.note}</p>}
            <p className="mt-2 text-muted">
              {paymentLabels[order.payment_method]} · dibuat {formatDate(order.created_at)}
              {order.paid_at && ` · dibayar ${formatDate(order.paid_at)}`}
            </p>
          </section>
        </div>

        <form action={updateOrder} className="flex h-fit flex-col gap-4 rounded-2xl border border-line bg-white p-5">
          <input type="hidden" name="id" value={order.id} />
          <h2 className="font-bold">Ubah status</h2>
          <label className="flex flex-col gap-1.5 text-sm font-semibold">
            Status
            <select name="status" defaultValue={order.status} className="h-11 rounded-lg border border-field bg-white px-3">
              {statusOrder.map((s) => (
                <option key={s} value={s}>{statusLabels[s]}</option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-semibold">
            Nomor resi
            <input name="tracking_number" defaultValue={order.tracking_number ?? ""} className="h-11 rounded-lg border border-field px-3" />
          </label>
          <p className="text-xs leading-relaxed text-muted">
            Status <strong>Sudah dibayar</strong> ke atas membuka tombol unduh ebook di halaman pembeli.
          </p>
          <button type="submit" className="h-11 rounded-xl bg-brand font-bold text-white hover:bg-brand-dark">Simpan</button>
        </form>
      </div>
    </div>
  );
}

export default function AdminOrderPage(props: PageProps<"/admin/pesanan/[id]">) {
  return (
    <Suspense fallback={<BlockSkeleton />}>
      <OrderDetail {...props} />
    </Suspense>
  );
}
