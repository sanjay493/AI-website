import type { AuthUser, TokenPair } from "@/lib/auth-types";
import {
  assertApiConfigured,
  jsonHeaders,
  readAuthError,
} from "@/lib/auth-http";
import { getApiUrl } from "@/lib/api-base";

export async function refreshTokens(refresh_token: string): Promise<TokenPair> {
  assertApiConfigured();
  const res = await fetch(`${getApiUrl()}/auth/refresh`, {
    method: "POST",
    headers: jsonHeaders(),
    body: JSON.stringify({ refresh_token }),
  });
  if (!res.ok) {
    throw new Error(await readAuthError(res));
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

export async function fetchMe(access_token: string): Promise<AuthUser> {
  assertApiConfigured();
  const res = await fetch(`${getApiUrl()}/auth/me`, {
    headers: { Authorization: `Bearer ${access_token}` },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(await readAuthError(res));
  }
  return res.json() as Promise<AuthUser>;
}
