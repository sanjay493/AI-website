"use client";

import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { resetPassword } from "@/lib/auth-api";

function ResetInner() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const canSubmit = useMemo(
    () => token.length >= 16 && password.length >= 8 && !busy,
    [token, password, busy],
  );

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setBusy(true);
    try {
      const res = await resetPassword({ token, new_password: password });
      setMessage(res.detail);
    } catch (err) {
      setMessage(
        err instanceof Error ? err.message : "Reset failed. Request a new link.",
      );
    } finally {
      setBusy(false);
    }
  }

  if (!token) {
    return (
      <p className="text-sm text-red-600 dark:text-red-400">
        Missing token. Request a reset link again.
      </p>
    );
  }

  return (
    <>
      <form onSubmit={(e) => void onSubmit(e)} className="mt-8 space-y-4">
        <div>
          <label
            htmlFor="password"
            className="text-xs font-semibold uppercase tracking-wide text-zinc-500"
          >
            New password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            value={password}
            minLength={8}
            maxLength={72}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="mt-1 h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm outline-none ring-violet-500/40 focus:border-violet-600 focus:ring-4 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
          />
        </div>
        {message ? (
          <p
            className={
              message.toLowerCase().includes("updated")
                ? "text-sm text-emerald-600 dark:text-emerald-400"
                : "text-sm text-red-600 dark:text-red-400"
            }
          >
            {message}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={!canSubmit}
          className="h-11 w-full rounded-xl bg-violet-600 text-sm font-semibold text-white transition enabled:hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {busy ? "Updating…" : "Update password"}
        </button>
      </form>
      <p className="mt-6 text-sm text-zinc-600 dark:text-zinc-400">
        <Link
          href="/auth/login"
          className="font-medium text-violet-600 hover:text-violet-500 dark:text-violet-400"
        >
          Continue to sign in
        </Link>
      </p>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <main className="mx-auto max-w-md px-4 py-16 sm:px-6">
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        Reset password
      </h1>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
        Paste the emailed link URL or reopen the Docker log line that contains{" "}
        <code className="text-xs">reset-password</code>.
      </p>
      <Suspense
        fallback={
          <p className="mt-8 text-sm text-zinc-500">Loading reset form…</p>
        }
      >
        <ResetInner />
      </Suspense>
    </main>
  );
}
