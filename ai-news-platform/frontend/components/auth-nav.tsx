"use client";

import Link from "next/link";
import { useAuth } from "@/components/providers/auth-provider";

export function AuthNav() {
  const { user, loading, signOut } = useAuth();

  if (loading) {
    return (
      <span className="text-xs text-zinc-400 dark:text-zinc-500">
        Auth…
      </span>
    );
  }

  if (!user) {
    return (
      <span className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <Link
          href="/auth/login"
          className="hover:text-violet-600 dark:hover:text-violet-400"
        >
          Sign in
        </Link>
        <Link
          href="/auth/signup"
          className="rounded-full bg-violet-600 px-3 py-1 text-white hover:bg-violet-500 dark:bg-violet-500 dark:hover:bg-violet-400"
        >
          Sign up
        </Link>
      </span>
    );
  }

  return (
    <span className="flex flex-wrap items-center gap-x-3 gap-y-2 text-right">
      {user.role === "admin" ? (
        <Link
          href="/admin"
          className="rounded-full bg-zinc-900 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white dark:bg-zinc-100 dark:text-zinc-900"
        >
          Admin
        </Link>
      ) : null}
      <span className="hidden text-xs text-zinc-500 sm:inline">
        {user.email}
      </span>
      <button
        type="button"
        onClick={() => void signOut()}
        className="text-sm hover:text-violet-600 dark:hover:text-violet-400"
      >
        Sign out
      </button>
    </span>
  );
}
