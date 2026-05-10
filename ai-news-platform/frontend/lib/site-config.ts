/** Public site origin for canonical URLs, OG `og:url`, and sitemap. Set in production. */
export const SITE_NAME = "AI Signal";

export const SITE_TAGLINE =
  "AI news, long-form articles, tutorials, and trend analysis.";

/** ≤60 chars — default social / SERP title (avoid truncation in OG cards). */
export const SITE_OG_TITLE =
  "AI Signal — AI news, tutorials & trend analysis";

/**
 * ~150–160 chars — `meta description`, `og:description`, and `twitter:description`
 * for the homepage and root metadata defaults.
 */
export const SITE_META_DESCRIPTION =
  "AI Signal curates AI news, tutorials, and trends for builders. Clear explainers on models and tooling—less hype, more signal so you ship with confidence.";

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
