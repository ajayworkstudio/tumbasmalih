import { NextResponse } from "next/server";
import { recap } from "@/lib/telegram/akbar";
import { notify, telegramReady } from "@/lib/telegram/api";
import { bulanMorning } from "@/lib/telegram/bulan";
import { logAction } from "@/lib/telegram/log";

/**
 * Laporan pagi. Dijalankan Vercel Cron (lihat vercel.json) pukul 00.00 UTC = 07.00 WIB.
 * Vercel mengirim header Authorization: Bearer CRON_SECRET.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  if (!telegramReady()) return NextResponse.json({ ok: false, error: "bot belum dikonfigurasi" });

  const sent: string[] = [];
  const today = await recap("hari");
  // Pagi hari "hari ini" baru mulai; kirim rekap bulan berjalan sebagai gambaran.
  const month = await recap("bulan");
  await notify({ text: `<b>Selamat pagi dari Akbar.</b>\n\n${month.text}\n\nHari ini sejauh ini:\n${today.text.split("\n").slice(1).join("\n")}\n\nAntrian pesanan: /akbar` });
  sent.push("akbar");
  const stock = await bulanMorning();
  if (stock) {
    await notify(stock);
    sent.push("bulan");
  }
  await logAction("sistem", "cron", "laporan pagi", sent.join(", "));
  return NextResponse.json({ ok: true, sent });
}
