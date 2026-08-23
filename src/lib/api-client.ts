// lib/api-client.ts

export const API_BASE_URL = import.meta.env["VITE_API_BASE_URL"] ?? "http://localhost:3000";

export const TOKEN_STORAGE_KEY = "smarttravel.token";
export const REFRESH_TOKEN_STORAGE_KEY = "smarttravel.refreshToken";

export type ApiResponse<T> = {
  status_code: number;
  title: string;
  body: string;
  data: T;
};

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly payload?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_STORAGE_KEY);
}

function getStoredRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(REFRESH_TOKEN_STORAGE_KEY);
}

// Stops repeated protected requests after refresh has failed.
let authenticationFailed = false;
let redirectStarted = false;
let refreshPromise: Promise<string> | null = null;

// Firebase ID tokens expire after one hour and that lifetime is not
// configurable. Refresh shortly before expiry so an active user keeps a
// continuous session instead of waiting for a request to fail with 401.
const TOKEN_REFRESH_WINDOW_MS = 5 * 60 * 1000;

function tokenExpiresSoon(token: string): boolean {
  try {
    const payloadPart = token.split(".")[1];
    if (!payloadPart) return false;

    const normalized = payloadPart.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), "=");
    const payload = JSON.parse(atob(padded)) as { exp?: number };

    return typeof payload.exp === "number"
      ? payload.exp * 1000 <= Date.now() + TOKEN_REFRESH_WINDOW_MS
      : false;
  } catch {
    // If a token is opaque or malformed, let the API validate it and retain
    // the existing 401 refresh fallback.
    return false;
  }
}

const PUBLIC_AUTH_PATHS = new Set([
  "/auth/login",
  "/auth/register",
  "/auth/oauth",
  "/auth/send-reset-mail",
  "/auth/validate-reset-mail",
  "/auth/reset-password",
]);

function isPublicPath(path: string, method = "GET"): boolean {
  const pathname = path.split("?")[0];
  if (PUBLIC_AUTH_PATHS.has(pathname)) return true;
  if (pathname.startsWith("/guest/")) return true;

  // Read-only reference data and currency conversion are intentionally
  // anonymous APIs and are needed by the supported guest features.
  if (method.toUpperCase() === "GET") {
    return (
      pathname === "/languages" ||
      pathname.startsWith("/languages/") ||
      pathname === "/currencies" ||
      pathname === "/currencies/convert" ||
      pathname.startsWith("/currencies/")
    );
  }
  return false;
}

export function storeTokens(accessToken: string, refreshToken?: string | null): void {
  if (typeof window === "undefined") return;

  localStorage.setItem(TOKEN_STORAGE_KEY, accessToken);

  if (refreshToken) {
    localStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, refreshToken);
  }

  authenticationFailed = false;
  redirectStarted = false;
}

export function clearTokens(): void {
  if (typeof window === "undefined") return;

  localStorage.removeItem(TOKEN_STORAGE_KEY);
  localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
}

function expireSession(): never {
  authenticationFailed = true;
  clearTokens();

  if (typeof window !== "undefined" && !redirectStarted && window.location.pathname !== "/login") {
    redirectStarted = true;
    window.location.replace("/login");
  }

  throw new ApiError("Session expired. Please log in again.", 401);
}

async function readPayload(response: Response): Promise<unknown> {
  const text = await response.text();

  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function getErrorMessage(payload: unknown, status: number): string {
  const fallback = `Request failed (${status})`;

  if (typeof payload === "string" && payload.trim()) {
    return payload;
  }

  if (!payload || typeof payload !== "object") {
    return fallback;
  }

  const error = payload as {
    message?: string;
    error?: string;
    body?: string;
    title?: string;
  };

  return error.message ?? error.error ?? error.body ?? error.title ?? fallback;
}

async function refreshAccessToken(): Promise<string> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    const refreshToken = getStoredRefreshToken();

    if (!refreshToken) {
      throw new ApiError("No refresh token available", 401);
    }

    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        refreshToken,

        // If required by your backend, use this instead:
        // refresh_token: refreshToken,
      }),
    });

    const payload = await readPayload(response);

    if (!response.ok) {
      throw new ApiError(getErrorMessage(payload, response.status), response.status, payload);
    }

    const result = payload as ApiResponse<{
      access_token?: string;
      refresh_token?: string;
      idToken?: string;
      refreshToken?: string;
    }>;

    // Accept both the refresh endpoint's OAuth-style names and the camelCase
    // names returned by the login endpoint.
    const accessToken = result?.data?.access_token ?? result?.data?.idToken;
    const newRefreshToken = result?.data?.refresh_token ?? result?.data?.refreshToken;

    if (!accessToken) {
      throw new ApiError("Refresh response has no access token", 401, payload);
    }

    storeTokens(accessToken, newRefreshToken ?? refreshToken);

    return accessToken;
  })();

  try {
    return await refreshPromise;
  } finally {
    refreshPromise = null;
  }
}

export async function apiFetch<T>(
  path: string,
  init: RequestInit = {},
  isRetry = false,
): Promise<T> {
  const isPublicAuthRequest = isPublicPath(path, init.method ?? "GET");

  // Do not hit protected endpoints again after terminal authentication failure.
  if (authenticationFailed && !isPublicAuthRequest) {
    return expireSession();
  }

  let token = getStoredToken();
  const refreshToken = getStoredRefreshToken();

  if (!isPublicAuthRequest && !isRetry && token && refreshToken && tokenExpiresSoon(token)) {
    try {
      token = await refreshAccessToken();
    } catch {
      return expireSession();
    }
  }

  // A protected request with no credentials cannot succeed. Redirect before
  // making a guaranteed-to-fail request. If only the access token is missing,
  // use the refresh token immediately and then continue with the new token.
  if (!isPublicAuthRequest && !isRetry && !token) {
    if (!refreshToken) {
      return expireSession();
    }

    try {
      token = await refreshAccessToken();
    } catch {
      return expireSession();
    }
  }
  const isFormData = typeof FormData !== "undefined" && init.body instanceof FormData;

  const headers = new Headers(init.headers);

  if (!isFormData && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  } else {
    headers.delete("Authorization");
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
  });

  if (response.status === 401) {
    // The request already used a refreshed token, but it was rejected.
    if (isRetry) {
      return expireSession();
    }

    if (!refreshToken) {
      return expireSession();
    }

    try {
      await refreshAccessToken();
      return await apiFetch<T>(path, init, true);
    } catch {
      return expireSession();
    }
  }

  const payload = await readPayload(response);

  if (!response.ok) {
    throw new ApiError(getErrorMessage(payload, response.status), response.status, payload);
  }

  return payload as T;
}
