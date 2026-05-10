"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/providers/auth-provider";

export default function SignupPage() {
  const router = useRouter();
  const { signUp, user } = useAuth();
  const [fullName, setFullName] = useState("");
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
      await signUp({
        email,
        password,
        full_name: fullName.trim() ? fullName.trim() : null,
      });
    } catch (err) {
      setMessage(
        err instanceof Error ? err.message : "Could not create your account.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto max-w-md px-4 py-16 sm:px-6">
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        Create account
      </h1>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
        Sign up mirrors the backend register endpoint. Use the{" "}
        <code className="text-xs">FIRST_ADMIN_EMAIL</code> env to grant your first
        privileged user.
      </p>
      <form onSubmit={(e) => void onSubmit(e)} className="mt-8 space-y-4">
        <div>
          <label
            htmlFor="fullName"
            className="text-xs font-semibold uppercase tracking-wide text-zinc-500"
          >
            Full name (optional)
          </label>
          <input
            id="fullName"
            name="fullName"
            type="text"
            autoComplete="name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="mt-1 h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm outline-none ring-violet-500/40 focus:border-violet-600 focus:ring-4 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
          />
        </div>
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
          <label
            htmlFor="password"
            className="text-xs font-semibold uppercase tracking-wide text-zinc-500"
          >
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            maxLength={72}
            className="mt-1 h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm outline-none ring-violet-500/40 focus:border-violet-600 focus:ring-4 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
          />
          <p className="mt-1 text-xs text-zinc-500">
            bcrypt supports up to 72 characters — keep passwords within that
            bound.
          </p>
        </div>
        {message ? (
          <p className="text-sm text-red-600 dark:text-red-400">{message}</p>
        ) : null}
        <button
          type="submit"
          disabled={!canSubmit}
          className="h-11 w-full rounded-xl bg-violet-600 text-sm font-semibold text-white transition enabled:hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {busy ? "Creating account…" : "Create account"}
        </button>
      </form>
      <p className="mt-6 text-sm text-zinc-600 dark:text-zinc-400">
        Already registered?{" "}
        <Link
          href="/auth/login"
          className="font-medium text-violet-600 hover:text-violet-500 dark:text-violet-400"
        >
          Sign in instead
        </Link>
      </p>
    </main>
  );
}
