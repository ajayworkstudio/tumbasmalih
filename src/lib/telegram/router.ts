import "server-only";
import { akbarCallback, akbarCommand, akbarHelp } from "./akbar";
import { edit, esc, isAllowed, send, tg, type Reply } from "./api";
import { bulanCallback, bulanCommand, bulanHelp } from "./bulan";
import { venyaCommand, venyaHelp } from "./venya";

type TgUser = { id: number; first_name?: string };
type TgMessage = { message_id: number; chat: { id: number; type: string }; from?: TgUser; text?: string };
export type TgUpdate = {
  update_id: number;
  message?: TgMessage;
  callback_query?: { id: string; from: TgUser; data?: string; message?: TgMessage };
};

export const BOT_COMMANDS = [
  { command: "akbar", description: "Administrasi: pesanan, pembayaran, rekap" },
  { command: "venya", description: "Marketing: caption, iklan, produk laris" },
  { command: "bulan", description: "Inventori: stok, harga modal, pesan ke marketplace" },
  { command: "bantuan", description: "Daftar semua perintah" },
];

const helpAll: Reply = {
  text: ["<b>Kantor tumbasmalih</b>", "Panggil karyawan dengan namanya, lalu tulis perintahnya.", "", akbarHelp, "", venyaHelp, "", bulanHelp].join("\n"),
};

/** Pisah "/akbar@namabot cek TM123" menjadi ["akbar", ["cek", "TM123"]]. */
export function parseCommand(text: string): { cmd: string; args: string[] } | null {
  const m = text.trim().match(/^\/([a-z_]+)(?:@\w+)?(?:\s+([\s\S]*))?$/i);
  if (!m) return null;
  return { cmd: m[1].toLowerCase(), args: (m[2] ?? "").trim().split(/\s+/).filter(Boolean) };
}

export async function runCommand(cmd: string, args: string[], actor: string): Promise<Reply | null> {
  switch (cmd) {
    case "akbar":
      return akbarCommand(args, actor);
    case "venya":
      return venyaCommand(args, actor);
    case "bulan":
      return bulanCommand(args, actor);
    case "start":
    case "bantuan":
    case "help":
      return helpAll;
    default:
      return null;
  }
}

export async function handleUpdate(update: TgUpdate): Promise<void> {
  if (update.callback_query) {
    const cq = update.callback_query;
    const chatId = cq.message?.chat.id;
    if (!isAllowed(cq.from.id) || !chatId || !cq.message) {
      await tg("answerCallbackQuery", { callback_query_id: cq.id, text: "Kamu tidak punya akses ke bot ini." });
      return;
    }
    await tg("answerCallbackQuery", { callback_query_id: cq.id });
    const [staff, action = "", ...argParts] = (cq.data ?? "").split(":");
    const arg = argParts.join(":");
    const actor = String(cq.from.id);
    const reply =
      staff === "ak" ? await akbarCallback(action, arg, actor) : staff === "bu" ? await bulanCallback(action, arg, actor) : { text: "Tombol ini sudah tidak berlaku." };
    // Pertanyaan konfirmasi menggantikan pesan lama; hasil aksi dikirim sebagai pesan baru supaya riwayat tetap terbaca.
    if (reply.buttons?.length) await send(chatId, reply);
    else {
      await edit(chatId, cq.message.message_id, { text: (cq.message.text ? esc(cq.message.text) + "\n\n" : "") + "→ " + reply.text });
    }
    return;
  }

  const msg = update.message;
  if (!msg?.text) return;
  const parsed = parseCommand(msg.text);
  if (!parsed) return;
  if (!isAllowed(msg.from?.id)) {
    if (parsed.cmd === "start" || parsed.cmd === "id") {
      await send(msg.chat.id, {
        text: `ID Telegram kamu: <code>${msg.from?.id ?? "-"}</code>\nMinta pemilik toko menambahkannya ke env <code>TELEGRAM_ALLOWED_IDS</code>, lalu redeploy.`,
      });
    }
    return;
  }
  const reply = await runCommand(parsed.cmd, parsed.args, String(msg.from?.id ?? ""));
  if (reply) await send(msg.chat.id, reply);
}
