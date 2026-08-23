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
  destination: string;
  country?: string | null;
  countryId?: string | null;
  notes?: string | null;
  travelers: number;
  interests: string[];
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
  spent?: number;
  aiSummary?: string | null;
  budgetGuidance?: BudgetGuidance | null;
  monuments: TripMonument[];
  itinerary: ItineraryDay[];
};

export type BudgetGuidance = {
  status: "under_budget" | "on_track" | "at_risk" | "over_budget";
  headline: string;
  dailyTarget: number;
  projectedTotal: number;
  tips: string[];
};

export type TripMonument = {
  name: string;
  description: string;
  category: string;
  estimatedCost: number;
  recommendedDurationMinutes: number;
  addressHint?: string;
  bestTime?: string;
  latitude?: number | null;
  longitude?: number | null;
  googlePlaceId?: string | null;
  googleMapsUri?: string | null;
  formattedAddress?: string | null;
  recommendedPlaceName?: string | null;
};

export type ItineraryItem = {
  time: string;
  title: string;
  description: string;
  location: string;
  estimatedCost: number;
  monumentName?: string;
  placeSearchQuery?: string;
  placeType?: string;
  latitude?: number | null;
  longitude?: number | null;
  googlePlaceId?: string | null;
  googleMapsUri?: string | null;
  formattedAddress?: string | null;
  recommendedPlaceName?: string | null;
};

export type ItineraryDay = { day: number; date: string; title: string; items: ItineraryItem[] };

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
  generatingPlan: boolean;
  error: string | null;
  storageOwnerId: string | null;
};

export type BudgetDraft = Omit<
  BudgetPlan,
  | "id"
  | "status"
  | "notifiedThresholds"
  | "lastDailyReminderDate"
  | "createdAt"
  | "updatedAt"
  | "spent"
  | "aiSummary"
  | "budgetGuidance"
  | "monuments"
  | "itinerary"
>;
