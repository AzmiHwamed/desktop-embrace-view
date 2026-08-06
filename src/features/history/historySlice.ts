// features/history/historySlice.ts
import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit";

import { apiFetch, type ApiResponse } from "@/lib/api-client";
import type {
  CreateExpenseInput,
  Currency,
  DateRangeDays,
  Expense,
  ExpenseCategory,
  HistoryState,
  UpdateExpenseInput,
} from "./types";

const initialState: HistoryState = {
  query: "",
  categoryId: "all",
  dateRange: "7",
  items: [],
  categories: [],
  currencies: [],
  loading: false,
  creating: false,
  updating: false,
  creatingCategory: false,
  error: null,

  categoriesLoaded: false,
  currenciesLoaded: false,
  historyLoaded: false,
};

function getDateRangeStart(days: DateRangeDays): string {
  const start = new Date();
  // Include today as one of the requested calendar days and send an exact
  // boundary rather than a date-only value that the backend parses as UTC.
  start.setDate(start.getDate() - (Number(days) - 1));
  start.setHours(0, 0, 0, 0);
  return start.toISOString();
}

function buildQuery(params: Record<string, string | undefined>): string {
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) searchParams.set(key, value);
  }
  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

export const fetchHistory = createAsyncThunk(
  "history/fetch",
  async (params: { categoryId: string; dateRange: DateRangeDays }) => {
    const startDate = getDateRangeStart(params.dateRange);
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    const endDate = end.toISOString();

    const query = buildQuery({
      startDate,
      endDate,
      categoryId: params.categoryId !== "all" ? params.categoryId : undefined,
    });

    const res = await apiFetch<ApiResponse<Expense[]>>(`/expenses${query}`);
    return res.data;
  },
);

// NOTE: assuming a REST shape at GET /expense-categories, following the same
// pattern as /currencies, /countries, /languages (public list endpoints
// elsewhere in this backend). I haven't seen an ExpenseCategoryController,
// so double check this path against your actual route before relying on it.
export const fetchExpenseCategories = createAsyncThunk(
  "history/fetchCategories",
  async () => {
    const res = await apiFetch<ApiResponse<ExpenseCategory[]>>("/expense-categories");
    return res.data;
  },
);

// Fetched locally (rather than reading from account slice's currencies) so
// this feature doesn't depend on the account slice having been loaded first.
export const fetchCurrencies = createAsyncThunk("history/fetchCurrencies", async () => {
  const res = await apiFetch<ApiResponse<Currency[]>>("/currencies");
  return res.data;
});

export const createExpenseCategory = createAsyncThunk(
  "history/createExpenseCategory",
  async (payload: { name: string }) => {
    const res = await apiFetch<ApiResponse<ExpenseCategory>>("/expense-categories", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return res.data;
  },
);

// Assumes apiFetch JSON-stringifies a plain object body and sets
// Content-Type: application/json when body isn't FormData — adjust the
// `body:` lines below if your api-client wrapper needs an explicit
// JSON.stringify() or headers instead.
export const createExpense = createAsyncThunk(
  "history/createExpense",
  async (payload: CreateExpenseInput) => {
    const res = await apiFetch<ApiResponse<Expense>>("/expenses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return res.data;
  },
);

export const updateExpense = createAsyncThunk(
  "history/updateExpense",
  async ({ id, ...payload }: UpdateExpenseInput) => {
    const res = await apiFetch<ApiResponse<Expense>>(`/expenses/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return res.data;
  },
);
const historySlice = createSlice({
  name: "history",
  initialState,
  reducers: {
    setQuery(state, action: PayloadAction<string>) {
      state.query = action.payload;
    },
    setCategory(state, action: PayloadAction<string>) {
      state.categoryId = action.payload;
    },
    setDateRange(state, action: PayloadAction<DateRangeDays>) {
      state.dateRange = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchHistory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchHistory.fulfilled, (state, action) => {
        state.loading = false;
        state.historyLoaded = true;
        state.items = action.payload;
      })
      .addCase(fetchHistory.rejected, (state, action) => {
        state.loading = false;
        state.historyLoaded = true;
        state.error = action.error.message ?? "Failed to load history";
      })
      .addCase(fetchExpenseCategories.fulfilled, (state, action) => {
        state.categoriesLoaded = true;
        state.categories = action.payload;
      })
      .addCase(fetchExpenseCategories.rejected, (state, action) => {
        state.categoriesLoaded = true;
        state.error = action.error.message ?? "Failed to load categories";
      })
      .addCase(fetchCurrencies.fulfilled, (state, action) => {
        state.currenciesLoaded = true;
        state.currencies = action.payload;
      })
      .addCase(fetchCurrencies.rejected, (state, action) => {
        state.currenciesLoaded = true;
        state.error = action.error.message ?? "Failed to load currencies";
      })
      .addCase(createExpenseCategory.pending, (state) => {
        state.creatingCategory = true;
        state.error = null;
      })
      .addCase(createExpenseCategory.fulfilled, (state, action) => {
        state.creatingCategory = false;
        state.categories.push(action.payload);
      })
      .addCase(createExpenseCategory.rejected, (state, action) => {
        state.creatingCategory = false;
        state.error = action.error.message ?? "Failed to create category";
      })
      .addCase(createExpense.pending, (state) => {
        state.creating = true;
        state.error = null;
      })
      .addCase(createExpense.fulfilled, (state) => {
        state.creating = false;
      })
      .addCase(createExpense.rejected, (state, action) => {
        state.creating = false;
        state.error = action.error.message ?? "Failed to create expense";
      })
      .addCase(updateExpense.pending, (state) => {
        state.updating = true;
        state.error = null;
      })
      .addCase(updateExpense.fulfilled, (state) => {
        state.updating = false;
      })
      .addCase(updateExpense.rejected, (state, action) => {
        state.updating = false;
        state.error = action.error.message ?? "Failed to update expense";
      });
  },
});

export const { setQuery, setCategory, setDateRange } = historySlice.actions;
export default historySlice.reducer;
