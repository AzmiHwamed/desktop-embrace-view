import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

import { rates, spendTrend, transactions } from "@/lib/travel-data";

import type { DashboardRange, DashboardState } from "./types";

const initialState: DashboardState = {
  range: "week",
  balance: 2480.5,
  recent: transactions.slice(0, 5),
  trend: spendTrend,
  rates,
};

const dashboardSlice = createSlice({
  name: "dashboard",
  initialState,
  reducers: {
    setRange(state, action: PayloadAction<DashboardRange>) {
      state.range = action.payload;
    },
  },
});

export const { setRange } = dashboardSlice.actions;
export default dashboardSlice.reducer;
