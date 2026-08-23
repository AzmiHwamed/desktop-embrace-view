import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { apiFetch, type ApiResponse } from "@/lib/api-client";
import type { BudgetAlert, BudgetDraft, BudgetExpense, BudgetPlan, BudgetsState } from "./types";

const initialState: BudgetsState = {
  plans: [],
  activePlanId: null,
  expenses: [],
  alerts: [],
  hydrated: false,
  loadingExpenses: false,
  saving: false,
  generatingPlan: false,
  error: null,
  storageOwnerId: null,
};
type ApiTrip = Partial<BudgetPlan> & {
  id: string;
  name: string;
  destination: string;
  startDate: string;
  endDate: string;
  currencyId: string;
  currencyCode?: string;
  currency?: { code: string };
  totalAmount: number | string;
  status: BudgetPlan["status"];
};

function normalizeTrip(raw: ApiTrip): BudgetPlan {
  return {
    id: raw.id,
    name: raw.name,
    destination: raw.destination || raw.name,
    country: raw.country ?? null,
    countryId: raw.countryId ?? null,
    notes: raw.notes ?? null,
    travelers: raw.travelers ?? 1,
    interests: raw.interests ?? [],
    startDate: raw.startDate,
    endDate: raw.endDate,
    currencyId: raw.currencyId,
    currencyCode: raw.currencyCode ?? raw.currency?.code ?? "",
    totalAmount: Number(raw.totalAmount),
    status: raw.status,
    categoryLimits: raw.categoryLimits ?? [],
    reminders: raw.reminders ?? {
      dailyEnabled: true,
      dailyTime: "20:00",
      threshold80: true,
      threshold100: true,
      browserNotifications: false,
    },
    notifiedThresholds: raw.notifiedThresholds ?? [],
    lastDailyReminderDate: raw.lastDailyReminderDate ?? null,
    createdAt: raw.createdAt ?? new Date().toISOString(),
    updatedAt: raw.updatedAt ?? new Date().toISOString(),
    spent: Number(raw.spent ?? 0),
    aiSummary: raw.aiSummary ?? null,
    budgetGuidance: raw.budgetGuidance ?? null,
    monuments: raw.monuments ?? [],
    itinerary: raw.itinerary ?? [],
  };
}
function tripPayload(draft: BudgetDraft) {
  const { currencyCode: _code, ...payload } = draft;
  void _code;
  return payload;
}

export const hydrateBudgets = createAsyncThunk("budgets/hydrate", async () => {
  const response = await apiFetch<ApiResponse<ApiTrip[]>>("/trips");
  const plans = response.data.map(normalizeTrip);
  return { plans, activePlanId: plans.find((p) => p.status === "active")?.id ?? null };
});
export const saveBudgetPlan = createAsyncThunk<BudgetPlan, BudgetDraft>(
  "budgets/savePlan",
  async (draft) =>
    normalizeTrip(
      (
        await apiFetch<ApiResponse<ApiTrip>>("/trips", {
          method: "POST",
          body: JSON.stringify(tripPayload(draft)),
        })
      ).data,
    ),
);
export const updatePlan = createAsyncThunk<BudgetPlan, { id: string; draft: BudgetDraft }>(
  "budgets/updatePlan",
  async ({ id, draft }) =>
    normalizeTrip(
      (
        await apiFetch<ApiResponse<ApiTrip>>(`/trips/${id}`, {
          method: "PATCH",
          body: JSON.stringify(tripPayload(draft)),
        })
      ).data,
    ),
);
export const activatePlan = createAsyncThunk<BudgetPlan, string>(
  "budgets/activatePlan",
  async (id) =>
    normalizeTrip(
      (await apiFetch<ApiResponse<ApiTrip>>(`/trips/${id}/activate`, { method: "POST" })).data,
    ),
);
export const archivePlan = createAsyncThunk<BudgetPlan, string>("budgets/archivePlan", async (id) =>
  normalizeTrip((await apiFetch<ApiResponse<ApiTrip>>(`/trips/${id}`, { method: "DELETE" })).data),
);
export const generateTripPlan = createAsyncThunk<BudgetPlan, string>(
  "budgets/generateTripPlan",
  async (id) =>
    normalizeTrip(
      (await apiFetch<ApiResponse<ApiTrip>>(`/trips/${id}/generate-plan`, { method: "POST" })).data,
    ),
);
export const fetchBudgetExpenses = createAsyncThunk<BudgetExpense[], BudgetPlan>(
  "budgets/fetchExpenses",
  async (plan) => (await apiFetch<ApiResponse<BudgetExpense[]>>(`/trips/${plan.id}/expenses`)).data,
);
export const evaluateBudgetReminders = createAsyncThunk(
  "budgets/evaluateReminders",
  async () => undefined,
);

