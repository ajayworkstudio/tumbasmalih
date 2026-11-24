import "server-only";

/** Baris tombol inline Telegram. */
export type Buttons = { text: string; data?: string; url?: string }[][];

export type Reply = { text: string; buttons?: Buttons };

const envValue = (name: string) => (process.env[name] ?? "").trim().replace(/^["']|["']$/g, "");

export const telegramConfig = {
  token: envValue("TELEGRAM_BOT_TOKEN"),
  secret: envValue("TELEGRAM_WEBHOOK_SECRET"),
  /** ID Telegram yang boleh memerintah bot, dipisah koma. */
  allowedIds: (process.env.TELEGRAM_ALLOWED_IDS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),
  /** Chat tujuan notifikasi otomatis (ID pribadi atau grup). Default: ID pertama yang diizinkan. */
  get notifyChatId() {
    return (process.env.TELEGRAM_NOTIFY_CHAT_ID ?? "").trim() || this.allowedIds[0] || "";
  },
  apiBase: (process.env.TELEGRAM_API_BASE ?? "https://api.telegram.org").replace(/\/$/, ""),
};

/** Cukup token + secret supaya webhook bisa dipasang. Tanpa ID yang diizinkan, bot hanya membalas /start dengan ID pengirim. */
export function telegramReady(): boolean {
  return Boolean(telegramConfig.token && telegramConfig.secret);
}

export function isAllowed(userId: number | string | undefined): boolean {
  return userId !== undefined && telegramConfig.allowedIds.includes(String(userId));
}

/** Escape untuk parse_mode HTML. */
export function esc(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/** Seperti tg(), tapi mengembalikan alasan penolakan dari Telegram. */
export async function tgCall<T = unknown>(
  method: string,
  body: Record<string, unknown>,
): Promise<{ ok: true; result: T } | { ok: false; error: string }> {
  if (!telegramConfig.token) return { ok: false, error: "TELEGRAM_BOT_TOKEN kosong" };
  try {
    const res = await fetch(`${telegramConfig.apiBase}/bot${telegramConfig.token}/${method}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    });
    const json = (await res.json()) as { ok: boolean; result?: T; description?: string; error_code?: number };
    if (json.ok) return { ok: true, result: json.result as T };
    return { ok: false, error: `${json.error_code ?? res.status} ${json.description ?? "tanpa keterangan"}` };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

export async function tg<T = unknown>(method: string, body: Record<string, unknown>): Promise<T | null> {
  if (!telegramConfig.token) return null;
  try {
    const res = await fetch(`${telegramConfig.apiBase}/bot${telegramConfig.token}/${method}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    });
    const json = (await res.json()) as { ok: boolean; result?: T; description?: string };
    if (!json.ok) console.error(`telegram ${method}:`, json.description);
    return json.ok ? (json.result ?? null) : null;
  } catch (e) {
    console.error(`telegram ${method}:`, e);
    return null;
  }
}

const LIMIT = 4000;

function markup(buttons?: Buttons) {
  if (!buttons?.length) return undefined;
  return {
    inline_keyboard: buttons.map((row) =>
      row.map((b) => (b.url ? { text: b.text, url: b.url } : { text: b.text, callback_data: (b.data ?? "").slice(0, 64) })),
    ),
  };
}

export async function send(chatId: number | string, reply: Reply) {
  const text = reply.text.length > LIMIT ? reply.text.slice(0, LIMIT) + "\n…" : reply.text;
  return tg("sendMessage", {
    chat_id: chatId,
    text,
    parse_mode: "HTML",
    link_preview_options: { is_disabled: true },
    reply_markup: markup(reply.buttons),
  });
}

export async function edit(chatId: number | string, messageId: number, reply: Reply) {
  return tg("editMessageText", {
    chat_id: chatId,
    message_id: messageId,
    text: reply.text.slice(0, LIMIT),
    parse_mode: "HTML",
    link_preview_options: { is_disabled: true },
    reply_markup: markup(reply.buttons),
  });
}

/** Kirim ke chat notifikasi bawaan (dipakai pesanan baru dan cron). */
export async function notify(reply: Reply) {
  if (!telegramReady() || !telegramConfig.notifyChatId) return null;
  return send(telegramConfig.notifyChatId, reply);
}
