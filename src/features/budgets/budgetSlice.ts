import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";

import { apiFetch, type ApiResponse } from "@/lib/api-client";
import type { BudgetAlert, BudgetDraft, BudgetExpense, BudgetPlan, BudgetsState } from "./types";

const STORAGE_KEY = "smarttravel.budgets.v1";
type BudgetRootState = {
  budgets: BudgetsState;
  account: { profile: { id: string } | null };
};

const initialState: BudgetsState = {
  plans: [],
  activePlanId: null,
  expenses: [],
  alerts: [],
  hydrated: false,
  loadingExpenses: false,
  saving: false,
  error: null,
  storageOwnerId: null,
};

function userStorageKey(userId?: string) {
  return `${STORAGE_KEY}:${userId ?? "anonymous"}`;
}

function readStored(userId?: string): Pick<BudgetsState, "plans" | "activePlanId" | "alerts"> {
  if (typeof window === "undefined") return { plans: [], activePlanId: null, alerts: [] };
  try {
    const parsed = JSON.parse(localStorage.getItem(userStorageKey(userId)) ?? "null");
    return parsed && Array.isArray(parsed.plans)
      ? {
          plans: parsed.plans,
          activePlanId: parsed.activePlanId ?? null,
          alerts: parsed.alerts ?? [],
        }
      : { plans: [], activePlanId: null, alerts: [] };
  } catch {
    return { plans: [], activePlanId: null, alerts: [] };
  }
}

function persist(state: Pick<BudgetsState, "plans" | "activePlanId" | "alerts">, userId?: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(
    userStorageKey(userId),
    JSON.stringify({
      plans: state.plans,
      activePlanId: state.activePlanId,
      alerts: state.alerts.slice(0, 30),
    }),
  );
}

export const hydrateBudgets = createAsyncThunk("budgets/hydrate", async (_, { getState }) => {
  const ownerId = (getState() as BudgetRootState).account.profile?.id;
  return { ...readStored(ownerId), ownerId: ownerId ?? null };
});

export const saveBudgetPlan = createAsyncThunk<BudgetPlan, BudgetDraft, { state: BudgetRootState }>(
  "budgets/savePlan",
  async (draft, { getState }) => {
    const now = new Date().toISOString();
    const plan: BudgetPlan = {
      ...draft,
      id: crypto.randomUUID(),
      status: "active",
      notifiedThresholds: [],
      lastDailyReminderDate: null,
      createdAt: now,
      updatedAt: now,
    };
    const state = getState().budgets;
    const plans = state.plans.map((item) =>
      item.status === "active" ? { ...item, status: "completed" as const } : item,
    );
    plans.unshift(plan);
    persist({ plans, activePlanId: plan.id, alerts: state.alerts }, getState().account.profile?.id);
    return plan;
  },
);

export const fetchBudgetExpenses = createAsyncThunk<
  BudgetExpense[],
  BudgetPlan,
  { rejectValue: string }
>("budgets/fetchExpenses", async (plan, { rejectWithValue }) => {
  try {
    const start = new Date(`${plan.startDate}T00:00:00`);
    const end = new Date(`${plan.endDate}T23:59:59.999`);
    const query = new URLSearchParams({
      startDate: start.toISOString(),
      endDate: end.toISOString(),
    });
    const response = await apiFetch<ApiResponse<BudgetExpense[]>>(`/expenses?${query}`);
    return response.data;
  } catch (error) {
    return rejectWithValue(
      error instanceof Error ? error.message : "Unable to load budget expenses",
    );
  }
});

export const evaluateBudgetReminders = createAsyncThunk<void, void, { state: BudgetRootState }>(
  "budgets/evaluateReminders",
  async (_, { getState, dispatch }) => {
    const root = getState();
    const plan = root.budgets.plans.find((item) => item.id === root.budgets.activePlanId);
    if (!plan || plan.status !== "active") return;
    const spent = root.budgets.expenses.reduce(
      (sum, expense) => sum + Number(expense.convertedAmount ?? expense.amount ?? 0),
      0,
    );
    const percentage = plan.totalAmount > 0 ? (spent / plan.totalAmount) * 100 : 0;
    const today = new Date().toISOString().slice(0, 10);
    const alerts: BudgetAlert[] = [];
    const thresholds = [
      { value: 80, enabled: plan.reminders.threshold80 },
      { value: 100, enabled: plan.reminders.threshold100 },
    ];
    for (const threshold of thresholds) {
      if (
        threshold.enabled &&
        percentage >= threshold.value &&
        !plan.notifiedThresholds.includes(threshold.value)
      ) {
        alerts.push({
          id: crypto.randomUUID(),
          planId: plan.id,
          title: `${plan.name}: ${threshold.value}%`,
          body: `${plan.currencyCode} ${spent.toFixed(2)} of ${plan.currencyCode} ${plan.totalAmount.toFixed(2)} spent.`,
          createdAt: new Date().toISOString(),
          kind: "threshold",
          threshold: threshold.value,
          spent,
          total: plan.totalAmount,
        });
      }
    }
    const currentTime = new Date().toTimeString().slice(0, 5);
    if (
      plan.reminders.dailyEnabled &&
      currentTime >= plan.reminders.dailyTime &&
      plan.lastDailyReminderDate !== today
    ) {
      alerts.push({
        id: crypto.randomUUID(),
        planId: plan.id,
        title: plan.name,
        body: "Remember to add today's travel expenses.",
        createdAt: new Date().toISOString(),
        kind: "daily",
      });
    }
    if (!alerts.length) return;
    dispatch(remindersTriggered(alerts));
    const latest = getState();
    persist(latest.budgets, latest.budgets.storageOwnerId ?? undefined);
    if (
      plan.reminders.browserNotifications &&
      typeof Notification !== "undefined" &&
      Notification.permission === "granted"
    ) {
      alerts.forEach((alert) => new Notification(alert.title, { body: alert.body }));
    }
  },
);

