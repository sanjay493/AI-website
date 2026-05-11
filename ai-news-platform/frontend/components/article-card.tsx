import Image from "next/image";
import Link from "next/link";
import type { Article } from "@/lib/content";
import { formatDate, getCategoryBySlug } from "@/lib/content";

function isYoutubeExternal(url: string | null | undefined): boolean {
  if (!url) return false;
  const u = url.toLowerCase();
  return u.includes("youtube.com/") || u.includes("youtu.be/");
}

export function ArticleCard({ article }: { article: Article }) {
  const cat = getCategoryBySlug(article.category);
  const thumbDest = article.externalUrl ?? `/blog/${article.slug}`;
  const thumbNewTab = Boolean(article.externalUrl);

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
        {article.externalUrl && isYoutubeExternal(article.externalUrl) ? (
          <span className="rounded-full bg-red-50 px-2 py-0.5 font-medium text-red-700 dark:bg-red-950/50 dark:text-red-300">
            YouTube
          </span>
        ) : null}
        <span>{formatDate(article.publishedAt)}</span>
        <span aria-hidden>·</span>
        <span>{article.readingTimeMinutes} min read</span>
      </div>

      {article.coverImageUrl ? (
        <Link
          href={thumbDest}
          target={thumbNewTab ? "_blank" : undefined}
          rel={thumbNewTab ? "noopener noreferrer" : undefined}
          className="mt-3 block overflow-hidden rounded-xl border border-zinc-200/80 bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800"
        >
          <Image
            src={article.coverImageUrl}
            alt=""
            width={640}
            height={360}
            className="aspect-video w-full object-cover transition duration-300 group-hover:scale-[1.02]"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        </Link>
      ) : null}

      <h2 className="mt-3 text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
        <Link
          href={`/blog/${article.slug}`}
          className="hover:text-violet-700 dark:hover:text-violet-300"
        >
          {article.title}
        </Link>
      </h2>
      <p className="mt-2 line-clamp-4 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
        {article.excerpt}
      </p>
      <p className="mt-4 flex flex-wrap gap-3">
        {article.externalUrl && isYoutubeExternal(article.externalUrl) ? (
          <a
            href={article.externalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-semibold text-red-600 hover:text-red-500 dark:text-red-400 dark:hover:text-red-300"
          >
            Watch on YouTube →
          </a>
        ) : null}
        <Link
          href={`/blog/${article.slug}`}
          className="text-sm font-medium text-violet-600 hover:text-violet-500 dark:text-violet-400 dark:hover:text-violet-300"
        >
          Read on site →
        </Link>
      </p>
    </article>
  );
}
