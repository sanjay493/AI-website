/** Public site origin for canonical URLs, OG `og:url`, and sitemap. Set in production. */
export const SITE_NAME = "AI Signal";

export const SITE_TAGLINE =
  "Trending AI and tech videos from YouTube, plus a free Linux & PowerShell course.";

/** ≤60 chars — default social / SERP title (avoid truncation in OG cards). */
export const SITE_OG_TITLE = "AI Signal — Trending AI & tech videos";

/**
 * ~150–160 chars — `meta description`, `og:description`, and `twitter:description`
 * for the homepage and root metadata defaults.
 */
export const SITE_META_DESCRIPTION =
  "Watch what is trending on YouTube in AI and tech, refreshed automatically, and learn the command line with our free 30-day Linux & PowerShell course.";

/**
 * Free 30-day course hosted separately on GitHub Pages
 * (repo: sanjay493/linux-powershell-professional-mastery).
 * Override with NEXT_PUBLIC_COURSE_URL — e.g. https://learn.agentweekly.in/ once that DNS record exists.
 * The github.io address keeps working and redirects to the custom domain after it is configured.
 */
export function getCourseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_COURSE_URL?.trim();
  return raw || "https://sanjay493.github.io/linux-powershell-professional-mastery/";
}

export const COURSE_NAME = "Linux & PowerShell Professional Mastery";

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
