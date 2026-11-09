import { LegalLinks } from "@/features/legal/LegalPage";
import { ErrorText } from "@/components/ErrorText";
// pages/SubscriptionPage.tsx
import { useEffect, useState } from "react";
import { Check, Coins, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAppDispatch, useAppSelector, useTranslations } from "@/app/hooks";
import { isRtlLanguage } from "@/lib/rtl";
import { fetchPlans, checkoutPlan, verifyPayment } from "@/features/subscription/subscriptionSlice";
import { fetchProfile } from "@/features/account/accountSlice";

export function SubscriptionPage() {
  const dispatch = useAppDispatch();

  const { plans, plansLoaded, checkingOut, error } = useAppSelector((s) => s.subscription);
  const profile = useAppSelector((s) => s.account.profile);
  const [popupError, setPopupError] = useState<string | null>(null);

  const isRtl = isRtlLanguage(profile?.language?.code);

  useEffect(() => {
    dispatch(fetchPlans());
  }, [dispatch]);

  const pageTitle = "Token deals & wallet recharge";
  const pageSubtitle = "Buy tokens once and spend them only when you use an AI feature.";

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
      setPopupError("Your browser blocked the checkout window. Please allow pop-ups and try again.");
      return;
    }

    checkoutWindow.document.title = "Token checkout";

    try {
      const { paymentId, checkoutUrl } = await dispatch(checkoutPlan(planId)).unwrap();
      const url = new URL(checkoutUrl);

      if (url.protocol !== "https:" && url.protocol !== "http:") {
        throw new Error("The payment provider returned an invalid checkout URL.");
      }

      if (checkoutWindow.closed) {
        setPopupError("The checkout window was closed before payment could begin.");
        return;
      }

      checkoutWindow.opener = null;
      checkoutWindow.location.replace(url.href);
      checkoutWindow.focus();

      // Provider webhooks cannot reach a localhost backend and closing a
      // cross-origin popup sends no completion event. Reconcile directly with
      // the provider until payment succeeds/fails, including shortly after the
      // user closes the checkout window.
      const startedAt = Date.now();
      const timeoutMs = 5 * 60 * 1000;
      let checksAfterClose = 0;
      const reconcile = window.setInterval(async () => {
        const popupClosed = checkoutWindow.closed;
        if (popupClosed) checksAfterClose += 1;

        try {
          const payment = await dispatch(verifyPayment(paymentId)).unwrap();
          if (payment.status === "succeeded") {
            window.clearInterval(reconcile);
            await dispatch(fetchProfile());
            return;
          }
          if (payment.status === "failed") {
            window.clearInterval(reconcile);
            setPopupError("Payment could not be completed. Please try again.");
            return;
          }
        } catch (error) {
          // A temporary verification error should not lose a completed payment;
          // continue polling until the bounded timeout below.
        }

        if (Date.now() - startedAt >= timeoutMs || checksAfterClose >= 10) {
          window.clearInterval(reconcile);
          await dispatch(fetchProfile());
        }
      }, 3000);
    } catch (checkoutError) {
      checkoutWindow.close();
      setPopupError(
        checkoutError instanceof Error ? checkoutError.message : "Payment could not be completed. Please try again.",
      );
    }
  }

  if (!plansLoaded) {
    return <SubscriptionSkeleton dir={isRtl ? "rtl" : "ltr"} />;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-10 lg:space-y-8" dir={isRtl ? "rtl" : "ltr"}>
      <LegalLinks />
      <div className="text-center">
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-accent text-accent-foreground">
          <Coins className="h-6 w-6" />
        </span>
        <h1 className="mt-4 font-display text-2xl font-bold">{pageTitle}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{pageSubtitle}</p>

        <div className="mx-auto mt-4 inline-flex items-center gap-2 rounded-full bg-muted px-4 py-1.5 text-sm">
          <span className="font-semibold">{profile?.tokenBalance ?? 0} tokens available</span>
        </div>
      </div>

      {(error || popupError) && (
        <p className="rounded-xl bg-destructive/10 px-3 py-2 text-center text-sm text-destructive">
          <ErrorText message={popupError ?? error} />
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
                {plan.currency.code}
              </span>
            </p>
            <p className="mt-1 text-sm font-semibold text-primary">{plan.tokenCount} tokens</p>
            <Button
              className="mt-4 w-full rounded-xl"
              onClick={() => handleSubscribe(plan.id)}
              disabled={checkingOut !== null}
            >
              {checkingOut === plan.id ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Redirecting…
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  Buy tokens
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
