// features/subscription/subscriptionSlice.ts
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

import type { Plan, SubscriptionState } from "./types";
import { apiFetch, type ApiResponse } from "@/lib/api-client";

const initialState: SubscriptionState = {
  plans: [],
  plansLoaded: false,
  loading: false,
  checkingOut: null,
  error: null,
};

export const fetchPlans = createAsyncThunk("subscription/fetchPlans", async () => {
  const res = await apiFetch<ApiResponse<Plan[]>>("/payment-plans");
  return res.data;
});

export const checkoutPlan = createAsyncThunk(
  "subscription/checkoutPlan",
  async (planId: string) => {
    const res = await apiFetch<ApiResponse<{ paymentId: string; checkoutUrl: string }>>(
      `/payment/checkout/${planId}`,
      { method: "POST" },
    );
    return res.data;
  },
);

export const verifyPayment = createAsyncThunk(
  "subscription/verifyPayment",
  async (paymentId: string) => {
    const res = await apiFetch<ApiResponse<{ status: "pending" | "succeeded" | "failed" }>>(
      `/payment/${paymentId}/verify`,
      { method: "POST" },
    );
    return res.data;
  },
);

const subscriptionSlice = createSlice({
  name: "subscription",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchPlans.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPlans.fulfilled, (state, action) => {
        state.loading = false;
        state.plansLoaded = true;
        state.plans = action.payload;
      })
      .addCase(fetchPlans.rejected, (state, action) => {
        state.loading = false;
        state.plansLoaded = true;
        state.error = action.error.message ?? "Failed to load plans";
      })
      .addCase(checkoutPlan.pending, (state, action) => {
        state.checkingOut = action.meta.arg;
        state.error = null;
      })
      .addCase(checkoutPlan.fulfilled, (state) => {
        state.checkingOut = null;
      })
      .addCase(checkoutPlan.rejected, (state, action) => {
        state.checkingOut = null;
        state.error = action.error.message ?? "Failed to start checkout";
      });
  },
});

export default subscriptionSlice.reducer;
