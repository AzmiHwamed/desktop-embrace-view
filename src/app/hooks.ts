import { useDispatch, useSelector, useStore } from "react-redux";

import type { AppDispatch, AppStore, RootState } from "./store";
import { useEffect, useState } from "react";
import { fetchTranslation, restoreTranslation } from "@/features/i18n/i18nSlice";
import { TranslationDictionary } from "@/features/i18n/types";
import { getCachedTranslation, getStoredLanguage } from "@/lib/language-preference";
import { normalizePlaceholders } from "@/lib/i18n";

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
  const profile = useAppSelector((s) => s.account.profile);
  const storedLanguage = getStoredLanguage();
  const languageCacheKey = profile?.languageId ?? storedLanguage?.id ?? "default";
  const key = `${namespace}:${languageCacheKey}`;
  const dict = useAppSelector((s) => s.i18n.byCacheKey[key]);
  // Read persisted JSON during render so startup/auth loaders do not paint in
  // English for one frame before the restoration effect runs.
  const persistedDict = dict ? null : getCachedTranslation<TranslationDictionary>(key);
  const activeDict = dict ?? persistedDict;

  useEffect(() => {
    if (!dict) {
      if (persistedDict) {
        dispatch(restoreTranslation({ cacheKey: key, dict: persistedDict }));
      } else if (profile) {
        // Translation requires the authenticated user's language. Logged-out
        // pages use the last cached JSON and otherwise fall back to English.
        dispatch(fetchTranslation({ namespace, source, languageCacheKey }));
      }
    }
  }, [dispatch, namespace, languageCacheKey, key, dict, persistedDict, source, profile]);

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
