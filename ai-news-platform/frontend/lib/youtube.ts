import type { Article } from "@/lib/content";

const YOUTUBE_HOSTS = new Set([
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "youtu.be",
]);

/** True when the URL points to a YouTube video (watch, shorts or youtu.be link). */
export function isYouTubeUrl(url: string | null | undefined): url is string {
  if (!url) return false;
  try {
    const u = new URL(url);
    return u.protocol === "https:" && YOUTUBE_HOSTS.has(u.hostname.toLowerCase());
  } catch {
    return false;
  }
}

/**
 * Picks the YouTube items from the ingested article feed (the backend news agent stores
 * YouTube trending + channel uploads as articles with an external watch URL), newest first.
 */
export function selectTrendingVideos(items: Article[], limit = 24): Article[] {
  return items
    .filter((a) => isYouTubeUrl(a.externalUrl))
    .sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt))
    .slice(0, limit);
}
