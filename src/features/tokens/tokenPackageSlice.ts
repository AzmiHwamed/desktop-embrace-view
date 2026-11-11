import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

import type { TokenPackage, TokenPackageState } from "./types";
import { apiFetch, type ApiResponse } from "@/lib/api-client";

const initialState: TokenPackageState = {
  plans: [],
  plansLoaded: false,
  loading: false,
  checkingOut: null,
  error: null,
};

export const fetchTokenPackages = createAsyncThunk("tokens/fetchPackages", async () => {
  const res = await apiFetch<ApiResponse<TokenPackage[]>>("/payment-plans");
  return res.data;
});

export const checkoutTokenPackage = createAsyncThunk(
  "tokens/checkoutPackage",
  async (planId: string) => {
    const res = await apiFetch<ApiResponse<{ paymentId: string; checkoutUrl: string }>>(
      `/payment/checkout/${planId}`,
      { method: "POST" },
    );
    return res.data;
  },
);

export const verifyTokenPayment = createAsyncThunk(
  "tokens/verifyPayment",
  async (paymentId: string) => {
    const res = await apiFetch<ApiResponse<{ status: "pending" | "succeeded" | "failed" }>>(
      `/payment/${paymentId}/verify`,
      { method: "POST" },
    );
    return res.data;
  },
);

const tokenPackageSlice = createSlice({
  name: "tokens",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchTokenPackages.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTokenPackages.fulfilled, (state, action) => {
        state.loading = false;
        state.plansLoaded = true;
        state.plans = action.payload;
      })
      .addCase(fetchTokenPackages.rejected, (state, action) => {
        state.loading = false;
        state.plansLoaded = true;
        state.error = action.error.message ?? "Failed to load plans";
      })
      .addCase(checkoutTokenPackage.pending, (state, action) => {
        state.checkingOut = action.meta.arg;
        state.error = null;
      })
      .addCase(checkoutTokenPackage.fulfilled, (state) => {
        state.checkingOut = null;
      })
      .addCase(checkoutTokenPackage.rejected, (state, action) => {
        state.checkingOut = null;
        state.error = action.error.message ?? "Failed to start checkout";
      });
  },
});

export default tokenPackageSlice.reducer;
