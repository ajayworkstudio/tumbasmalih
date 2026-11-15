"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createBrowserSupabase } from "@/lib/supabase/browser";

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError("");
    const fd = new FormData(e.currentTarget);
    const { error } = await createBrowserSupabase().auth.signInWithPassword({
      email: String(fd.get("email") ?? ""),
      password: String(fd.get("password") ?? ""),
    });
    if (error) {
      setError("Email atau password salah.");
      setPending(false);
      return;
    }
    router.replace("/admin");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="flex w-full max-w-90 flex-col gap-4 rounded-3xl border border-line bg-white p-6">
      <h1 className="text-xl font-extrabold">
        tumbas<span className="text-brand">malih</span> <span className="text-muted">admin</span>
      </h1>
      <label className="flex flex-col gap-1.5 text-sm font-semibold">
        Email
        <input name="email" type="email" required autoComplete="email" className="h-12 rounded-lg border border-field px-3.5" />
      </label>
      <label className="flex flex-col gap-1.5 text-sm font-semibold">
        Password
        <input name="password" type="password" required autoComplete="current-password" className="h-12 rounded-lg border border-field px-3.5" />
      </label>
      {error && <p role="alert" className="text-sm text-danger">{error}</p>}
      <button type="submit" disabled={pending} className="h-12 rounded-xl bg-brand font-bold text-white hover:bg-brand-dark disabled:opacity-60">
        {pending ? "Masuk…" : "Masuk"}
      </button>
    </form>
  );
}
