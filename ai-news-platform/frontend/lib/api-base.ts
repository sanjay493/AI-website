/**
 * Browser API base including `/api/v1`.
 * Prefer same-origin `/api/v1`: Next proxies to FastAPI via `rewrites()` so the browser does not
 * need a separate API host, HTTPS, or permissive CORS. Full URLs still work if you split origins.
 */
export function getApiUrl(): string {
  const raw = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (!raw) {
    console.warn(
      "NEXT_PUBLIC_API_URL is unset — defaulting browser API base to same-origin /api/v1.",
    );
    return "/api/v1";
  }
  return raw.replace(/\/$/, "");
}
