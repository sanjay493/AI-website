import Link from "next/link";
import type { Article } from "@/lib/content";
import { formatDate, getCategoryBySlug } from "@/lib/content";

export function ArticleCard({ article }: { article: Article }) {
  const cat = getCategoryBySlug(article.category);
  return (
    <article className="group rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:border-violet-200 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900/30 dark:hover:border-violet-900/40">
      <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500 dark:text-zinc-500">
        {cat ? (
          <Link
            href={`/category/${cat.slug}`}
            className="rounded-full bg-violet-50 px-2 py-0.5 font-medium text-violet-700 transition group-hover:bg-violet-100 dark:bg-violet-950/50 dark:text-violet-300 dark:group-hover:bg-violet-950"
          >
            {cat.name}
          </Link>
        ) : null}
        <span>{formatDate(article.publishedAt)}</span>
        <span aria-hidden>·</span>
        <span>{article.readingTimeMinutes} min read</span>
      </div>
      <h2 className="mt-3 text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
        <Link
          href={`/blog/${article.slug}`}
          className="hover:text-violet-700 dark:hover:text-violet-300"
        >
          {article.title}
        </Link>
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
        {article.excerpt}
      </p>
      <p className="mt-4">
        <Link
          href={`/blog/${article.slug}`}
          className="text-sm font-medium text-violet-600 hover:text-violet-500 dark:text-violet-400 dark:hover:text-violet-300"
        >
          Read more →
        </Link>
      </p>
    </article>
  );
}
