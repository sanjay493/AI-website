import { cache } from "react";

import type { Article } from "@/lib/content";
import { articles as fallbackArticles } from "@/lib/content";
import { getServerApiUrl } from "@/lib/server-api";

const fetchTimeoutMs = 12_000;

type PageResp<T> = {
  items: T[];
  meta: { total: number; limit: number; offset: number; pages: number };
};

type ApiArticleListRow = {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  published_at: string;
  reading_time_minutes: number;
};

type ApiArticleFull = ApiArticleListRow & { paragraphs: string[] };

export function apiToArticleMinimal(row: ApiArticleListRow): Article {
  return {
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    category: row.category,
    publishedAt: row.published_at,
    readingTimeMinutes: row.reading_time_minutes,
    paragraphs: [],
  };
}

export function apiToArticle(full: ApiArticleFull): Article {
  return {
    slug: full.slug,
    title: full.title,
    excerpt: full.excerpt,
    category: full.category,
    publishedAt: full.published_at,
    readingTimeMinutes: full.reading_time_minutes,
    paragraphs: full.paragraphs,
  };
}

function filterByCategory(rows: Article[], category?: string): Article[] {
  if (!category) return rows;
  return rows.filter((a) => a.category === category);
}

export async function loadArticles(options?: {
  category?: string;
}): Promise<Article[]> {
  const base = getServerApiUrl();
  if (!base) {
    return filterByCategory([...fallbackArticles], options?.category).sort(
      (a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt),
    );
  }
  try {
    const url = new URL(`${base}/articles`);
    url.searchParams.set("limit", "100");
    url.searchParams.set("offset", "0");
    if (options?.category) url.searchParams.set("category", options.category);
    const res = await fetch(url.toString(), {
      next: { revalidate: 30 },
      signal: AbortSignal.timeout(fetchTimeoutMs),
    });
    if (!res.ok) {
      throw new Error(await res.text());
    }
    const body = (await res.json()) as PageResp<ApiArticleListRow>;
    return body.items.map(apiToArticleMinimal);
  } catch {
    return filterByCategory([...fallbackArticles], options?.category).sort(
      (a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt),
    );
  }
}

async function loadArticleBySlugUncached(
  slug: string,
): Promise<Article | null> {
  const base = getServerApiUrl();
  if (!base) {
    return fallbackArticles.find((a) => a.slug === slug) ?? null;
  }
  try {
    const res = await fetch(`${base}/articles/${encodeURIComponent(slug)}`, {
      next: { revalidate: 30 },
      signal: AbortSignal.timeout(fetchTimeoutMs),
    });
    if (!res.ok) return null;
    const full = (await res.json()) as ApiArticleFull;
    return apiToArticle(full);
  } catch {
    return fallbackArticles.find((a) => a.slug === slug) ?? null;
  }
}

/** Dedupes metadata + page during static generation (avoids duplicate slow fetches per slug). */
export const loadArticleBySlug = cache(loadArticleBySlugUncached);

export async function loadArticleSlugs(): Promise<{ slug: string }[]> {
  const rows = await loadArticles();
  return rows.map((a) => ({ slug: a.slug }));
}
