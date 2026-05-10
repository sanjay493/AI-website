/** Matches `internalRewriteOrigin()` in next.config — direct HTTP to FastAPI from Node (build/SSR), not browser-relative `/api/v1`. */
function internalOrigin(): string {
  const o = process.env.INTERNAL_API_ORIGIN?.trim();
  if (o) return o.replace(/\/$/, "");
  return "http://127.0.0.1:8000";
}

/** Server-side reads (SSR / RSC) — use service hostname inside Docker Compose. */
export function getServerApiUrl(): string {
  const explicit = process.env.SERVER_API_URL?.trim();
  if (explicit) return explicit.replace(/\/$/, "");

  const publicUrl = (process.env.NEXT_PUBLIC_API_URL ?? "").trim();
  if (!publicUrl) return "";

  if (publicUrl.startsWith("/")) {
    return `${internalOrigin()}${publicUrl}`.replace(/\/$/, "");
  }

  return publicUrl.replace(/\/$/, "");
}
