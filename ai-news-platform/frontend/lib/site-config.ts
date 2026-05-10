/** Public site origin for canonical URLs, OG `og:url`, and sitemap. Set in production. */
export const SITE_NAME = "AI Signal";

export const SITE_TAGLINE =
  "AI news, long-form articles, tutorials, and trend analysis.";

export function getSiteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (raw) return raw.replace(/\/$/, "");
  return "http://localhost:3000";
}

export function absoluteUrl(path: string): string {
  const base = getSiteUrl();
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base}${p}`;
}
