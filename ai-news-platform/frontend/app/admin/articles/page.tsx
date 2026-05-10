"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/providers/auth-provider";
import {
  adminDeleteArticle,
  adminListArticles,
  type AdminArticle,
} from "@/lib/admin-articles-api";

export default function AdminArticlesPage() {
  const { accessToken, user, loading } = useAuth();
  const [items, setItems] = useState<AdminArticle[]>([]);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function reload(token: string) {
    const page = await adminListArticles(token, { limit: 100 });
    setItems(page.items);
  }

  useEffect(() => {
    if (loading || !accessToken || user?.role !== "admin") return;
    void (async () => {
      try {
        setErr(null);
        await reload(accessToken);
      } catch (e) {
        setErr(e instanceof Error ? e.message : "Failed to load articles");
      }
    })();
  }, [accessToken, user, loading]);

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

  async function onDelete(slug: string) {
    if (!window.confirm(`Delete “${slug}”? This cannot be undone.`)) return;
    if (!accessToken) return;
    setMsg(null);
    setErr(null);
    try {
      await adminDeleteArticle(accessToken, slug);
      setMsg("Article deleted.");
      await reload(accessToken);
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
            <code className="text-xs">GET /articles</code>.
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
            No articles yet — seed rows load on API startup when the table is empty.
          </p>
        ) : null}
      </div>
    </main>
  );
}
