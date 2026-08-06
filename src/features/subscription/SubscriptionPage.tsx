// pages/SubscriptionPage.tsx
import { useEffect, useState } from "react";
import { Check, Clock, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAppDispatch, useAppSelector, useTranslations } from "@/app/hooks";
import { interpolate } from "@/lib/i18n";
import { isRtlLanguage } from "@/lib/rtl";
import { getSubscriptionDisplay } from "@/lib/subscription";
import subscriptionStrings from "@/locales/en/subscription.json";
import subscriptionStatusStrings from "@/locales/en/subscriptionStatus.json";
import { fetchPlans, checkoutPlan } from "@/features/subscription/subscriptionSlice";

export function SubscriptionPage() {
  const dispatch = useAppDispatch();
  const t = useTranslations("subscription", subscriptionStrings);
  const statusT = useTranslations("subscriptionStatus", subscriptionStatusStrings);

  const { plans, plansLoaded, checkingOut, error } = useAppSelector((s) => s.subscription);
  const profile = useAppSelector((s) => s.account.profile);
  const [popupError, setPopupError] = useState<string | null>(null);

  const isRtl = isRtlLanguage(profile?.language?.code);

  useEffect(() => {
    dispatch(fetchPlans());
  }, [dispatch]);

  const { statusLabel, hint } = getSubscriptionDisplay(profile, statusT, interpolate);

  async function handleSubscribe(planId: string) {
    setPopupError(null);

    const width = 520;
    const height = 720;
    const left = Math.max(0, window.screenX + (window.outerWidth - width) / 2);
    const top = Math.max(0, window.screenY + (window.outerHeight - height) / 2);
    const checkoutWindow = window.open(
      "about:blank",
      "smarttravel-checkout",
      `popup=yes,width=${width},height=${height},left=${Math.round(left)},top=${Math.round(top)},resizable=yes,scrollbars=yes`,
    );

    if (!checkoutWindow) {
      setPopupError(t.popupBlocked);
      return;
    }

    checkoutWindow.document.title = t.checkoutWindowTitle;

    try {
      const { checkoutUrl } = await dispatch(checkoutPlan(planId)).unwrap();
      const url = new URL(checkoutUrl);

      if (url.protocol !== "https:" && url.protocol !== "http:") {
        throw new Error(t.invalidCheckoutUrl);
      }

      if (checkoutWindow.closed) {
        setPopupError(t.checkoutWindowClosed);
        return;
      }

      checkoutWindow.opener = null;
      checkoutWindow.location.replace(url.href);
      checkoutWindow.focus();
    } catch (checkoutError) {
      checkoutWindow.close();
      setPopupError(
        checkoutError instanceof Error ? checkoutError.message : t.checkoutFailed,
      );
    }
  }

  if (!plansLoaded) {
    return <SubscriptionSkeleton dir={isRtl ? "rtl" : "ltr"} />;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-10 lg:space-y-8" dir={isRtl ? "rtl" : "ltr"}>
      <div className="text-center">
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-accent text-accent-foreground">
          <Clock className="h-6 w-6" />
        </span>
        <h1 className="mt-4 font-display text-2xl font-bold">{t.title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t.subtitle}</p>

        <div className="mx-auto mt-4 inline-flex items-center gap-2 rounded-full bg-muted px-4 py-1.5 text-sm">
          <span className="font-semibold">{statusLabel}</span>
          {hint && <span className="text-muted-foreground">· {hint}</span>}
        </div>
      </div>

      {(error || popupError) && (
        <p className="rounded-xl bg-destructive/10 px-3 py-2 text-center text-sm text-destructive">
          {popupError ?? error}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        {plans.map((plan) => (
          <div key={plan.id} className="surface-card rounded-xl border p-4">
            <h3 className="font-display font-bold">{plan.name}</h3>
            {plan.description && (
              <p className="mt-1 text-xs text-muted-foreground">{plan.description}</p>
            )}
            <p className="mt-3 text-2xl font-extrabold">
              {plan.price.toFixed(2)}
              <span className="ms-1 text-sm font-medium text-muted-foreground">
                {plan.currency.code} / {plan.durationMonths}mo
              </span>
            </p>
            <Button
              className="mt-4 w-full rounded-xl"
              onClick={() => handleSubscribe(plan.id)}
              disabled={checkingOut !== null}
            >
              {checkingOut === plan.id ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t.redirecting}
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  {t.subscribe}
                </>
              )}
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

function SubscriptionSkeleton({ dir }: { dir: "rtl" | "ltr" }) {
  return (
    <div
      className="mx-auto max-w-3xl space-y-6 px-4 py-10 lg:space-y-8"
      aria-busy="true"
      aria-label="Loading subscription plans"
      dir={dir}
    >
      <div className="space-y-3 text-center">
        <div className="mx-auto h-12 w-12 animate-pulse rounded-2xl bg-muted" />
        <div className="mx-auto h-7 w-48 animate-pulse rounded-md bg-muted" />
        <div className="mx-auto h-4 w-64 animate-pulse rounded-md bg-muted" />
        <div className="mx-auto h-7 w-40 animate-pulse rounded-full bg-muted" />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-3 rounded-xl border p-4">
            <div className="h-4 w-20 animate-pulse rounded-md bg-muted" />
            <div className="h-3 w-28 animate-pulse rounded-md bg-muted" />
            <div className="h-7 w-24 animate-pulse rounded-md bg-muted" />
            <div className="h-9 w-full animate-pulse rounded-xl bg-muted" />
          </div>
        ))}
      </div>
    </div>
  );
}
