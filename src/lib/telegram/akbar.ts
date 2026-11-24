import "server-only";
import { paymentLabels, site, statusLabels, waLink } from "@/lib/site";
import { monthStartWIB, todayStartWIB, hoursAgo } from "@/lib/time";
import type { Order, OrderStatus } from "@/lib/types";
import { parseFee, setShippingFee, shippingQuoteLink } from "@/lib/shipping";
import { esc, type Reply } from "./api";
import { logAction } from "./log";
import { PAID, adminUrl, db, findOrder, normCode, orderLine, rp } from "./shared";

const NAME = "Akbar (Administrasi)";

export const akbarHelp = [
  `<b>${NAME}</b>, mengurus pesanan dan pembayaran.`,
  "<code>/akbar</code> ringkasan pesanan yang perlu tindakan",
  "<code>/akbar cek KODE</code> detail satu pesanan",
  "<code>/akbar ongkir KODE ANGKA</code> isi ongkir dari pemasok, lalu kirim total ke pembeli",
  "<code>/akbar bayar KODE</code> tandai sudah dibayar (ada konfirmasi)",
  "<code>/akbar kirim KODE RESI</code> catat resi, status jadi Dikirim",
  "<code>/akbar selesai KODE</code> status jadi Selesai",
  "<code>/akbar batal KODE</code> batalkan pesanan (ada konfirmasi)",
  "<code>/akbar ingatkan</code> pesanan belum dibayar lebih dari 24 jam + link WA",
  "<code>/akbar rekap</code> rekap hari ini · <code>/akbar rekap bulan</code>",
].join("\n");

const ACTIONABLE: OrderStatus[] = ["menunggu_pembayaran", "menunggu_konfirmasi", "dibayar", "diproses"];

async function summary(): Promise<Reply> {
  const { data, error } = await db()
    .from("orders")
    .select("code, customer_name, total, status, created_at")
    .in("status", ACTIONABLE)
    .order("created_at", { ascending: true })
    .limit(40);
  if (error) return { text: `${NAME}: gagal membaca pesanan (${esc(error.message)}).` };
  const orders = (data ?? []) as Pick<Order, "code" | "customer_name" | "total" | "status" | "created_at">[];
  if (!orders.length) return { text: `<b>${NAME}</b>\nTidak ada pesanan yang menunggu tindakan.` };

  const count = (s: OrderStatus) => orders.filter((o) => o.status === s).length;
  const lines = [
    `<b>${NAME}</b>: ${orders.length} pesanan perlu tindakan`,
    `Perlu ongkir: ${count("menunggu_konfirmasi")} · Menunggu bayar: ${count("menunggu_pembayaran")} · Perlu dipesankan/dikirim: ${count("dibayar") + count("diproses")}`,
    "",
    ...orders.slice(0, 12).map((o) => `• ${orderLine(o)}`),
  ];
  if (orders.length > 12) lines.push(`…dan ${orders.length - 12} lagi di ${adminUrl("/admin/pesanan")}`);
  lines.push("", "Ketik <code>/akbar cek KODE</code> untuk detail.");
  const waiting = orders.filter((o) => o.status === "menunggu_pembayaran").slice(0, 3);
  return {
    text: lines.join("\n"),
    buttons: waiting.map((o) => [{ text: `Bukti ${o.code} sudah masuk? Tandai dibayar`, data: `ak:pay:${o.code}` }]),
  };
}

