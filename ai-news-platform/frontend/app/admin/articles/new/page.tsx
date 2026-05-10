"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/providers/auth-provider";
import { adminCreateArticle } from "@/lib/admin-articles-api";
import { categories } from "@/lib/content";

const RT_MIN = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 15, 20, 25, 30, 45, 60];

function paragraphsFromBody(raw: string): string[] {
  return raw
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}

export default function NewArticlePage() {
  const router = useRouter();
  const { accessToken, user, loading } = useAuth();
  const [slug, setSlug] = useState("");
  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [category, setCategory] = useState("news");
  const [publishedAt, setPublishedAt] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [readingTime, setReadingTime] = useState(6);
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!accessToken) return;
    const paragraphs = paragraphsFromBody(body);
    if (!paragraphs.length) {
      setError("Enter at least one paragraph (blocks separated by a blank line).");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await adminCreateArticle(accessToken, {
        slug,
        title,
        excerpt,
        category,
        published_at: publishedAt,
        reading_time_minutes: readingTime,
        paragraphs,
      });
      router.replace(`/admin/articles/${encodeURIComponent(slug)}/edit`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <p className="text-sm text-zinc-500">Loading…</p>
      </main>
    );
  }

  if (!accessToken || user?.role !== "admin") {
    return (
      <main className="mx-auto max-w-lg px-4 py-16 sm:px-6">
        <p className="text-sm text-zinc-600">Admin sign-in required.</p>
        <Link href="/auth/login" className="mt-2 inline-block text-violet-600">
          Sign in
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <Link
        href="/admin/articles"
        className="text-sm font-medium text-violet-600 hover:underline dark:text-violet-400"
      >
        ← All articles
      </Link>
      <h1 className="mt-6 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        New article
      </h1>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
        Slug URL style: lowercase words with hyphens. Body paragraphs = blocks
        separated by a blank line.
      </p>

      <form onSubmit={(e) => void onSubmit(e)} className="mt-8 space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Slug
            </label>
            <input
              required
              value={slug}
              onChange={(e) =>
                setSlug(e.target.value.trim().toLowerCase().replace(/\s+/g, "-"))
              }
              pattern="^[a-z0-9]+(?:-[a-z0-9]+)*$"
              className="mt-1 h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm dark:border-zinc-700 dark:bg-zinc-950"
            />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="mt-1 h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm dark:border-zinc-700 dark:bg-zinc-950"
            >
              {categories.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
            Title
          </label>
          <input
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm dark:border-zinc-700 dark:bg-zinc-950"
          />
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
            Excerpt
          </label>
          <textarea
            required
            rows={3}
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Published date
            </label>
            <input
              type="date"
              required
              value={publishedAt}
              onChange={(e) => setPublishedAt(e.target.value)}
              className="mt-1 h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm dark:border-zinc-700 dark:bg-zinc-950"
            />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Reading time (minutes)
            </label>
            <select
              value={readingTime}
              onChange={(e) => setReadingTime(Number(e.target.value))}
              className="mt-1 h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm dark:border-zinc-700 dark:bg-zinc-950"
            >
              {RT_MIN.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
            Body
          </label>
          <textarea
            required
            rows={14}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="First paragraph...\n\nSecond paragraph..."
            className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 font-mono text-sm dark:border-zinc-700 dark:bg-zinc-950"
          />
        </div>
        {error ? (
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        ) : null}
        <button
          type="submit"
          disabled={busy}
          className="rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-violet-500 disabled:opacity-40"
        >
          {busy ? "Saving…" : "Create article"}
        </button>
      </form>
    </main>
  );
}
