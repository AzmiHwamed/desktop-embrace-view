import { isRtlLanguage } from "@/lib/rtl";

export const LANGUAGE_STORAGE_KEY = "smarttravel.language";
export const TRANSLATION_STORAGE_PREFIX = "smarttravel.translation.";

export type StoredLanguage = {
  id: string;
  code: string;
  name: string;
};

export function getStoredLanguage(): StoredLanguage | null {
  if (typeof window === "undefined") return null;

  try {
    const value = JSON.parse(localStorage.getItem(LANGUAGE_STORAGE_KEY) ?? "null") as Partial<StoredLanguage> | null;
    return value?.id && value?.code && value?.name
      ? { id: value.id, code: value.code, name: value.name }
      : null;
  } catch {
    return null;
  }
}

export function storeLanguage(language: StoredLanguage): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(LANGUAGE_STORAGE_KEY, JSON.stringify(language));
  applyDocumentLanguage(language);
  window.dispatchEvent(new CustomEvent("smarttravel:language-change", { detail: language }));
}

export function applyDocumentLanguage(language = getStoredLanguage()): void {
  if (typeof document === "undefined") return;
  const code = language?.code || "en";
  document.documentElement.lang = code;
  document.documentElement.dir = isRtlLanguage(code) ? "rtl" : "ltr";
}

export function getCachedTranslation<T>(cacheKey: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    return JSON.parse(localStorage.getItem(`${TRANSLATION_STORAGE_PREFIX}${cacheKey}`) ?? "null") as T | null;
  } catch {
    return null;
  }
}

export function storeCachedTranslation(cacheKey: string, dictionary: unknown): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(`${TRANSLATION_STORAGE_PREFIX}${cacheKey}`, JSON.stringify(dictionary));
}