async function detail(code: string): Promise<Reply> {
  const order = await findOrder(code);
  if (!order) return { text: `Pesanan <b>${esc(code || "(kosong)")}</b> tidak ditemukan. Format kode: TM + 8 huruf/angka.` };
  const items = order.items.map((it) => `• ${esc(it.name)} x${it.qty} · ${rp(it.line_total)}${it.type === "ebook" ? " (ebook)" : ""}`);
  const lines = [
    `<b>${esc(order.code)}</b> · ${esc(statusLabels[order.status])}`,
    `${esc(order.customer_name)} · +${esc(order.phone)} · ${esc(order.email)}`,
    ...(order.address ? [`${esc(order.address)}, ${esc(order.city ?? "")} ${esc(order.postal_code ?? "")}`] : []),
    "",
    ...items,
    `Subtotal ${rp(order.subtotal)} · Ongkir ${rp(order.shipping_fee)} · <b>Total ${rp(order.total)}</b>`,
    `Bayar: ${esc(paymentLabels[order.payment_method])}`,
    ...(order.tracking_number ? [`Resi: <code>${esc(order.tracking_number)}</code>`] : []),
    ...(order.note ? [`Catatan: ${esc(order.note)}`] : []),
  ];
  const buttons: Reply["buttons"] = [];
  if (order.status === "menunggu_konfirmasi") {
    lines.push("", `Cek ongkir di pemasok, lalu ketik <code>/akbar ongkir ${esc(order.code)} ANGKA</code>.`);
    buttons.push([{ text: "Batalkan", data: `ak:cancel:${order.code}` }]);
  }
  if (order.status === "menunggu_pembayaran") {
    buttons.push([
      { text: "Tandai dibayar", data: `ak:pay:${order.code}` },
      { text: "Batalkan", data: `ak:cancel:${order.code}` },
    ]);
    if (order.shipping_fee > 0) buttons.push([{ text: "Kirim ulang total ke pembeli", url: shippingQuoteLink(order) }]);
  }
  buttons.push([
    { text: "Chat pembeli", url: `https://wa.me/${order.phone}?text=${encodeURIComponent(`Halo ${order.customer_name}, ini admin ${site.name} soal pesanan ${order.code}.`)}` },
    { text: "Buka di admin", url: adminUrl(`/admin/pesanan/${order.id}`) },
  ]);
  return { text: lines.join("\n"), buttons };
}

async function setStatus(code: string, status: OrderStatus, actor: string, extra: Record<string, unknown> = {}): Promise<Reply> {
  const order = await findOrder(code);
  if (!order) return { text: `Pesanan <b>${esc(code)}</b> tidak ditemukan.` };
  const becamePaid = PAID.includes(status) && !order.paid_at;
  const { error } = await db()
    .from("orders")
    .update({ status, ...extra, ...(becamePaid ? { paid_at: new Date().toISOString() } : {}) })
    .eq("id", order.id);
  if (error) return { text: `Gagal mengubah ${esc(code)}: ${esc(error.message)}` };
  await logAction("akbar", actor, `${code} -> ${status}`, `dari ${order.status}`);
  const after: string[] = [`${NAME}: <b>${esc(code)}</b> sekarang <b>${esc(statusLabels[status])}</b>.`];
  if (status === "dibayar") {
    if (order.items.some((i) => i.type === "ebook")) after.push("Link unduh ebook sudah terbuka di halaman pesanan pembeli.");
    if (order.items.some((i) => i.type === "fisik")) after.push("Barang fisik masuk antrian Bulan: <code>/bulan pesan</code>.");
  }
  return { text: after.join("\n") };
}

async function remind(): Promise<Reply> {
  const { data } = await db()
    .from("orders")
    .select("code, customer_name, phone, total, created_at")
    .eq("status", "menunggu_pembayaran")
    .order("created_at", { ascending: true })
    .limit(30);
  const late = ((data ?? []) as Pick<Order, "code" | "customer_name" | "phone" | "total" | "created_at">[]).filter((o) => hoursAgo(o.created_at) >= 24);
  if (!late.length) return { text: `${NAME}: tidak ada pesanan yang belum dibayar lebih dari 24 jam.` };
  return {
    text: [`<b>${NAME}</b>: ${late.length} pesanan belum dibayar lebih dari 24 jam.`, "Tekan tombol untuk membuka WhatsApp dengan pesan pengingat yang sudah terisi."].join("\n"),
    buttons: late.slice(0, 8).map((o) => [
      {
        text: `${o.code} · ${o.customer_name} · ${hoursAgo(o.created_at)} jam`,
        url: `https://wa.me/${o.phone}?text=${encodeURIComponent(
          `Halo ${o.customer_name}, pesanan ${o.code} di ${site.name} sebesar ${rp(o.total)} masih menunggu pembayaran. Detail dan cara bayar: ${site.url}/pesanan/${o.code}. Kalau ada kendala, balas pesan ini ya.`,
        )}`,
      },
    ]),
  };
}

