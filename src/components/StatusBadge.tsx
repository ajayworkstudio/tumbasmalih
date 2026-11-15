import { statusLabels } from "@/lib/site";
import type { OrderStatus } from "@/lib/types";

const tone: Record<OrderStatus, string> = {
  menunggu_pembayaran: "bg-[#FFF8E1] text-[#6B4E00]",
  menunggu_konfirmasi: "bg-[#FFF8E1] text-[#6B4E00]",
  dibayar: "bg-[#E3F6EE] text-ok",
  diproses: "bg-brand-soft text-brand-dark",
  dikirim: "bg-brand-soft text-brand-dark",
  selesai: "bg-[#E3F6EE] text-ok",
  dibatalkan: "bg-[#FDECEC] text-danger",
};

export function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold whitespace-nowrap ${tone[status]}`}>
      {statusLabels[status]}
    </span>
  );
}
