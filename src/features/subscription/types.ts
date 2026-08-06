// features/subscription/types.ts
export type Plan = {
  id: string;
  name: string;
  description: string;
  durationMonths: number;
  price: number; // already converted to user's currency
  currency: { id: string; code: string; name: string };
  isActive: boolean;
};

export type SubscriptionState = {
  plans: Plan[];
  plansLoaded: boolean;
  loading: boolean;
  checkingOut: string | null; // planId currently being checked out, or null
  error: string | null;
};