import "server-only";
import { createClient } from "@supabase/supabase-js";
import { supabaseAnonKey, supabaseUrl } from "./env";

/**
 * Klien anonim tanpa sesi, untuk membaca katalog publik di dalam fungsi "use cache".
 * Hanya bisa membaca kolom yang di-GRANT ke role anon (lihat supabase/schema.sql).
 */
export function createPublicClient() {
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
