export type BudgetStatus = "active" | "completed" | "archived";

export type BudgetCategoryLimit = {
  categoryId: string;
  categoryName: string;
  color: string;
  amount: number;
};

export type BudgetReminderSettings = {
  dailyEnabled: boolean;
  dailyTime: string;
  threshold80: boolean;
  threshold100: boolean;
  browserNotifications: boolean;
};

export type BudgetPlan = {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  currencyId: string;
  currencyCode: string;
  totalAmount: number;
  status: BudgetStatus;
  categoryLimits: BudgetCategoryLimit[];
  reminders: BudgetReminderSettings;
  notifiedThresholds: number[];
  lastDailyReminderDate: string | null;
  createdAt: string;
  updatedAt: string;
};

export type BudgetExpense = {
  id: string;
  amount: number | string;
  convertedAmount?: number | null;
  date: string;
  shop: string | null;
  googlePlaceId?: string | null;
  merchantAddress?: string | null;
  merchantLatitude?: string | number | null;
  merchantLongitude?: string | number | null;
  googleMapsUri?: string | null;
  category: { id: string; name: string; color?: string | null } | null;
  currency: { id: string; code: string } | null;
};

export type BudgetAlert = {
  id: string;
  planId: string;
  title: string;
  body: string;
  createdAt: string;
  kind?: "threshold" | "daily";
  threshold?: number;
  spent?: number;
  total?: number;
};

export type BudgetsState = {
  plans: BudgetPlan[];
  activePlanId: string | null;
  expenses: BudgetExpense[];
  alerts: BudgetAlert[];
  hydrated: boolean;
  loadingExpenses: boolean;
  saving: boolean;
  error: string | null;
  storageOwnerId: string | null;
};

export type BudgetDraft = Omit<BudgetPlan, "id" | "status" | "notifiedThresholds" | "lastDailyReminderDate" | "createdAt" | "updatedAt">;
