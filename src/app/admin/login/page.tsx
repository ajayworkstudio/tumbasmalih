import type { Metadata } from "next";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Masuk admin", robots: { index: false } };

export default function LoginPage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 px-5 py-16">
      {!hasSupabaseEnv() && (
        <p role="alert" className="w-full max-w-90 rounded-2xl border border-danger bg-[#FDECEC] p-4 text-sm text-danger">
          Env Supabase belum terbaca oleh deployment ini, jadi toko dan admin belum tersambung ke database. Isi{" "}
          <code>NEXT_PUBLIC_SUPABASE_URL</code> dan <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> di Vercel, lalu Redeploy.
        </p>
      )}
      <LoginForm />
    </main>
  );
}
