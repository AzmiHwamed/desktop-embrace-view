import { API_BASE_URL } from "@/lib/api-client";

type ErrorLanguage = { code: string; name: string };

const translations = new Map<string, string>();
const pending = new Map<string, Promise<string>>();
const MAX_CACHE_ENTRIES = 200;

// Keep error text in memory only: server messages can contain personal details.
export function translateErrorMessage(message: string, language: ErrorLanguage): Promise<string> {
  if (!message.trim() || /^en(?:-|$)/i.test(language.code)) return Promise.resolve(message);

  const key = JSON.stringify([language.code, language.name, message]);
  const cached = translations.get(key);
  if (cached !== undefined) return Promise.resolve(cached);
  const inFlight = pending.get(key);
  if (inFlight) return inFlight;

  const request = (async () => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    try {
      // Use the public translation route so login/session errors work too.
      // Plain fetch avoids token refresh/redirects and recursive API errors.
      const response = await fetch(`${API_BASE_URL}/guest/translation/json`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: { message }, target: language.name }),
        signal: controller.signal,
      });
      if (!response.ok) return message;
      const payload = await response.json();
      const translated: unknown = payload?.data?.data?.message;
      if (typeof translated !== "string" || !translated.trim()) return message;
      // The translation service returns the source on failure. Don't cache it.
      if (translated !== message) {
        if (translations.size >= MAX_CACHE_ENTRIES) {
          translations.delete(translations.keys().next().value!);
        }
        translations.set(key, translated);
      }
      return translated;
    } catch {
      return message;
    } finally {
      clearTimeout(timeout);
    }
  })();

  pending.set(key, request);
  void request.finally(() => pending.delete(key));
  return request;
}
