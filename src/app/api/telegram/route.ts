import { NextResponse } from "next/server";
import { telegramConfig, telegramReady } from "@/lib/telegram/api";
import { handleUpdate, type TgUpdate } from "@/lib/telegram/router";

/** Webhook Telegram. Hanya menerima request yang membawa secret token dari setWebhook. */
export async function POST(request: Request) {
  if (!telegramReady()) return NextResponse.json({ ok: false, error: "bot belum dikonfigurasi" }, { status: 503 });
  if (request.headers.get("x-telegram-bot-api-secret-token") !== telegramConfig.secret) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  let update: TgUpdate;
  try {
    update = (await request.json()) as TgUpdate;
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  try {
    await handleUpdate(update);
  } catch (e) {
    // Tetap balas 200 supaya Telegram tidak mengirim ulang update yang sama terus-menerus.
    console.error("telegram webhook:", e);
  }
  return NextResponse.json({ ok: true });
}
