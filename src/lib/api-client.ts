export const API_BASE_URL =
  import.meta.env["VITE_API_BASE_URL"] ?? "http://localhost:3000";

export const TOKEN_STORAGE_KEY = "smarttravel.token";

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token =
    typeof window !== "undefined" ? window.localStorage.getItem(TOKEN_STORAGE_KEY) : null;

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init.headers ?? {}),
    },
  });

  const text = await response.text();
  const payload = text ? JSON.parse(text) : null;

  if (!response.ok) {
    const message =
      (payload && (payload.message || payload.error)) || `Request failed (${response.status})`;
    throw new Error(message);
  }

  return payload as T;
}
