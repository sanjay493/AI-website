/** Base URL including `/api/v1` prefix (matches docker-compose NEXT_PUBLIC_API_URL). */
export function getApiUrl(): string {
  const raw = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (!raw) {
    console.warn(
      "NEXT_PUBLIC_API_URL is unset; authenticated calls will fail at runtime.",
    );
    return "";
  }
  return raw.replace(/\/$/, "");
}
