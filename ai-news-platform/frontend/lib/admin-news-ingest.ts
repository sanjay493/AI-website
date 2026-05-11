import { getApiUrl } from "@/lib/api-base";

export type IngestResult = {
  created_slugs: string[];
  skipped_duplicates: number;
  errors: string[];
  notes?: string[];
};

export async function runNewsIngest(token: string): Promise<IngestResult> {
  const base = getApiUrl().replace(/\/$/, "");
  const res = await fetch(`${base}/admin/news-agent/ingest`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({}),
    cache: "no-store",
  });
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const body = (await res.json()) as { detail?: unknown };
      if (typeof body.detail === "string") detail = body.detail;
    } catch {
      /* ignore */
    }
    throw new Error(detail);
  }
  return res.json() as Promise<IngestResult>;
}
