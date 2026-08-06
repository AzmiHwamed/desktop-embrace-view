// features/dashboard/dashboardSlice.ts
import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit";

import { apiFetch, type ApiResponse } from "@/lib/api-client";
import type {
  DashboardRange,
  DashboardState,
  Expense,
  ExpenseStatistics,
  SpendPoint,
} from "./types";

const initialState: DashboardState = {
  range: "week",
  spentThisPeriod: 0,
  countThisPeriod: 0,
  byCategory: [],
  trend: [],
  recent: [],
  loading: false,
  trendLoading: false,
  dataLoaded: false,
  trendLoaded: false,
  error: null,
};

function getRangeDates(range: DashboardRange): { startDate: string; endDate: string } {
  const now = new Date();
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);

  const start = new Date(now);
  if (range === "week") {
    const day = start.getDay(); // 0 = Sunday
    const diff = day === 0 ? 6 : day - 1;
    start.setDate(start.getDate() - diff);
  } else {
    start.setDate(1);
  }
  start.setHours(0, 0, 0, 0);

  return { startDate: start.toISOString(), endDate: end.toISOString() };
}

// Trend chart always shows a fixed rolling window, independent of the
// week/month stat-card toggle.
function getTrendWindow(): { startDate: string; endDate: string } {
  const now = new Date();
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);
  const start = new Date(now);
  start.setDate(start.getDate() - 29);
  start.setHours(0, 0, 0, 0);
  return { startDate: start.toISOString(), endDate: end.toISOString() };
}

function buildQuery(params: Record<string, string>): string {
  return new URLSearchParams(params).toString();
}

function formatPeriodLabel(period: string): string {
  const date = new Date(period);
  return date.toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

// Range-scoped: stat cards, category breakdown, recent list.
export const fetchDashboardData = createAsyncThunk(
  "dashboard/fetchData",
  async (range: DashboardRange) => {
    const { startDate, endDate } = getRangeDates(range);
    const statisticsQuery = buildQuery({ startDate, endDate, groupBy: "day" });

    const [statsRes, recentRes] = await Promise.all([
      apiFetch<ApiResponse<ExpenseStatistics>>(
        `/expenses/statistics?${statisticsQuery}`,
      ),
      // The backend already orders this endpoint newest first. Do not apply
      // the dashboard range here: "Recent activity" should show the latest
      // saved expenses even when they fall outside the selected stats period.
      apiFetch<ApiResponse<Expense[]>>("/expenses"),
    ]);

    return {
      total: statsRes.data.total,
      count: statsRes.data.count,
      byCategory: statsRes.data.byCategory,
      recent: recentRes.data.slice(0, 8),
    };
  },
);

// Fixed 30-day window, unaffected by the range toggle.
export const fetchSpendingTrend = createAsyncThunk("dashboard/fetchTrend", async () => {
  const { startDate, endDate } = getTrendWindow();
  const query = buildQuery({ startDate, endDate, groupBy: "day" });

  const res = await apiFetch<ApiResponse<ExpenseStatistics>>(
    `/expenses/statistics?${query}`,
  );

  const trend: SpendPoint[] = res.data.byPeriod.map((p) => ({
    day: formatPeriodLabel(p.period),
    spend: p.total,
  }));

  return trend;
});

const dashboardSlice = createSlice({
  name: "dashboard",
  initialState,
  reducers: {
    setRange(state, action: PayloadAction<DashboardRange>) {
      state.range = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboardData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDashboardData.fulfilled, (state, action) => {
        state.loading = false;
        state.dataLoaded = true;
        state.spentThisPeriod = action.payload.total;
        state.countThisPeriod = action.payload.count;
        state.byCategory = action.payload.byCategory;
        state.recent = action.payload.recent;
      })
      .addCase(fetchDashboardData.rejected, (state, action) => {
        state.loading = false;
        state.dataLoaded = true;
        state.error = action.error.message ?? "Failed to load dashboard data";
      })
      .addCase(fetchSpendingTrend.pending, (state) => {
        state.trendLoading = true;
      })
      .addCase(fetchSpendingTrend.fulfilled, (state, action) => {
        state.trendLoading = false;
        state.trendLoaded = true;
        state.trend = action.payload;
      })
      .addCase(fetchSpendingTrend.rejected, (state, action) => {
        state.trendLoading = false;
        state.trendLoaded = true;
        state.error = action.error.message ?? "Failed to load spending trend";
      });
  },
});

export const { setRange } = dashboardSlice.actions;
export default dashboardSlice.reducer;
