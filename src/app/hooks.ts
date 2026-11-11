import { useDispatch, useSelector, useStore } from "react-redux";

import type { AppDispatch, AppStore, RootState } from "./store";
import { useEffect, useRef, useState } from "react";
import { fetchTranslation, restoreTranslation } from "@/features/i18n/i18nSlice";
import { TranslationDictionary } from "@/features/i18n/types";
import { getCachedTranslation, getStoredLanguage, storeCachedTranslation } from "@/lib/language-preference";
import { normalizePlaceholders } from "@/lib/i18n";
import { apiFetch, type ApiResponse } from "@/lib/api-client";

export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();
export const useAppStore = useStore.withTypes<AppStore>();
export function useHasMounted(): boolean {
  const [hasMounted, setHasMounted] = useState(false);
  useEffect(() => {
    setHasMounted(true);
  }, []);
  return hasMounted;
}

// (replace the return statement inside useTranslations in app/hooks.ts)
export function useTranslations<T extends TranslationDictionary>(namespace: string, source: T): T {
  const dispatch = useAppDispatch();
  const requestedRefreshes = useRef(new Set<string>());
  const profile = useAppSelector((s) => s.account.profile);
  const storedLanguage = getStoredLanguage();
  const languageCacheKey = profile?.languageId ?? storedLanguage?.id ?? "default";
  const targetLanguage = profile?.language?.name ?? storedLanguage?.name;
  const key = `${namespace}:${languageCacheKey}`;
  const dict = useAppSelector((s) => s.i18n.byCacheKey[key]);
  const loading = useAppSelector((s) => Boolean(s.i18n.loading[key]));
  // Read persisted JSON during render so startup/auth loaders do not paint in
  // English for one frame before the restoration effect runs.
  // Always inspect localStorage, even when Redux already has a dictionary.
  // Storage can be cleared independently (or a prior app version can leave an
  // incomplete dictionary), and the in-memory version should repair it.
  const persistedDict = getCachedTranslation<TranslationDictionary>(key);
  const activeDict = dict ?? persistedDict;
  const hasMissingKeys = Object.keys(source).some((sourceKey) => {
    const value = activeDict?.[sourceKey];
    return typeof value !== "string" || value.length === 0;
  });
  // Old versions could persist the original English source under a non-English
  // language ID. A complete cache is not necessarily a translated cache.
  const isNonEnglish = Boolean(targetLanguage && targetLanguage.toLowerCase() !== "english");
  const dictionaryIsUntranslated = Boolean(
    activeDict &&
      isNonEnglish &&
      Object.keys(source).every((sourceKey) => activeDict[sourceKey] === source[sourceKey]),
  );
  const persistedDictionaryIsIncomplete = Object.keys(source).some((sourceKey) => {
    const value = persistedDict?.[sourceKey];
    return typeof value !== "string" || value.length === 0;
  });

  useEffect(() => {
    // Keep localStorage complete whenever Redux has a usable translation.
    // This makes an erased or stale local cache self-healing without waiting
    // for a full page reload or another translation API request.
    if (dict && (!persistedDict || persistedDictionaryIsIncomplete)) {
      storeCachedTranslation(key, dict);
    }

    const needsTranslation = hasMissingKeys || dictionaryIsUntranslated;
    const refreshKey = `${key}:${targetLanguage ?? "default"}`;

    if (!dict) {
      if (persistedDict) {
        dispatch(restoreTranslation({ cacheKey: key, dict: persistedDict }));
      } else if (profile && !requestedRefreshes.current.has(refreshKey)) {
        // Translation requires the authenticated user's language. Logged-out
        // pages use the last cached JSON and otherwise fall back to English.
        requestedRefreshes.current.add(refreshKey);
        dispatch(fetchTranslation({ namespace, source, languageCacheKey, targetLanguage }));
      }
    } else if (profile && needsTranslation && !loading && !requestedRefreshes.current.has(refreshKey)) {
      // Locale JSON files grow as features are added. Refresh an older cached
      // dictionary when it is incomplete or was incorrectly saved in English.
      requestedRefreshes.current.add(refreshKey);
      dispatch(fetchTranslation({ namespace, source, languageCacheKey, targetLanguage }));
    }
  }, [dispatch, namespace, languageCacheKey, key, dict, persistedDict, persistedDictionaryIsIncomplete, source, profile, hasMissingKeys, dictionaryIsUntranslated, loading, targetLanguage]);

  // Merge rather than replace: any key missing/undefined/empty in the
  // translated dict falls back to the English source instead of crashing
  // or rendering blank.
  if (!activeDict) return source;
  const merged = { ...source } as T;
  for (const k of Object.keys(source)) {
    const rawValue = activeDict[k];
    const v = typeof rawValue === "string"
      ? normalizePlaceholders(source[k], rawValue)
      : rawValue;
    if (typeof v === "string" && v.length > 0) {
      (merged as Record<string, string>)[k] = v;
    }
  }
  return merged;
}

/** Translate a static JSON document while preserving its original shape. */
export function useTranslatedData<T>(namespace: string, source: T): T {
  const profile = useAppSelector((s) => s.account.profile);
  const storedLanguage = getStoredLanguage();
  const targetLanguage = profile?.language?.name ?? storedLanguage?.name;
  const languageKey = profile?.languageId ?? storedLanguage?.id ?? "default";
  const [translated, setTranslated] = useState<T>(source);

  useEffect(() => {
    let cancelled = false;
    if (!targetLanguage || targetLanguage.toLowerCase() === "english") {
      setTranslated(source);
      return () => { cancelled = true; };
    }

    const endpoint = profile ? "/translation/json" : "/guest/translation/json";
    apiFetch<ApiResponse<{ data: T }>>(endpoint, {
      method: "POST",
      body: JSON.stringify({ data: source, target: targetLanguage }),
    })
      .then((response) => {
        const result = response.data.data;
        if (!cancelled && result) setTranslated(result);
      })
      .catch(() => {
        if (!cancelled) setTranslated(source);
      });

    return () => { cancelled = true; };
  }, [namespace, source, targetLanguage, languageKey, profile]);

  return translated;
}