const budgetSlice = createSlice({
  name: "budgets",
  initialState,
  reducers: {
    updatePlan(state, action: PayloadAction<{ id: string; draft: BudgetDraft }>) {
      const plan = state.plans.find((item) => item.id === action.payload.id);
      if (!plan) return;
      Object.assign(plan, action.payload.draft, { updatedAt: new Date().toISOString() });
      persist(state, state.storageOwnerId ?? undefined);
    },
    activatePlan(state, action: PayloadAction<string>) {
      const target = state.plans.find((item) => item.id === action.payload);
      if (!target) return;
      state.plans.forEach((item) => {
        if (item.status === "active") item.status = "completed";
      });
      target.status = "active";
      target.updatedAt = new Date().toISOString();
      state.activePlanId = target.id;
      state.expenses = [];
      persist(state, state.storageOwnerId ?? undefined);
    },
    archivePlan(state, action: PayloadAction<string>) {
      const plan = state.plans.find((item) => item.id === action.payload);
      if (plan) plan.status = "archived";
      if (state.activePlanId === action.payload) state.activePlanId = null;
      persist(state, state.storageOwnerId ?? undefined);
    },
    remindersTriggered(state, action: PayloadAction<BudgetAlert[]>) {
      const plan = state.plans.find((item) => item.id === state.activePlanId);
      if (!plan) return;
      for (const alert of action.payload) {
        state.alerts.unshift(alert);
        const threshold = Number(alert.title.match(/(80|100)%/)?.[1]);
        if (threshold && !plan.notifiedThresholds.includes(threshold))
          plan.notifiedThresholds.push(threshold);
        if (alert.body.includes("Remember to add"))
          plan.lastDailyReminderDate = new Date().toISOString().slice(0, 10);
      }
    },
    dismissAlert(state, action: PayloadAction<string>) {
      state.alerts = state.alerts.filter((alert) => alert.id !== action.payload);
      persist(state, state.storageOwnerId ?? undefined);
    },
  },
  extraReducers(builder) {
    builder
      .addCase(hydrateBudgets.fulfilled, (state, action) => {
        state.plans = action.payload.plans;
        state.activePlanId = action.payload.activePlanId;
        state.alerts = action.payload.alerts;
        state.storageOwnerId = action.payload.ownerId;
        state.hydrated = true;
      })
      .addCase(hydrateBudgets.rejected, (state) => {
        state.hydrated = true;
      })
      .addCase(saveBudgetPlan.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(saveBudgetPlan.fulfilled, (state, action) => {
        state.saving = false;
        state.plans.forEach((item) => {
          if (item.status === "active") item.status = "completed";
        });
        state.plans.unshift(action.payload);
        state.activePlanId = action.payload.id;
        state.expenses = [];
      })
      .addCase(saveBudgetPlan.rejected, (state, action) => {
        state.saving = false;
        state.error = action.error.message ?? "Unable to save budget";
      })
      .addCase(fetchBudgetExpenses.pending, (state) => {
        state.loadingExpenses = true;
        state.error = null;
      })
      .addCase(fetchBudgetExpenses.fulfilled, (state, action) => {
        state.loadingExpenses = false;
        state.expenses = action.payload;
      })
      .addCase(fetchBudgetExpenses.rejected, (state, action) => {
        state.loadingExpenses = false;
        state.error = action.payload ?? "Unable to load expenses";
      });
  },
});

export const { activatePlan, archivePlan, dismissAlert, remindersTriggered, updatePlan } =
  budgetSlice.actions;
export default budgetSlice.reducer;
