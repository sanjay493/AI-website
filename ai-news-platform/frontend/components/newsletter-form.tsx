"use client";

import { useState } from "react";

export function NewsletterForm({ compact = false }: { compact?: boolean }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sent" | "error">("idle");

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed || !trimmed.includes("@")) {
      setStatus("error");
      return;
    }
    setStatus("sent");
    setEmail("");
  }

  return (
    <div className={compact ? "" : "rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/40"}>
      <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
        Newsletter
      </p>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
        Weekly digest — no spam. (Demo form; connect an API route next.)
      </p>
      <form onSubmit={onSubmit} className="mt-4 flex flex-col gap-3 sm:flex-row">
        <label className="sr-only" htmlFor="newsletter-email">
          Email
        </label>
        <input
          id="newsletter-email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => {
            setStatus("idle");
            setEmail(e.target.value);
          }}
          className="h-11 w-full flex-1 rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none ring-violet-500/30 placeholder:text-zinc-400 focus:border-violet-500 focus:ring-4 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:placeholder:text-zinc-500"
        />
        <button
          type="submit"
          className="h-11 shrink-0 rounded-xl bg-violet-600 px-5 text-sm font-semibold text-white transition hover:bg-violet-500 active:bg-violet-700"
        >
          Subscribe
        </button>
      </form>
      {status === "sent" ? (
        <p className="mt-3 text-sm text-emerald-600 dark:text-emerald-400">
          Thanks — you are on the list (demo).
        </p>
      ) : null}
      {status === "error" ? (
        <p className="mt-3 text-sm text-red-600 dark:text-red-400">
          Enter a valid email address.
        </p>
      ) : null}
    </div>
  );
}
