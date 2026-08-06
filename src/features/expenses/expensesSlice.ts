// features/expenses/expensesSlice.ts
import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit";

import { apiFetch, type ApiResponse } from "@/lib/api-client";
import type { Expense, ExpenseRange, ExpenseStatistics, ExpensesState } from "./types";

const initialState: ExpensesState = {
  range: "week",
  total: 0,
  count: 0,
  byCategory: [],
  byPeriod: [],
  currencyId: null,
  largest: [],
  budget: 1200,
  loading: false,
  error: null,
  dataLoaded: false,
};

// "trip" has no real date range on the backend (no trip entity), so it's
// treated as "all time" — no startDate/endDate sent, statistics/expenses
// endpoints just return everything for the user.
function getRangeDates(range: ExpenseRange): { startDate?: string; endDate?: string } {
  if (range === "trip") return {};

  const now = new Date();
  const endDate = now.toISOString();
  const start = new Date(now);

  if (range === "week") {
    const day = start.getDay();
    const diff = day === 0 ? 6 : day - 1;
    start.setDate(start.getDate() - diff);
  } else {
    start.setDate(1);
  }

  start.setHours(0, 0, 0, 0);

  return { startDate: start.toISOString(), endDate };
}

function buildQuery(params: Record<string, string | undefined>): string {
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) searchParams.set(key, value);
  }
  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

export const fetchExpensesOverview = createAsyncThunk<
  {
    total: number;
    count: number;
    currencyId: string | null;
    byCategory: ExpenseStatistics["byCategory"];
    byPeriod: ExpenseStatistics["byPeriod"];
    largest: Expense[];
  },
  ExpenseRange,
  { rejectValue: string }
>(
  "expenses/fetchOverview",
  async (range, { rejectWithValue }) => {
    try {
      const { startDate, endDate } = getRangeDates(range);
      const listQuery = buildQuery({ startDate, endDate });
      const statisticsQuery = buildQuery({
        startDate,
        endDate,
        groupBy: range === "trip" ? "month" : "day",
      });

      const [statsRes, listRes] = await Promise.all([
        apiFetch<ApiResponse<ExpenseStatistics>>(`/expenses/statistics${statisticsQuery}`),
        apiFetch<ApiResponse<Expense[]>>(`/expenses${listQuery}`),
      ]);

      // The service converts every row to the user's home currency. Rank by
      // that value so unlike currencies are compared correctly; fall back to
      // the original amount only when conversion was unavailable.
      const largest = [...listRes.data]
        .sort(
          (a, b) =>
            Number(b.convertedAmount ?? b.amount) - Number(a.convertedAmount ?? a.amount),
        )
        .slice(0, 6);

      return {
        total: Number(statsRes.data.total) || 0,
        count: Number(statsRes.data.count) || 0,
        currencyId: statsRes.data.currencyId ?? null,
        byCategory: statsRes.data.byCategory ?? [],
        byPeriod: statsRes.data.byPeriod ?? [],
        largest,
      };
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : "Failed to load expenses");
    }
  },
);

const expensesSlice = createSlice({
  name: "expenses",
  initialState,
  reducers: {
    setExpenseRange(state, action: PayloadAction<ExpenseRange>) {
      state.range = action.payload;
    },
    setBudget(state, action: PayloadAction<number>) {
      state.budget = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchExpensesOverview.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchExpensesOverview.fulfilled, (state, action) => {
        state.loading = false;
        state.dataLoaded = true;
        state.total = action.payload.total;
        state.count = action.payload.count;
        state.currencyId = action.payload.currencyId;
        state.byCategory = action.payload.byCategory;
        state.byPeriod = action.payload.byPeriod;
        state.largest = action.payload.largest;
      })
      .addCase(fetchExpensesOverview.rejected, (state, action) => {
        state.loading = false;
        state.dataLoaded = true;
        state.error = action.payload ?? action.error.message ?? "Failed to load expenses";
      });
  },
});

export const { setExpenseRange, setBudget } = expensesSlice.actions;
export default expensesSlice.reducer;