const slice = createSlice({
  name: "budgets",
  initialState,
  reducers: {
    dismissAlert(state, action: PayloadAction<string>) {
      state.alerts = state.alerts.filter((a) => a.id !== action.payload);
    },
    remindersTriggered(state, action: PayloadAction<BudgetAlert[]>) {
      state.alerts.unshift(...action.payload);
    },
  },
  extraReducers(builder) {
    builder
      .addCase(hydrateBudgets.fulfilled, (s, a) => {
        s.plans = a.payload.plans;
        s.activePlanId = a.payload.activePlanId;
        s.hydrated = true;
      })
      .addCase(hydrateBudgets.rejected, (s, a) => {
        s.hydrated = true;
        s.error = a.error.message ?? "Unable to load trips";
      })
      .addCase(saveBudgetPlan.pending, (s) => {
        s.saving = true;
        s.error = null;
      })
      .addCase(saveBudgetPlan.fulfilled, (s, a) => {
        s.saving = false;
        s.plans.forEach((p) => {
          if (p.status === "active") p.status = "completed";
        });
        s.plans.unshift(a.payload);
        s.activePlanId = a.payload.id;
      })
      .addCase(saveBudgetPlan.rejected, (s, a) => {
        s.saving = false;
        s.error = a.error.message ?? "Unable to save trip";
      })
      .addCase(updatePlan.fulfilled, replacePlan)
      .addCase(activatePlan.fulfilled, (s, a) => {
        s.plans.forEach((p) => {
          if (p.status === "active") p.status = "completed";
        });
        replacePlan(s, a);
        s.activePlanId = a.payload.id;
      })
      .addCase(archivePlan.fulfilled, (s, a) => {
        replacePlan(s, a);
        if (s.activePlanId === a.payload.id) s.activePlanId = null;
      })
      .addCase(generateTripPlan.pending, (s) => {
        s.generatingPlan = true;
        s.error = null;
      })
      .addCase(generateTripPlan.fulfilled, (s, a) => {
        s.generatingPlan = false;
        replacePlan(s, a);
      })
      .addCase(generateTripPlan.rejected, (s, a) => {
        s.generatingPlan = false;
        s.error = a.error.message ?? "Unable to generate trip plan";
      })
      .addCase(fetchBudgetExpenses.pending, (s) => {
        s.loadingExpenses = true;
      })
      .addCase(fetchBudgetExpenses.fulfilled, (s, a) => {
        s.loadingExpenses = false;
        s.expenses = a.payload;
      })
      .addCase(fetchBudgetExpenses.rejected, (s, a) => {
        s.loadingExpenses = false;
        s.error = a.error.message ?? "Unable to load trip expenses";
      });
  },
});

function replacePlan(state: BudgetsState, action: PayloadAction<BudgetPlan>) {
  const index = state.plans.findIndex((p) => p.id === action.payload.id);
  if (index >= 0) state.plans[index] = action.payload;
}
export const { dismissAlert, remindersTriggered } = slice.actions;
export default slice.reducer;
