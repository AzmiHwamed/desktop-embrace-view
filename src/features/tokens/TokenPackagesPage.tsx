import { LegalLinks } from "@/features/legal/LegalPage";
import { ErrorText } from "@/components/ErrorText";
// Token wallet purchase page.
import { useEffect, useState } from "react";
import { Check, Coins, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAppDispatch, useAppSelector, useTranslations } from "@/app/hooks";
import { isRtlLanguage } from "@/lib/rtl";
import {
  checkoutTokenPackage,
  fetchTokenPackages,
} from "@/features/tokens/tokenPackageSlice";
import tokenStrings from "@/locales/en/tokens.json";
import { interpolate } from "@/lib/i18n";

export function TokenPackagesPage() {
  const dispatch = useAppDispatch();

  const { plans, plansLoaded, checkingOut, error } = useAppSelector((s) => s.tokens);
  const profile = useAppSelector((s) => s.account.profile);
  const t = useTranslations("tokens", tokenStrings);
  const [popupError, setPopupError] = useState<string | null>(null);

  const isRtl = isRtlLanguage(profile?.language?.code);

  useEffect(() => {
    dispatch(fetchTokenPackages());
  }, [dispatch]);

  async function handlePurchase(planId: string) {
    setPopupError(null);

    try {
      const { paymentId, checkoutUrl } = await dispatch(checkoutTokenPackage(planId)).unwrap();
      const url = new URL(checkoutUrl);

      if (url.protocol !== "https:" && url.protocol !== "http:") {
        throw new Error(t.invalidCheckoutUrl);
      }

      // Navigate in the same tab. Moyasar returns the customer to the
      // configured /payment-result page, which verifies the payment server-side.
      window.location.assign(url.href);
    } catch (checkoutError) {
      setPopupError(
        checkoutError instanceof Error ? checkoutError.message : t.paymentFailed,
      );
    }
  }

  if (!plansLoaded) {
    return <TokenPackagesSkeleton dir={isRtl ? "rtl" : "ltr"} label={t.loading} />;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-10 lg:space-y-8" dir={isRtl ? "rtl" : "ltr"}>
      <LegalLinks />
      <div className="text-center">
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-accent text-accent-foreground">
          <Coins className="h-6 w-6" />
        </span>
        <h1 className="mt-4 font-display text-2xl font-bold">{t.title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t.subtitle}</p>

        <div className="mx-auto mt-4 inline-flex items-center gap-2 rounded-full bg-muted px-4 py-1.5 text-sm">
          <span className="font-semibold">{interpolate(t.available, { count: profile?.tokenBalance ?? 0 })}</span>
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
            <p className="mt-1 text-sm font-semibold text-primary">{interpolate(t.tokens, { count: plan.tokenCount })}</p>
            <Button
              className="mt-4 w-full rounded-xl"
              onClick={() => handlePurchase(plan.id)}
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
                  {t.buy}
                </>
              )}
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

function TokenPackagesSkeleton({ dir, label }: { dir: "rtl" | "ltr"; label: string }) {
  return (
    <div
      className="mx-auto max-w-3xl space-y-6 px-4 py-10 lg:space-y-8"
      aria-busy="true"
      aria-label={label}
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