export async function recap(period: "hari" | "bulan"): Promise<Reply> {
  const since = period === "bulan" ? monthStartWIB() : todayStartWIB();
  const supabase = db();
  const [{ data: created }, { data: paid }] = await Promise.all([
    supabase.from("orders").select("id, status, total").gte("created_at", since),
    supabase.from("orders").select("id, total, shipping_fee").in("status", PAID).gte("paid_at", since),
  ]);
  const paidRows = (paid ?? []) as { id: string; total: number; shipping_fee: number }[];
  const paidIds = paidRows.map((r) => r.id);
  let marginSum = 0;
  let marginKnown = true;
  if (paidIds.length) {
    const { data: items } = await supabase
      .from("order_items")
      .select("price, qty, products(source_price, type)")
      .in("order_id", paidIds);
    for (const it of (items ?? []) as unknown as { price: number; qty: number; products: { source_price: number | null; type: string } | null }[]) {
      const cost = it.products?.type === "ebook" ? 0 : it.products?.source_price;
      if (cost == null) marginKnown = false;
      else marginSum += (it.price - cost) * it.qty;
    }
  }
  const createdRows = (created ?? []) as { status: OrderStatus; total: number }[];
  const omzet = paidRows.reduce((n, r) => n + r.total, 0);
  const label = period === "bulan" ? "bulan ini" : "hari ini";
  return {
    text: [
      `<b>Rekap ${label}</b> (WIB)`,
      `Pesanan masuk: ${createdRows.length}`,
      `Dibayar: ${paidRows.length} · Omzet ${rp(omzet)} (termasuk ongkir)`,
      `Perkiraan margin: ${rp(marginSum)}${marginKnown ? "" : " (sebagian produk belum punya harga modal)"}`,
      `Masih menunggu bayar: ${createdRows.filter((r) => r.status === "menunggu_pembayaran").length} · Dibatalkan: ${createdRows.filter((r) => r.status === "dibatalkan").length}`,
    ].join("\n"),
  };
}

