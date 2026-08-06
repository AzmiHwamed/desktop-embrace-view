// features/i18n/types.ts
export type TranslationDictionary = Record<string, string>;

export type I18nState = {
  // keyed by `${namespace}:${languageCacheKey}`, where languageCacheKey is
  // the user's languageId (or "default" pre-profile-load)
  byCacheKey: Record<string, TranslationDictionary>;
  loading: Record<string, boolean>;
  error: string | null;
};