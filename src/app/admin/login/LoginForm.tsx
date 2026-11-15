"use client";
import { useActionState } from "react";
import { signIn, type LoginState } from "../actions";

const field = "h-12 rounded-lg border border-field px-3.5";

export function LoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(signIn, {});

  return (
    <form action={action} method="post" className="flex w-full max-w-90 flex-col gap-4 rounded-3xl border border-line bg-white p-6">
      <h1 className="text-xl font-extrabold">
        tumbas<span className="marker">malih</span> <span className="text-muted">admin</span>
      </h1>
      <label className="flex flex-col gap-1.5 text-sm font-semibold">
        Email
        <input name="email" type="email" required autoComplete="email" defaultValue={state.email} className={field} />
      </label>
      <label className="flex flex-col gap-1.5 text-sm font-semibold">
        Password
        <input name="password" type="password" required autoComplete="current-password" className={field} />
      </label>
      {state.error && (
        <p role="alert" className="rounded-lg border border-danger bg-[#FDECEC] p-3 text-sm font-medium text-danger">
          {state.error}
        </p>
      )}
      <button type="submit" disabled={pending} className="h-12 rounded-xl bg-brand font-bold text-white hover:bg-brand-dark disabled:opacity-60">
        {pending ? "Masuk…" : "Masuk"}
      </button>
    </form>
  );
}
