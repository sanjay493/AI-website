"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/providers/auth-provider";
import {
  adminDeleteArticle,
  adminListArticles,
  type AdminArticle,
} from "@/lib/admin-articles-api";

const ADMIN_CATEGORIES = [
  { value: "", label: "All categories" },
  { value: "news", label: "News" },
  { value: "articles", label: "Articles" },
  { value: "tutorials", label: "Tutorials" },
  { value: "trends", label: "Trends" },
] as const;

/** One-click filters targeting typical ingest surfaces (RSS + YouTube). */
const FILTER_PRESETS: {
  label: string;
  patch: Partial<{ category: string; q: string }>;
}[] = [
  { label: "YouTube-linked", patch: { q: "youtube" } },
  { label: "Feed-ingest slug", patch: { q: "feed-" } },
  { label: "News only", patch: { category: "news", q: "" } },
];

export default function AdminArticlesPage() {
  const { accessToken, user, loading } = useAuth();
  const [items, setItems] = useState<AdminArticle[]>([]);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [filters, setFilters] = useState<{ category: string; q: string }>({
    category: "",
    q: "",
  });

  const kwInputRef = useRef<HTMLInputElement>(null);

  async function refreshList(
    token: string,
    active: { category: string; q: string },
  ) {
    const page = await adminListArticles(token, {
      limit: 200,
      category: active.category.trim() || undefined,
      q: active.q.trim() || undefined,
    });
    setItems(page.items);
  }

  useEffect(() => {
    if (loading || !accessToken || user?.role !== "admin") return;
    void (async () => {
      try {
        setErr(null);
        await refreshList(accessToken, { category: "", q: "" });
      } catch (e) {
        setErr(e instanceof Error ? e.message : "Failed to load articles");
      }
    })();
  }, [loading, accessToken, user?.role]);

  function applyMergedAndFetch(
    next: { category: string; q: string },
    token: string | null,
  ) {
    if (!token) return;
    setFilters(next);
    void (async () => {
      try {
        setErr(null);
        await refreshList(token, next);
      } catch (e) {
        setErr(e instanceof Error ? e.message : "Failed to load articles");
      }
    })();
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
        <p className="text-sm text-zinc-500">Loading…</p>
      </main>
    );
  }

  if (!user || user.role !== "admin" || !accessToken) {
    return (
      <main className="mx-auto max-w-lg px-4 py-16 text-center sm:px-6">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Admin sign-in required.
        </p>
        <Link
          href="/auth/login"
          className="mt-4 inline-block text-violet-600 hover:underline"
        >
          Sign in
        </Link>
      </main>
    );
  }

  const filtersActive =
    Boolean(filters.category.trim()) || Boolean(filters.q.trim());

  async function onDelete(slug: string) {
    if (!window.confirm(`Delete “${slug}”? This cannot be undone.`)) return;
    if (!accessToken) return;
    setMsg(null);
    setErr(null);
    try {
      await adminDeleteArticle(accessToken, slug);
      setMsg("Article deleted.");
      await refreshList(accessToken, filters);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Delete failed");
    }
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
            Articles
          </h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Public site reads from the same database via{" "}
            <code className="text-xs">GET /articles</code>. Filter rows by keyword
            (title, slug, excerpt, body, external link) — e.g.
            &quot;youtube&quot; or &quot;feed-&quot; for ingest mirrors.
          </p>
        </div>
        <Link
          href="/admin/articles/new"
          className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-500"
        >
          New article
        </Link>
      </div>

      {msg ? (
        <p className="mt-4 text-sm text-emerald-600 dark:text-emerald-400">
          {msg}
        </p>
      ) : null}
      {err ? (
        <p className="mt-4 text-sm text-red-600 dark:text-red-400">{err}</p>
      ) : null}

      <div className="mt-6 rounded-2xl border border-zinc-200 bg-zinc-50/80 px-4 py-4 dark:border-zinc-800 dark:bg-zinc-900/30">
        <div className="flex flex-wrap items-end gap-3">
          <label className="min-w-[10rem] flex-1 shrink-0 text-sm">
            <span className="mb-1 block font-medium text-zinc-700 dark:text-zinc-300">
              Category
            </span>
            <select
              value={filters.category}
              className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-zinc-900 shadow-sm outline-none ring-violet-500 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
              onChange={(e) => {
                const next = {
                  category: e.target.value,
                  q: filters.q,
                };
                applyMergedAndFetch(next, accessToken);
              }}
            >
              {ADMIN_CATEGORIES.map((opt) => (
                <option key={opt.label} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>
          <label className="min-w-[14rem] flex-[2] shrink-0 text-sm">
            <span className="mb-1 block font-medium text-zinc-700 dark:text-zinc-300">
              Keyword filter
            </span>
            <input
              type="search"
              value={filters.q}
              placeholder="youtube, feed-, etc."
              autoComplete="off"
              spellCheck={false}
              className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-zinc-900 shadow-sm outline-none ring-violet-500 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
              ref={kwInputRef}
              onChange={(e) =>
                setFilters((f) => ({
                  ...f,
                  q: e.target.value,
                }))
              }
              onKeyDown={(e) => {
                if (e.key !== "Enter") return;
                e.preventDefault();
                const qTrim = e.currentTarget.value.trim();
                applyMergedAndFetch(
                  { category: filters.category, q: qTrim },
                  accessToken,
                );
              }}
            />
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800 dark:bg-violet-600 dark:hover:bg-violet-500"
              onClick={() =>
                applyMergedAndFetch(
                  {
                    category: filters.category,
                    q: (kwInputRef.current?.value ?? filters.q).trim(),
                  },
                  accessToken,
                )
              }
            >
              Apply keyword
            </button>
            <button
              type="button"
              className="rounded-xl border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
              onClick={() =>
                applyMergedAndFetch({ category: "", q: "" }, accessToken)
              }
            >
              Clear all
            </button>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="mr-2 self-center text-xs font-semibold uppercase tracking-wide text-zinc-500">
            Quick presets
          </span>
          {FILTER_PRESETS.map((p) => (
            <button
              key={p.label}
              type="button"
              className="rounded-full bg-white px-3 py-1.5 text-xs font-medium text-violet-800 ring-1 ring-violet-200 hover:bg-violet-50 dark:bg-zinc-950 dark:text-violet-300 dark:ring-violet-900 dark:hover:bg-violet-950/60"
              onClick={() =>
                applyMergedAndFetch({ ...filters, ...p.patch }, accessToken)
              }
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-8 overflow-x-auto rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900/40">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900">
            <tr>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Slug</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Published</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {items.map((a) => (
              <tr key={a.id}>
                <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-100">
                  {a.title}
                </td>
                <td className="max-w-[10rem] truncate px-4 py-3 text-zinc-600 dark:text-zinc-400">
                  {a.slug}
                </td>
                <td className="px-4 py-3 text-zinc-600">{a.category}</td>
                <td className="px-4 py-3 text-zinc-500">{a.published_at}</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex flex-wrap justify-end gap-2">
                    <Link
                      href={`/admin/articles/${encodeURIComponent(a.slug)}/edit`}
                      className="text-violet-600 hover:underline dark:text-violet-400"
                    >
                      Edit
                    </Link>
                    <Link
                      href={`/blog/${a.slug}`}
                      className="text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                    >
                      View
                    </Link>
                    <button
                      type="button"
                      onClick={() => void onDelete(a.slug)}
                      className="text-red-600 hover:underline dark:text-red-400"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {items.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-zinc-500">
            {filtersActive
              ? "No articles match the current filters."
              : "No articles yet — seed rows load on API startup when the table is empty."}
          </p>
        ) : null}
      </div>
    </main>
  );
}
