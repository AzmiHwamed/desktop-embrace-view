// features/history/types.ts
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

// Same shape as ExpenseCurrency — kept as its own alias since this is what
// the form's currency picker consumes, sourced from GET /currencies.
export type Currency = ExpenseCurrency;

export type Expense = {
  id: string;
  amount: number;
  description: string | null; // was missing even though HistoryPage already reads it
  date: string;
  shop: string | null;
  googlePlaceId?: string | null;
  merchantAddress?: string | null;
  merchantLatitude?: string | number | null;
  merchantLongitude?: string | number | null;
  googleMapsUri?: string | null;
  merchantMatchConfidence?: number | null;
  category: ExpenseCategory | null;
  currency: ExpenseCurrency | null;
};

export type DateRangeDays = "7" | "30" | "90";

export type HistoryState = {
  query: string;
  categoryId: string; // "all" or a real category id
  dateRange: DateRangeDays;
  items: Expense[];
  categories: ExpenseCategory[];
  currencies: Currency[];
  loading: boolean;
  creating: boolean;
  updating: boolean;
  creatingCategory: boolean;
  error: string | null;

  // True once each initial fetch has settled (fulfilled OR rejected) at
  // least once — gates the page skeleton independently of `loading`,
  // which only tracks fetchHistory re-runs triggered by filter changes.
  categoriesLoaded: boolean;
  currenciesLoaded: boolean;
  historyLoaded: boolean;
};

export type ExpenseFormValues = {
  amount: number;
  description?: string;
  shop?: string;
  date: string; // yyyy-mm-dd
  categoryId: string;
  currencyId?: string;
};

export type CreateExpenseInput = ExpenseFormValues;
export type UpdateExpenseInput = ExpenseFormValues & { id: string };
