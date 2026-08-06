// store/account/accountSlice.ts
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

import type { AccountState, Profile, Currency, Country, Language } from "./types";
import { apiFetch, type ApiResponse } from "@/lib/api-client";

const initialState: AccountState = {
  profile: null,
  currencies: [],
  countries: [],
  languages: [],
  loading: false,
  referenceLoading: false,
  saving: false,
  error: null,

  profileLoaded: false,
  referenceLoaded: false,
};

export const fetchProfile = createAsyncThunk("account/fetchProfile", async () => {
  const res = await apiFetch<ApiResponse<Profile>>("/users/me");
  return res.data;
});

// Currencies/countries/languages rarely change and the edit form needs all
// three at once, so fetch them together rather than firing three separate
// thunks from the component.
export const fetchReferenceData = createAsyncThunk("account/fetchReferenceData", async () => {
  const [currenciesRes, countriesRes, languagesRes] = await Promise.all([
    apiFetch<ApiResponse<Currency[]>>("/currencies"),
    apiFetch<ApiResponse<Country[]>>("/countries"),
    apiFetch<ApiResponse<Language[]>>("/languages"),
  ]);

  return {
    currencies: currenciesRes.data,
    countries: countriesRes.data,
    languages: languagesRes.data,
  };
});

export const saveProfile = createAsyncThunk(
  "account/saveProfile",
  async (payload: {
    fields: Partial<Pick<Profile, "displayName" | "currencyId" | "currentCountryId" | "languageId">>;
    image?: File;
  }) => {
    const form = new FormData();
    if (payload.fields.displayName) form.append("displayName", payload.fields.displayName);
    if (payload.fields.currencyId) form.append("currencyId", payload.fields.currencyId);
    if (payload.fields.currentCountryId) form.append("currentCountryId", payload.fields.currentCountryId);
    if (payload.fields.languageId) form.append("languageId", payload.fields.languageId);
    if (payload.image) form.append("image", payload.image);

    const res = await apiFetch<ApiResponse<Profile>>("/users/me", {
      method: "PATCH",
      body: form,
    });
    return res.data;
  },
);

const accountSlice = createSlice({
  name: "account",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.profileLoaded = true;
        state.profile = action.payload;
      })
      .addCase(fetchProfile.rejected, (state, action) => {
        state.loading = false;
        state.profileLoaded = true;
        state.error = action.error.message ?? "Failed to load profile";
      })
      .addCase(fetchReferenceData.pending, (state) => {
        state.referenceLoading = true;
      })
      .addCase(fetchReferenceData.fulfilled, (state, action) => {
        state.referenceLoading = false;
        state.referenceLoaded = true;
        state.currencies = action.payload.currencies;
        state.countries = action.payload.countries;
        state.languages = action.payload.languages;
      })
      .addCase(fetchReferenceData.rejected, (state, action) => {
        state.referenceLoading = false;
        state.referenceLoaded = true;
        state.error = action.error.message ?? "Failed to load reference data";
      })
      .addCase(saveProfile.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(saveProfile.fulfilled, (state, action) => {
        state.saving = false;
        state.profile = action.payload;
      })
      .addCase(saveProfile.rejected, (state, action) => {
        state.saving = false;
        state.error = action.error.message ?? "Failed to save profile";
      });
  },
});

export default accountSlice.reducer;