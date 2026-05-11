"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/providers/auth-provider";
import { fetchAdminStatus } from "@/lib/auth-credentials";
import { runNewsIngest } from "@/lib/admin-news-ingest";

export default function AdminPage() {
  const { accessToken, user, loading } = useAuth();
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ingestBusy, setIngestBusy] = useState(false);
  const [ingestMsg, setIngestMsg] = useState<string | null>(null);

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

      <div className="mt-8 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/40">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          External news agent
        </h2>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Pulls a weekly-style bundle: RSS/Atom sources (arXiv, blogs,{" "}
          <span className="font-medium">Google News (AI)</span>, curated channels) plus
          optional{" "}
          <span className="font-medium">YouTube regional trending</span> in Science
          &amp; Technology when{" "}
          <code className="rounded bg-zinc-100 px-1 text-xs dark:bg-zinc-800">
            YOUTUBE_API_KEY
          </code>{" "}
          is set. Each run stores summaries + links as <strong>news</strong> posts
          (not full transcripts). For hands-free weekly runs, set{" "}
          <code className="rounded bg-zinc-100 px-1 text-xs dark:bg-zinc-800">
            NEWS_INGEST_CRON_SECRET
          </code>{" "}
          and call{" "}
          <code className="rounded bg-zinc-100 px-1 text-xs dark:bg-zinc-800">
            POST /api/v1/admin/news-agent/ingest/scheduled
          </code>{" "}
          with header{" "}
          <code className="rounded bg-zinc-100 px-1 text-xs dark:bg-zinc-800">
            X-News-Ingest-Secret
          </code>{" "}
          from cron.
        </p>
        <button
          type="button"
          disabled={ingestBusy || !accessToken}
          onClick={() => {
            if (!accessToken) return;
            setIngestMsg(null);
            setIngestBusy(true);
            void (async () => {
              try {
                const r = await runNewsIngest(accessToken);
                const parts = [
                  `Created ${r.created_slugs.length} article(s).`,
                  r.skipped_duplicates
                    ? `Skipped ${r.skipped_duplicates} duplicate(s).`
                    : null,
                  r.errors.length
                    ? `Feed errors: ${r.errors.join("; ")}`
                    : null,
                  r.notes?.length
                    ? `Note: ${r.notes.join(" ")}`
                    : null,
                ].filter(Boolean);
                setIngestMsg(parts.join(" "));
              } catch (e) {
                setIngestMsg(
                  e instanceof Error ? e.message : "Ingest failed",
                );
              } finally {
                setIngestBusy(false);
              }
            })();
          }}
          className="mt-4 rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
        >
          {ingestBusy ? "Fetching feeds…" : "Run ingest now"}
        </button>
        {ingestMsg ? (
          <p className="mt-3 text-sm text-zinc-700 dark:text-zinc-300">
            {ingestMsg}
          </p>
        ) : null}
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
