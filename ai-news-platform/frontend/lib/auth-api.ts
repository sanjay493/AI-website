import { getApiUrl } from "@/lib/api-base";
import type { AuthUser } from "@/lib/auth-types";

type TokenPair = {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
};

function assertApiConfigured() {
  if (!getApiUrl()) {
    throw new Error("NEXT_PUBLIC_API_URL is not configured");
  }
}

function jsonHeaders(access?: string): HeadersInit {
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

async function readError(res: Response): Promise<string> {
  try {
    const body = await res.json();
    return detailFromBody(body) ?? res.statusText;
  } catch {
    return res.statusText;
  }
}

export async function registerAccount(input: {
  email: string;
  password: string;
  full_name?: string | null;
}): Promise<TokenPair> {
  assertApiConfigured();
  const res = await fetch(`${getApiUrl()}/auth/register`, {
    method: "POST",
    headers: jsonHeaders(),
    body: JSON.stringify({
      email: input.email,
      password: input.password,
      full_name: input.full_name ?? null,
    }),
  });
  if (!res.ok) {
    throw new Error(await readError(res));
  }
  return res.json() as Promise<TokenPair>;
}

export async function loginAccount(input: {
  email: string;
  password: string;
}): Promise<TokenPair> {
  assertApiConfigured();
  const res = await fetch(`${getApiUrl()}/auth/login`, {
    method: "POST",
    headers: jsonHeaders(),
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    throw new Error(await readError(res));
  }
  return res.json() as Promise<TokenPair>;
}

export async function refreshTokens(refresh_token: string): Promise<TokenPair> {
  assertApiConfigured();
  const res = await fetch(`${getApiUrl()}/auth/refresh`, {
    method: "POST",
    headers: jsonHeaders(),
    body: JSON.stringify({ refresh_token }),
  });
  if (!res.ok) {
    throw new Error(await readError(res));
  }
  return res.json() as Promise<TokenPair>;
}

export async function logoutRemote(
  refresh_token: string | null | undefined,
  access_token: string | null | undefined,
) {
  if (!refresh_token) return;
  try {
    assertApiConfigured();
    await fetch(`${getApiUrl()}/auth/logout`, {
      method: "POST",
      headers: jsonHeaders(access_token ?? undefined),
      body: JSON.stringify({ refresh_token }),
    });
  } catch {
    /* best-effort */
  }
}

export async function forgotPassword(email: string) {
  assertApiConfigured();
  const res = await fetch(`${getApiUrl()}/auth/forgot-password`, {
    method: "POST",
    headers: jsonHeaders(),
    body: JSON.stringify({ email }),
  });
  if (!res.ok) {
    throw new Error(await readError(res));
  }
  return res.json() as Promise<{ detail: string }>;
}

export async function resetPassword(input: {
  token: string;
  new_password: string;
}) {
  assertApiConfigured();
  const res = await fetch(`${getApiUrl()}/auth/reset-password`, {
    method: "POST",
    headers: jsonHeaders(),
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    throw new Error(await readError(res));
  }
  return res.json() as Promise<{ detail: string }>;
}

export async function fetchMe(access_token: string): Promise<AuthUser> {
  assertApiConfigured();
  const res = await fetch(`${getApiUrl()}/auth/me`, {
    headers: { Authorization: `Bearer ${access_token}` },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(await readError(res));
  }
  return res.json() as Promise<AuthUser>;
}

export async function fetchAdminStatus(access_token: string) {
  assertApiConfigured();
  const res = await fetch(`${getApiUrl()}/admin/status`, {
    headers: { Authorization: `Bearer ${access_token}` },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(await readError(res));
  }
  return res.json() as Promise<{ ok: boolean; email: string; role: string }>;
}
