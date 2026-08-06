// features/expenses/types.ts
export type ExpenseRange = "week" | "month" | "trip";

export type ExpenseCategory = {
  id: string;
  name: string;
  color: string;
};

export type ExpenseCurrency = {
  id: string;
  code: string;
  name: string;
};

export type Expense = {
  id: string;
  amount: string | number;
  convertedAmount: number | null;
  convertedCurrencyId: string | null;
  date: string;
  shop: string | null;
  category: ExpenseCategory | null;
  currency: ExpenseCurrency | null;
};

export type CategoryBreakdown = {
  categoryId: string | null;
  categoryName: string | null;
  categoryColor: string | null;
  total: number;
  count: number;
};

export type ExpenseStatistics = {
  total: number;
  count: number;
  currencyId: string | null;
  groupBy: "day" | "month" | "year";
  byCategory: CategoryBreakdown[];
  byPeriod: PeriodBreakdown[];
};

export type PeriodBreakdown = {
  period: string;
  total: number;
  count: number;
};

export type ExpensesState = {
  range: ExpenseRange;
  total: number;
  count: number;
  byCategory: CategoryBreakdown[];
  byPeriod: PeriodBreakdown[];
  currencyId: string | null;
  largest: Expense[];
  // Locally set target only — no budget entity/endpoint exists on the
  // backend yet, so this never round-trips to the server. See note below.
  budget: number;
  loading: boolean;
  error: string | null;

  // True once the initial overview fetch has settled (fulfilled OR
  // rejected) at least once — gates the page skeleton. Range switches
  // re-trigger `loading` but don't reset this back to false, so switching
  // tabs shows inline loading states, not the full skeleton again.
  dataLoaded: boolean;
};
