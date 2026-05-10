const ACCESS = "ai_signal_access_token";
const REFRESH = "ai_signal_refresh_token";

export function getStoredAccess(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(ACCESS);
  } catch {
    return null;
  }
}

export function getStoredRefresh(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(REFRESH);
  } catch {
    return null;
  }
}

export function persistTokens(access: string, refresh: string) {
  window.localStorage.setItem(ACCESS, access);
  window.localStorage.setItem(REFRESH, refresh);
}

export function clearTokens() {
  window.localStorage.removeItem(ACCESS);
  window.localStorage.removeItem(REFRESH);
}
