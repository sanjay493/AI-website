/** Server-side reads (SSR / RSC) — use service hostname inside Docker Compose. */
export function getServerApiUrl(): string {
  const raw =
    process.env.SERVER_API_URL?.trim() ??
    process.env.NEXT_PUBLIC_API_URL?.trim() ??
    "";
  return raw.replace(/\/$/, "");
}
