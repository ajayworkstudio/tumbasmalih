import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Icon } from "@/components/Icon";
import { BlockSkeleton } from "@/components/Skeleton";
import { formatDate, formatRupiah } from "@/lib/format";
import { bankAccounts, paymentLabels, site, statusLabels, waLink } from "@/lib/site";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Order, OrderItem, OrderStatus } from "@/lib/types";
import { NewOrderEffects } from "./NewOrderEffects";

export const metadata: Metadata = {
  title: "Status pesanan",
  robots: { index: false, follow: false },
};

const PAID: OrderStatus[] = ["dibayar", "diproses", "dikirim", "selesai"];

async function OrderView({ params, searchParams }: PageProps<"/pesanan/[kode]">) {
  const { kode } = await params;
  const sp = await searchParams;
  if (!/^TM[0-9A-Z]{8}$/.test(kode)) notFound();

  const supabase = createAdminClient();
  const { data: order } = await supabase.from("orders").select("*").eq("code", kode).maybeSingle<Order>();
  if (!order) notFound();
  const { data: itemRows } = await supabase
    .from("order_items")
    .select("*")
    .eq("order_id", order.id)
    .order("name");
  const items = (itemRows ?? []) as OrderItem[];

  const isPaid = PAID.includes(order.status);
  const awaitingPayment = order.status === "menunggu_pembayaran";
  const banks = bankAccounts();
  const confirmMsg = awaitingPayment
    ? `Halo ${site.name}, saya sudah bayar pesanan ${order.code} sebesar ${formatRupiah(order.total)} via ${paymentLabels[order.payment_method]}. Berikut bukti transfernya.`
    : `Halo ${site.name}, saya mau tanya pesanan ${order.code}.`;

  return (
    <div className="mx-auto flex max-w-180 flex-col gap-4">
      {sp.baru === "1" && <NewOrderEffects value={order.total} code={order.code} />}

      <section className="flex flex-col items-center gap-2 rounded-3xl border border-line bg-white px-5 py-8 text-center">
        <span className={`flex size-14 items-center justify-center rounded-full ${isPaid ? "bg-[#E3F6EE] text-ok" : "bg-brand-soft text-brand"}`}>
          <Icon name={isPaid ? "check" : "box"} size={28} />
        </span>
        <p className="text-sm text-muted">Pesanan {order.code}</p>
        <h1 className="text-2xl font-extrabold">{statusLabels[order.status]}</h1>
        <p className="text-sm text-muted">Dibuat {formatDate(order.created_at)}</p>
        <p className="mt-1 text-xs text-muted">Simpan link halaman ini untuk mengecek status &amp; mengunduh ebook.</p>
      </section>

      {awaitingPayment && (
        <section className="flex flex-col gap-3 rounded-[18px] border border-line bg-white p-5">
          <h2 className="font-bold">Selesaikan pembayaran</h2>
          <p className="text-sm text-muted">
            Bayar tepat <strong className="text-ink">{formatRupiah(order.total)}</strong>, lalu kirim bukti bayar lewat WhatsApp.
          </p>
          {order.payment_method === "qris" &&
            (site.qrisImageUrl ? (
              <img src={site.qrisImageUrl} alt="Kode QRIS tumbasmalih" className="mx-auto w-full max-w-70 rounded-2xl border border-line" />
            ) : (
              <p className="rounded-xl bg-ground p-4 text-sm text-muted">Kode QRIS akan dikirim admin lewat WhatsApp.</p>
            ))}
          {order.payment_method === "transfer" &&
            (banks.length > 0 ? (
              <ul className="flex flex-col gap-2">
                {banks.map((b) => (
                  <li key={b.number} className="flex flex-col rounded-xl bg-ground p-3.5 text-sm">
                    <span className="font-bold">{b.bank}</span>
                    <span className="text-lg font-extrabold tracking-wide">{b.number}</span>
                    <span className="text-muted">a.n. {b.holder}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="rounded-xl bg-ground p-4 text-sm text-muted">Nomor rekening akan dikirim admin lewat WhatsApp.</p>
            ))}
        </section>
      )}

      {order.status === "menunggu_konfirmasi" && (
        <p className="rounded-[18px] border border-line bg-white p-5 text-sm leading-relaxed">
          Pesanan COD kamu sudah kami terima. Admin akan menghubungi lewat WhatsApp untuk konfirmasi sebelum barang dikirim.
          Siapkan uang pas <strong>{formatRupiah(order.total)}</strong> saat kurir datang.
        </p>
      )}

      {order.tracking_number && (
        <p className="flex items-center gap-2 rounded-[18px] border border-line bg-white p-5 text-sm">
          <Icon name="truck" size={20} className="text-brand" />
          Nomor resi: <strong className="tracking-wide">{order.tracking_number}</strong>
        </p>
      )}

      <section className="flex flex-col gap-3 rounded-[18px] border border-line bg-white p-5">
        <h2 className="font-bold">Rincian pesanan</h2>
        <ul className="flex flex-col gap-3">
          {items.map((it) => (
            <li key={it.id} className="flex flex-wrap items-center justify-between gap-2 text-sm">
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="font-semibold">{it.name}</span>
                <span className="text-xs text-muted">
                  {it.type === "ebook" ? "Ebook" : "Barang fisik"} · x{it.qty}
                </span>
              </span>
              {it.type === "ebook" && isPaid ? (
                <a
                  href={`/api/unduh/${order.code}/${it.id}`}
                  className="flex h-10 items-center gap-1.5 rounded-xl bg-brand px-3.5 text-[13px] font-bold text-white hover:bg-brand-dark"
                >
                  <Icon name="download" size={16} strokeWidth={2} /> Unduh
                </a>
              ) : (
                <span className="font-bold">{formatRupiah(it.line_total)}</span>
              )}
            </li>
          ))}
        </ul>
        <div className="h-px bg-line" />
        <div className="flex justify-between text-sm text-muted">
          <span>Subtotal</span>
          <span className="text-ink">{formatRupiah(order.subtotal)}</span>
        </div>
        {order.shipping_fee > 0 && (
          <div className="flex justify-between text-sm text-muted">
            <span>Ongkos kirim</span>
            <span className="text-ink">{formatRupiah(order.shipping_fee)}</span>
          </div>
        )}
        <div className="flex justify-between font-extrabold">
          <span>Total</span>
          <span>{formatRupiah(order.total)}</span>
        </div>
        <p className="text-xs text-muted">Pembayaran: {paymentLabels[order.payment_method]}</p>
      </section>

      <a
        href={waLink(confirmMsg)}
        target="_blank"
        rel="noopener"
        className="flex h-13 items-center justify-center gap-2 rounded-2xl bg-[#1FA855] font-bold text-white hover:bg-[#178A45]"
      >
        <Icon name="chat" size={20} />
        {awaitingPayment ? "Kirim bukti bayar via WhatsApp" : "Hubungi admin via WhatsApp"}
      </a>
    </div>
  );
}

export default function OrderPage(props: PageProps<"/pesanan/[kode]">) {
  return (
    <Suspense fallback={<BlockSkeleton />}>
      <OrderView {...props} />
    </Suspense>
  );
}
