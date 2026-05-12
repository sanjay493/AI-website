import { getApiUrl } from "@/lib/api-base";

export type AdminArticle = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  published_at: string;
  reading_time_minutes: number;
  paragraphs: string[];
  cover_image_url?: string | null;
  external_url?: string | null;
};

type PageResp = {
  items: AdminArticle[];
  meta: { total: number; limit: number; offset: number; pages: number };
};

function authHeaders(token: string): HeadersInit {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

async function readError(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as { detail?: unknown };
    if (typeof body.detail === "string") return body.detail;
    return res.statusText;
  } catch {
    return res.statusText;
  }
}

export async function adminListArticles(
  token: string,
  params?: {
    category?: string;
    limit?: number;
    offset?: number;
    q?: string;
  },
): Promise<PageResp> {
  const path = `${getApiUrl().replace(/\/$/, "")}/admin/articles`;
  const search = new URLSearchParams({
    limit: String(params?.limit ?? 50),
    offset: String(params?.offset ?? 0),
  });
  if (params?.category) search.set("category", params.category);
  if (params?.q?.trim()) search.set("q", params.q.trim());
  const qs = search.toString();
  const url = qs ? `${path}?${qs}` : path;
  const res = await fetch(url, {
    headers: authHeaders(token),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(await readError(res));
  return res.json() as Promise<PageResp>;
}

export async function adminGetArticle(
  token: string,
  slug: string,
): Promise<AdminArticle> {
  const res = await fetch(
    `${getApiUrl()}/admin/articles/${encodeURIComponent(slug)}`,
    { headers: authHeaders(token), cache: "no-store" },
  );
  if (!res.ok) throw new Error(await readError(res));
  return res.json() as Promise<AdminArticle>;
}

export async function adminCreateArticle(
  token: string,
  body: {
    slug: string;
    title: string;
    excerpt: string;
    category: string;
    published_at: string;
    reading_time_minutes: number;
    paragraphs: string[];
  },
): Promise<AdminArticle> {
  const res = await fetch(`${getApiUrl()}/admin/articles`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await readError(res));
  return res.json() as Promise<AdminArticle>;
}

export async function adminUpdateArticle(
  token: string,
  slug: string,
  patch: Partial<{
    title: string;
    excerpt: string;
    category: string;
    published_at: string;
    reading_time_minutes: number;
    paragraphs: string[];
  }>,
): Promise<AdminArticle> {
  const res = await fetch(
    `${getApiUrl()}/admin/articles/${encodeURIComponent(slug)}`,
    {
      method: "PATCH",
      headers: authHeaders(token),
      body: JSON.stringify(patch),
    },
  );
  if (!res.ok) throw new Error(await readError(res));
  return res.json() as Promise<AdminArticle>;
}

export async function adminDeleteArticle(
  token: string,
  slug: string,
): Promise<void> {
  const res = await fetch(
    `${getApiUrl()}/admin/articles/${encodeURIComponent(slug)}`,
    { method: "DELETE", headers: authHeaders(token) },
  );
  if (!res.ok) throw new Error(await readError(res));
}
