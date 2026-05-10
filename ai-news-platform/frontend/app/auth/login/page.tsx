"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/providers/auth-provider";

export default function LoginPage() {
  const router = useRouter();
  const { signIn, user } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const canSubmit = useMemo(
    () => email.includes("@") && password.length >= 8 && !busy,
    [email, password, busy],
  );

  useEffect(() => {
    if (user) router.replace("/");
  }, [user, router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setBusy(true);
    try {
      await signIn(email, password);
    } catch {
      setMessage("Invalid credentials or inactive account.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto max-w-md px-4 py-16 sm:px-6">
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        Sign in
      </h1>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
        Access your bookmarks and editorial tools once they are wired through
        the API.
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
        <div>
          <div className="flex items-center justify-between gap-2">
            <label
              htmlFor="password"
              className="text-xs font-semibold uppercase tracking-wide text-zinc-500"
            >
              Password
            </label>
            <Link
              href="/auth/forgot-password"
              className="text-xs font-medium text-violet-600 hover:text-violet-500 dark:text-violet-400"
            >
              Forgot password?
            </Link>
          </div>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            className="mt-1 h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm outline-none ring-violet-500/40 focus:border-violet-600 focus:ring-4 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
          />
        </div>
        {message ? (
          <p className="text-sm text-red-600 dark:text-red-400">{message}</p>
        ) : null}
        <button
          type="submit"
          disabled={!canSubmit}
          className="h-11 w-full rounded-xl bg-violet-600 text-sm font-semibold text-white transition enabled:hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {busy ? "Signing in…" : "Continue"}
        </button>
      </form>
      <p className="mt-6 text-sm text-zinc-600 dark:text-zinc-400">
        No account?{" "}
        <Link
          href="/auth/signup"
          className="font-medium text-violet-600 hover:text-violet-500 dark:text-violet-400"
        >
          Create one
        </Link>
      </p>
    </main>
  );
}
