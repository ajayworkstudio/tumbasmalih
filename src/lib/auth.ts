import "server-only";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { hasSupabaseEnv } from "./supabase/env";
import { createSessionClient } from "./supabase/server";

function adminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

/** Kembalikan email admin yang sedang login, atau null. */
export async function getAdminEmail(): Promise<string | null> {
  // Tandai halaman sebagai dinamis walau env belum diisi, supaya tidak di-prerender saat build.
  await connection();
  if (!hasSupabaseEnv()) return null;
  const supabase = await createSessionClient();
  const { data } = await supabase.auth.getUser();
  const email = data.user?.email?.toLowerCase();
  if (!email || !adminEmails().includes(email)) return null;
  return email;
}

/** Wajib di setiap halaman & action admin. Mengarahkan ke login kalau bukan admin. */
export async function requireAdmin(): Promise<string> {
  const email = await getAdminEmail();
  if (!email) redirect("/admin/login");
  return email;
}
