// store/faq/faqSlice.ts
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

import type { FaqState, Faq } from "../settings/types";
import { apiFetch, type ApiResponse } from "@/lib/api-client";

const initialState: FaqState = {
  items: [],
  loading: false,
  error: null,
  faqsLoaded: false,
};

// Public endpoint (OptionalFirebaseAuthGuard) — works logged out too, and
// `category` comes back eager-loaded on each Faq, so one call is enough
// to group by category on the frontend without extra requests.
export const fetchFaqs = createAsyncThunk("faq/fetchAll", async () => {
  const res = await apiFetch<ApiResponse<Faq[]>>("/faqs");
  return res.data;
});

const faqSlice = createSlice({
  name: "faq",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchFaqs.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchFaqs.fulfilled, (state, action) => {
        state.loading = false;
        state.faqsLoaded = true;
        state.items = action.payload;
      })
      .addCase(fetchFaqs.rejected, (state, action) => {
        state.loading = false;
        state.faqsLoaded = true;
        state.error = action.error.message ?? "Failed to load FAQs";
      });
  },
});

export default faqSlice.reducer;