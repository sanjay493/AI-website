import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { loadArticles } from "@/lib/public-articles";
import type { Article } from "@/lib/content";

export const metadata: Metadata = {
  title: "YouTube Trending Videos",
  description: "Trending AI and tech videos from YouTube.",
};

export default async function YouTubeTrendingPage() {
  const allArticles = await loadArticles();

  // Filter for YouTube videos (those with external_url containing youtube)
  const youtubeVideos = allArticles
    .filter(
      (item: Article) =>
        item.externalUrl &&
        (item.externalUrl.includes("youtube.com") || item.externalUrl.includes("youtu.be")),
    )
    .sort(
      (a: Article, b: Article) =>
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
    );

  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-zinc-900 dark:text-zinc-50 mb-2">
            🎥 YouTube Trending
          </h1>
          <p className="text-lg text-zinc-600 dark:text-zinc-400">
            AI and tech videos trending on YouTube. Curated for builders and enthusiasts.
          </p>
        </div>

        {/* Video Grid */}
        {youtubeVideos.length > 0 ? (
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {youtubeVideos.map((video) => (
              <Link
                key={video.slug}
                href={video.externalUrl || `/blog/${video.slug}`}
                target={video.externalUrl ? "_blank" : "_self"}
                rel={video.externalUrl ? "noopener noreferrer" : ""}
                className="group relative overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800 hover:border-violet-500 dark:hover:border-violet-400 transition-all hover:shadow-lg dark:hover:shadow-violet-500/20"
              >
                {/* Thumbnail */}
                <div className="relative h-40 w-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
                  {video.coverImageUrl ? (
                    <Image
                      src={video.coverImageUrl}
                      alt={video.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="h-full flex items-center justify-center">
                      <span className="text-zinc-400 dark:text-zinc-600">No image</span>
                    </div>
                  )}
                  {/* Play button overlay */}
                  <div className="absolute inset-0 bg-black/30 group-hover:bg-black/50 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <div className="w-12 h-12 rounded-full bg-red-600 flex items-center justify-center">
                      <span className="text-white ml-1">▶</span>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4">
                  <h2 className="font-semibold text-zinc-900 dark:text-zinc-50 mb-2 line-clamp-2 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                    {video.title}
                  </h2>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 line-clamp-2 mb-3">
                    {video.excerpt}
                  </p>
                  <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-500">
                    <span>{video.readingTimeMinutes} min watch</span>
                    <span>{new Date(video.publishedAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-zinc-600 dark:text-zinc-400">
              No YouTube videos found. Check back soon!
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
