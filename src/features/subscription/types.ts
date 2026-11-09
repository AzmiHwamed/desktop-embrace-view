// features/subscription/types.ts
export type TokenPackage = {
  id: string;
  name: string;
  description: string;
  tokenCount: number;
  price: number; // already converted to user's currency
  currency: { id: string; code: string; name: string };
  isActive: boolean;
};

export type SubscriptionState = {
  plans: TokenPackage[];
  plansLoaded: boolean;
  loading: boolean;
  checkingOut: string | null; // planId currently being checked out, or null
  error: string | null;
};
