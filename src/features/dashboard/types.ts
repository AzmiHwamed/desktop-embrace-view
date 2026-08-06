// features/dashboard/types.ts
export type DashboardRange = "week" | "month";

export type SpendPoint = { day: string; spend: number };

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
  byPeriod: { period: string; total: number; count: number }[];
};

export type DashboardState = {
  range: DashboardRange;
  spentThisPeriod: number;
  countThisPeriod: number;
  byCategory: CategoryBreakdown[];
  trend: SpendPoint[];
  recent: Expense[];
  loading: boolean;
  trendLoading: boolean;
  dataLoaded: boolean;   // true once fetchDashboardData has settled at least once
  trendLoaded: boolean;  // true once fetchSpendingTrend has settled at least once
  error: string | null;
};
