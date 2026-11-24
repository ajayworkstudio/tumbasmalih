import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

export type Staff = "akbar" | "venya" | "bulan" | "sistem";

/** Catat aksi bot ke tabel bot_log. Gagal mencatat tidak boleh menggagalkan perintah. */
export async function logAction(staff: Staff, actor: string, command: string, result: string) {
  try {
    const { error } = await createAdminClient()
      .from("bot_log")
      .insert({ staff, actor, command: command.slice(0, 300), result: result.slice(0, 500) });
    if (error) console.error("bot_log:", error.message);
  } catch (e) {
    console.error("bot_log:", e);
  }
}
