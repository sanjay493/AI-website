"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/providers/auth-provider";
import { fetchAdminStatus } from "@/lib/auth-credentials";

export default function AdminPage() {
  const { accessToken, user, loading } = useAuth();
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (loading || !accessToken || user?.role !== "admin") return;
      try {
        const res = await fetchAdminStatus(accessToken);
        if (!cancelled)
          setStatus(`Signed in as ${res.email} (${res.role})`);
      } catch (err) {
        if (!cancelled)
          setError(
            err instanceof Error ? err.message : "Unable to load admin status",
          );
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [accessToken, user, loading]);

  if (loading) {
    return (
      <main className="mx-auto max-w-lg px-4 py-16 text-center sm:px-6">
        <p className="text-sm text-zinc-500">Loading…</p>
      </main>
    );
  }

  if (!user || user.role !== "admin") {
    return (
      <main className="mx-auto max-w-lg px-4 py-16 text-center sm:px-6">
        <p className="text-sm font-semibold text-violet-600 dark:text-violet-400">
          Restricted
        </p>
        <h1 className="mt-3 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Admin access only
        </h1>
        <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
          Sign in as an administrator, then return here.
        </p>
        <p className="mt-10">
          <Link
            href="/auth/login"
            className="rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-violet-500"
          >
            Go to sign in
          </Link>
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        Admin dashboard
      </h1>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
        Manage corpus content stored in Postgres via the authenticated API.
      </p>

      <div className="mt-8 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/40">
        {error ? (
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        ) : (
          <p className="text-sm text-zinc-700 dark:text-zinc-200">{status}</p>
        )}
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        <Link
          href="/admin/articles"
          className="rounded-2xl border border-violet-200 bg-violet-50 p-5 text-zinc-900 transition hover:border-violet-300 dark:border-violet-900/50 dark:bg-violet-950/30 dark:text-zinc-50"
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-violet-600 dark:text-violet-400">
            Content
          </p>
          <p className="mt-2 text-lg font-semibold">Article management</p>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            List, create, edit, or remove posts.
          </p>
        </Link>
      </div>
    </main>
  );
}
