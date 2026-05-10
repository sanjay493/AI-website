"use client";

import { useState } from "react";
import Link from "next/link";
import { forgotPassword } from "@/lib/auth-api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setError(null);
    setBusy(true);
    try {
      const res = await forgotPassword(email);
      setMessage(res.detail);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to start reset flow.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto max-w-md px-4 py-16 sm:px-6">
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        Forgot password
      </h1>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
        We never reveal whether an account exists — you will receive the reset
        link only if Docker logs show one (SMTP integration comes next).
      </p>
      <form onSubmit={(e) => void onSubmit(e)} className="mt-8 space-y-4">
        <div>
          <label
            htmlFor="email"
            className="text-xs font-semibold uppercase tracking-wide text-zinc-500"
          >
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="mt-1 h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm outline-none ring-violet-500/40 focus:border-violet-600 focus:ring-4 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
          />
        </div>
        {error ? (
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        ) : null}
        {message ? (
          <p className="text-sm text-emerald-600 dark:text-emerald-400">
            {message}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={busy || !email.includes("@")}
          className="h-11 w-full rounded-xl bg-violet-600 text-sm font-semibold text-white transition enabled:hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {busy ? "Sending…" : "Send reset link"}
        </button>
      </form>
      <p className="mt-6 text-sm text-zinc-600 dark:text-zinc-400">
        <Link
          href="/auth/login"
          className="font-medium text-violet-600 hover:text-violet-500 dark:text-violet-400"
        >
          Back to sign in
        </Link>
      </p>
    </main>
  );
}
