"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Article } from "@/lib/content";
import { getServerApiUrl } from "@/lib/server-api";

type YouTubeArticle = Article & {
  externalUrl: string | null;
};

export function YouTubeTrendingNav() {
  const [videos, setVideos] = useState<YouTubeArticle[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchTrendingVideos() {
      try {
        const base = getServerApiUrl();
        if (!base) {
          setIsLoading(false);
          return;
        }

        const url = new URL(`${base}/articles`);
        url.searchParams.set("limit", "12");
        url.searchParams.set("offset", "0");

        const res = await fetch(url.toString(), {
          next: { revalidate: 300 },
        });

        if (!res.ok) throw new Error("Failed to fetch trending videos");

        const data = await res.json();
        // Filter for YouTube videos (those with external_url containing youtube.com)
        const youtubeVideos = (data.items || []).filter(
          (item: Article) =>
            item.externalUrl &&
            (item.externalUrl.includes("youtube.com") || item.externalUrl.includes("youtu.be")),
        );

        setVideos(youtubeVideos.slice(0, 8));
      } catch (error) {
        console.error("Error fetching trending videos:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchTrendingVideos();
  }, []);

  if (isLoading || videos.length === 0) {
    return null;
  }

  return (
    <div className="sticky top-14 z-40 border-b border-zinc-200/80 bg-white/80 backdrop-blur-md dark:border-zinc-800/80 dark:bg-zinc-950/80">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 py-3">
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-50 whitespace-nowrap">
            🎥 Trending:
          </span>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {videos.map((video) => (
              <Link
                key={video.slug}
                href={video.externalUrl || `/blog/${video.slug}`}
                target={video.externalUrl ? "_blank" : "_self"}
                rel={video.externalUrl ? "noopener noreferrer" : ""}
                className="flex-shrink-0 group relative"
              >
                <div className="w-32 h-20 rounded-lg overflow-hidden bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center border border-zinc-200 dark:border-zinc-700 hover:border-violet-500 dark:hover:border-violet-400 transition-colors">
                  {video.coverImageUrl ? (
                    <Image
                      src={video.coverImageUrl}
                      alt={video.title}
                      fill
                      className="object-cover group-hover:opacity-75 transition-opacity"
                    />
                  ) : (
                    <span className="text-xs text-zinc-400 dark:text-zinc-500 text-center px-2">
                      {video.title.slice(0, 30)}...
                    </span>
                  )}
                </div>
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 rounded-lg flex items-center justify-center">
                  <span className="text-xs text-white font-medium text-center px-1">
                    {video.title.slice(0, 40)}...
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
