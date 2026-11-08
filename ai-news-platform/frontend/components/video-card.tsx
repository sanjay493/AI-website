import Image from "next/image";
import type { Article } from "@/lib/content";
import { formatDate } from "@/lib/content";

/** A trending-video tile. Opens the video on YouTube in a new tab. */
export function VideoCard({ video }: { video: Article }) {
  const href = video.externalUrl ?? "#";
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm transition hover:border-red-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900/40 dark:hover:border-red-900/60"
    >
      <div className="relative aspect-video w-full overflow-hidden bg-zinc-200 dark:bg-zinc-800">
        {video.coverImageUrl ? (
          <Image
            src={video.coverImageUrl}
            alt=""
            fill
            sizes="(min-width: 1024px) 320px, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-zinc-500">
            No thumbnail
          </div>
        )}
        <span
          aria-hidden="true"
          className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition group-hover:bg-black/40 group-hover:opacity-100"
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-red-600 pl-1 text-white">
            ▶
          </span>
        </span>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="line-clamp-2 font-semibold text-zinc-900 group-hover:text-red-600 dark:text-zinc-50 dark:group-hover:text-red-400">
          {video.title}
        </h3>
        {video.excerpt ? (
          <p className="mt-2 line-clamp-2 text-sm text-zinc-600 dark:text-zinc-400">
            {video.excerpt}
          </p>
        ) : null}
        <p className="mt-auto pt-3 text-xs text-zinc-500">
          <time dateTime={video.publishedAt}>{formatDate(video.publishedAt)}</time>
          <span className="sr-only"> (opens YouTube in a new tab)</span>
        </p>
      </div>
    </a>
  );
}
