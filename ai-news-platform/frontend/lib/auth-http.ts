import { getApiUrl } from "@/lib/api-base";

export function assertApiConfigured() {
  if (!getApiUrl()) {
    throw new Error("NEXT_PUBLIC_API_URL is not configured");
  }
}

export function jsonHeaders(access?: string): HeadersInit {
  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (access) headers.Authorization = `Bearer ${access}`;
  return headers;
}

function detailFromBody(body: unknown): string | undefined {
  if (!body || typeof body !== "object") return undefined;
  const detail = (body as { detail?: unknown }).detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    return detail
      .map((chunk) =>
        chunk && typeof chunk === "object" && "msg" in chunk
          ? String((chunk as { msg: unknown }).msg)
          : JSON.stringify(chunk),
      )
      .join("; ");
  }
  return undefined;
}

export async function readAuthError(res: Response): Promise<string> {
  try {
    const body = await res.json();
    return detailFromBody(body) ?? res.statusText;
  } catch {
    return res.statusText;
  }
}
