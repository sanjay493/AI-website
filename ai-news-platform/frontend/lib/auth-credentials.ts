import type { TokenPair } from "@/lib/auth-types";
import {
  assertApiConfigured,
  jsonHeaders,
  readAuthError,
} from "@/lib/auth-http";
import { getApiUrl } from "@/lib/api-base";

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
    throw new Error(await readAuthError(res));
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
    throw new Error(await readAuthError(res));
  }
  return res.json() as Promise<TokenPair>;
}

export async function forgotPassword(email: string) {
  assertApiConfigured();
  const res = await fetch(`${getApiUrl()}/auth/forgot-password`, {
    method: "POST",
    headers: jsonHeaders(),
    body: JSON.stringify({ email }),
  });
  if (!res.ok) {
    throw new Error(await readAuthError(res));
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
    throw new Error(await readAuthError(res));
  }
  return res.json() as Promise<{ detail: string }>;
}

export async function fetchAdminStatus(access_token: string) {
  assertApiConfigured();
  const res = await fetch(`${getApiUrl()}/admin/status`, {
    headers: { Authorization: `Bearer ${access_token}` },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(await readAuthError(res));
  }
  return res.json() as Promise<{ ok: boolean; email: string; role: string }>;
}
