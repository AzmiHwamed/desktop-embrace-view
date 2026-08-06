// features/i18n/i18nSlice.ts
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

import { apiFetch, type ApiResponse } from "@/lib/api-client";
import type { I18nState, TranslationDictionary } from "./types";
import { storeCachedTranslation } from "@/lib/language-preference";
import { normalizePlaceholders } from "@/lib/i18n";

const initialState: I18nState = {
  byCacheKey: {},
  loading: {},
  error: null,
};

function cacheKey(namespace: string, languageCacheKey: string): string {
  return `${namespace}:${languageCacheKey}`;
}

export const fetchTranslation = createAsyncThunk(
  "i18n/fetchTranslation",
  async (params: {
    namespace: string;
    source: TranslationDictionary;
    languageCacheKey: string;
  }) => {
    // Backend resolves the target language itself from the authenticated
    // user (user.language.name), so no `target` is sent here. `data` keeps
    // string values only, so no ignoreKeys are needed — every value in
    // these locale JSONs is meant to be translated.
    const res = await apiFetch<ApiResponse<TranslationDictionary>>("/translation/json", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data: params.source }),
    });

    const translated = res.data.data;
    const normalized = { ...translated };
    for (const key of Object.keys(params.source)) {
      if (typeof translated[key] === "string") {
        normalized[key] = normalizePlaceholders(params.source[key], translated[key]);
      }
    }

    const result = {
      cacheKey: cacheKey(params.namespace, params.languageCacheKey),
      dict: normalized,
    };
    storeCachedTranslation(result.cacheKey, result.dict);
    return result;
  },
);

const i18nSlice = createSlice({
  name: "i18n",
  initialState,
  reducers: {
    resetTranslations() {
      return initialState;
    },
    restoreTranslation(state, action: { payload: { cacheKey: string; dict: TranslationDictionary } }) {
      state.byCacheKey[action.payload.cacheKey] = action.payload.dict;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTranslation.pending, (state, action) => {
        state.loading[cacheKey(action.meta.arg.namespace, action.meta.arg.languageCacheKey)] = true;
        state.error = null;
      })
      .addCase(fetchTranslation.fulfilled, (state, action) => {
        state.loading[action.payload.cacheKey] = false;
        state.byCacheKey[action.payload.cacheKey] = action.payload.dict;
      })
      .addCase(fetchTranslation.rejected, (state, action) => {
        const key = cacheKey(action.meta.arg.namespace, action.meta.arg.languageCacheKey);
        state.loading[key] = false;
        state.error = action.error.message ?? "Failed to load translations";
      });
  },
});

export const { resetTranslations, restoreTranslation } = i18nSlice.actions;
export default i18nSlice.reducer;