export async function akbarCommand(args: string[], actor: string): Promise<Reply> {
  const [sub = "", a1, ...rest] = args;
  switch (sub.toLowerCase()) {
    case "":
    case "ringkas":
    case "pesanan":
      return summary();
    case "cek":
      return detail(normCode(a1));
    case "bayar":
    case "lunas": {
      const code = normCode(a1);
      const order = await findOrder(code);
      if (!order) return { text: `Pesanan <b>${esc(code || "(kosong)")}</b> tidak ditemukan.` };
      if (order.status === "menunggu_konfirmasi") {
        return { text: `Ongkir <b>${esc(code)}</b> belum diisi. Isi dulu: <code>/akbar ongkir ${esc(code)} ANGKA</code>` };
      }
      return {
        text: `Tandai <b>${esc(code)}</b> (${rp(order.total)}, ${esc(order.customer_name)}) sudah dibayar? Pastikan uangnya sudah masuk ke rekening/QRIS.`,
        buttons: [[{ text: "Ya, tandai dibayar", data: `ak:payok:${code}` }, { text: "Jangan", data: `ak:no:${code}` }]],
      };
    }
    case "ongkir": {
      const code = normCode(a1);
      const fee = parseFee(rest.join(""));
      if (!a1 || fee === null) {
        return { text: "Format: <code>/akbar ongkir KODE ANGKA</code>, contoh <code>/akbar ongkir TM7K2QXPRA 11900</code>" };
      }
      const result = await setShippingFee({ code }, fee);
      if ("error" in result) return { text: `${NAME}: ${esc(result.error)}` };
      const o = result.order;
      await logAction("akbar", actor, `${code} ongkir ${fee}`, "menunggu_pembayaran");
      return {
        text: [
          `${NAME}: ongkir <b>${esc(code)}</b> ${rp(fee)}. Total sekarang <b>${rp(o.total)}</b>, status Menunggu pembayaran.`,
          "Tekan tombol di bawah untuk mengirim total dan link pembayaran ke pembeli.",
        ].join("\n"),
        buttons: [[{ text: `Kirim total ke ${o.customer_name}`, url: shippingQuoteLink(o) }]],
      };
    }
    case "kirim": {
      const resi = rest.join(" ").trim() || "";
      if (!a1 || !resi) return { text: "Format: <code>/akbar kirim KODE RESI</code>, contoh <code>/akbar kirim TM7K2QXPRA JP1234567890</code>" };
      return setStatus(normCode(a1), "dikirim", actor, { tracking_number: resi.slice(0, 60) });
    }
    case "selesai":
      return setStatus(normCode(a1), "selesai", actor);
    case "batal": {
      const code = normCode(a1);
      if (!(await findOrder(code))) return { text: `Pesanan <b>${esc(code || "(kosong)")}</b> tidak ditemukan.` };
      return {
        text: `Batalkan pesanan <b>${esc(code)}</b>? Kalau pembeli sudah membayar, kembalikan dananya dulu.`,
        buttons: [[{ text: "Ya, batalkan", data: `ak:cancelok:${code}` }, { text: "Jangan", data: `ak:no:${code}` }]],
      };
    }
    case "ingatkan":
      return remind();
    case "rekap":
      return recap((a1 ?? "").toLowerCase() === "bulan" ? "bulan" : "hari");
    case "bantuan":
    case "help":
      return { text: akbarHelp };
    default:
      return { text: `${NAME} belum paham perintah "${esc(sub)}".\n\n${akbarHelp}` };
  }
}

export async function akbarCallback(action: string, arg: string, actor: string): Promise<Reply> {
  switch (action) {
    case "pay":
      return akbarCommand(["bayar", arg], actor);
    case "payok":
      return setStatus(arg, "dibayar", actor);
    case "cancel":
      return akbarCommand(["batal", arg], actor);
    case "cancelok":
      return setStatus(arg, "dibatalkan", actor);
    case "detail":
      return detail(arg);
    case "no":
      return { text: `Oke, ${esc(arg)} tidak diubah.` };
    default:
      return { text: "Tombol ini sudah tidak berlaku." };
  }
}

/** Notifikasi pesanan baru ke chat admin. */
export async function newOrderMessage(code: string): Promise<Reply | null> {
  const order = await findOrder(code);
  if (!order) return null;
  const items = order.items.map((it) => `• ${esc(it.name)} x${it.qty}`).join("\n");
  const needsFee = order.status === "menunggu_konfirmasi";
  return {
    text: [
      `<b>${NAME}</b>: pesanan baru <b>${esc(order.code)}</b>`,
      `${esc(order.customer_name)} · ${rp(order.total)}${needsFee ? " (belum ongkir)" : ""} · ${esc(paymentLabels[order.payment_method])}`,
      items,
      ...(needsFee
        ? [
            `Kirim ke: ${esc(order.city ?? "")} ${esc(order.postal_code ?? "")}`,
            `Cek ongkir di pemasok, lalu ketik <code>/akbar ongkir ${esc(order.code)} ANGKA</code>.`,
          ]
        : ["Tunggu bukti bayar dari pembeli lewat WhatsApp."]),
    ].join("\n"),
    buttons: [
      [
        needsFee ? { text: "Detail + alamat", data: `ak:detail:${order.code}` } : { text: "Tandai dibayar", data: `ak:pay:${order.code}` },
        ...(needsFee ? [] : [{ text: "Detail", data: `ak:detail:${order.code}` }]),
      ],
      [{ text: "Chat pembeli", url: waLink(`Halo ${order.customer_name}, terima kasih sudah pesan ${order.code} di ${site.name}.`, order.phone) }],
    ],
  };
}

