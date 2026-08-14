import { Profile } from "@/features/account/types";

export type EffectiveSubscriptionStatus = "active" | "trial" | "expired" | "cancelled";

function isFuture(iso: string | null): boolean {
  if (!iso) return false;
  const timestamp = new Date(iso).getTime();
  return Number.isFinite(timestamp) && timestamp > Date.now();
}

export function getEffectiveSubscriptionStatus(
  profile: Profile | null,
): EffectiveSubscriptionStatus | null {
  if (!profile) return null;

  switch (profile.subscriptionStatus) {
    case "trial":
      return isFuture(profile.trialEndsAt) ? "trial" : "expired";
    case "active":
      return !profile.subscriptionEndsAt || isFuture(profile.subscriptionEndsAt)
        ? "active"
        : "expired";
    case "cancelled":
    case "canceled":
      return isFuture(profile.subscriptionEndsAt) ? "cancelled" : "expired";
    case "expired":
    default:
      return "expired";
  }
}

export function hasActiveAccess(profile: Profile | null): boolean {
  const status = getEffectiveSubscriptionStatus(profile);
  return status === "active" || status === "trial" || status === "cancelled";
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

export function getSubscriptionDisplay(
  profile: Profile | null,
  t: SubscriptionStatusStrings,
  interpolate: (template: string | undefined, vars?: Record<string, string | number>) => string,
): { statusLabel: string; hint: string } {
  if (!profile) return { statusLabel: "—", hint: "" };

  const format = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString() : null);
  const effectiveStatus = getEffectiveSubscriptionStatus(profile);

  switch (effectiveStatus) {
    case "active": {
      const date = format(profile.subscriptionEndsAt);
      return { statusLabel: t.active, hint: date ? interpolate(t.accessUntil, { date }) : t.noEndDate };
    }
    case "trial": {
      const date = format(profile.trialEndsAt);
      return { statusLabel: t.trial, hint: date ? interpolate(t.trialEndsOn, { date }) : t.noEndDate };
    }
    case "cancelled": {
      const date = format(profile.subscriptionEndsAt);
      return { statusLabel: t.canceled, hint: date ? interpolate(t.accessUntil, { date }) : t.noEndDate };
    }
    case "expired": {
      const expiredAt = profile.subscriptionStatus === "trial"
        ? profile.trialEndsAt
        : profile.subscriptionEndsAt;
      const date = format(expiredAt);
      return { statusLabel: t.expired, hint: date ? interpolate(t.expiredOn, { date }) : t.noEndDate };
    }
    default:
      return { statusLabel: "—", hint: "" };
  }
}
