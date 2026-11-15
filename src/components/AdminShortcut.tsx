"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { createBrowserSupabase } from "@/lib/supabase/browser";

/**
 * Tombol pintas untuk admin yang sedang login. Pengunjung biasa tidak punya sesi, jadi tidak melihat apa-apa.
 * Hak akses tetap dicek di server saat halaman admin dibuka.
 */
export function AdminShortcut({ href, label }: { href: string; label: string }) {
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return;
    let active = true;
    createBrowserSupabase()
      .auth.getSession()
      .then(({ data }) => {
        if (active) setLoggedIn(Boolean(data.session));
      });
    return () => {
      active = false;
    };
  }, []);

  if (!loggedIn) return null;
  return (
    <Link
      href={href}
      className="flex h-11 items-center gap-2 self-start rounded-xl border-2 border-dashed border-brand px-4 text-sm font-bold text-brand hover:bg-brand-soft"
    >
      {label}
    </Link>
  );
}
