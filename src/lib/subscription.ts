// lib/subscription.ts

import { Profile } from "@/features/account/types";

// Single source of truth for "is this user allowed past the paywall".
// Checks status AND the relevant end date client-side, rather than trusting
// `subscriptionStatus` alone — the backend value can lag behind reality by
// up to one billing-cron cycle, so a profile fetched right at the boundary
// could still say "active"/"trial" a moment after it should have flipped.
export function hasActiveAccess(profile: Profile | null): boolean {
  if (!profile) return false;

  const now = Date.now();

  switch (profile.subscriptionStatus) {
    case "trial":
      return profile.trialEndsAt ? new Date(profile.trialEndsAt).getTime() > now : true;

    // Canceled still grants access through the period already paid for —
    // same convention as "accessUntil" on the account page — so it only
    // actually blocks once subscriptionEndsAt has passed, same check as active.
    case "active":
    case "canceled":
      return profile.subscriptionEndsAt ? new Date(profile.subscriptionEndsAt).getTime() > now : true;

    case "expired":
    default:
      return false;
  }
}

export type SubscriptionStatusStrings = {
  active: string;
  trial: string;
  expired: string;
  canceled: string;
  renewsOn: string;
  trialEndsOn: string;
  expiredOn: string;
  accessUntil: string;
  noEndDate: string;
};

// Same logic that was inline in AccountPage before — pulled out here so
// both AccountPage and the new SubscriptionPage render identical copy from
// one shared translation namespace instead of two copies drifting apart.
export function getSubscriptionDisplay(
  profile: Profile | null,
  t: SubscriptionStatusStrings,
  interpolate: (template: string | undefined, vars?: Record<string, string | number>) => string,
): { statusLabel: string; hint: string } {
  if (!profile) return { statusLabel: "—", hint: "" };

  const format = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString() : null);

  switch (profile.subscriptionStatus) {
    case "active": {
      const date = format(profile.subscriptionEndsAt);
      return { statusLabel: t.active, hint: date ? interpolate(t.renewsOn, { date }) : t.noEndDate };
    }
    case "trial": {
      const date = format(profile.trialEndsAt);
      return { statusLabel: t.trial, hint: date ? interpolate(t.trialEndsOn, { date }) : t.noEndDate };
    }
    case "expired": {
      const date = format(profile.subscriptionEndsAt);
      return { statusLabel: t.expired, hint: date ? interpolate(t.expiredOn, { date }) : t.noEndDate };
    }
    case "canceled": {
      const date = format(profile.subscriptionEndsAt);
      return { statusLabel: t.canceled, hint: date ? interpolate(t.accessUntil, { date }) : t.noEndDate };
    }
    default:
      return { statusLabel: "—", hint: "" };
  }
}