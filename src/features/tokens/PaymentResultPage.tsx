import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { CheckCircle2, CircleAlert, Loader2 } from "lucide-react";

import { useAppDispatch, useAppSelector, useTranslations } from "@/app/hooks";
import { Button } from "@/components/ui/button";
import { fetchProfile } from "@/features/account/accountSlice";
import { verifyTokenPayment } from "@/features/tokens/tokenPackageSlice";
import { isRtlLanguage } from "@/lib/rtl";
import tokenStrings from "@/locales/en/tokens.json";

type PaymentState = "checking" | "succeeded" | "failed" | "pending" | "invalid";

export function PaymentResultPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const profile = useAppSelector((s) => s.account.profile);
  const t = useTranslations("tokens", tokenStrings);
  const paymentId = typeof window === "undefined"
    ? null
    : new URLSearchParams(window.location.search).get("paymentId");
  const resultStorageKey = paymentId ? `payment-result-viewed:${paymentId}` : null;
  const [alreadyViewed] = useState(() =>
    Boolean(resultStorageKey && typeof window !== "undefined" && localStorage.getItem(resultStorageKey)),
  );
  const [state, setState] = useState<PaymentState>(paymentId ? "checking" : "invalid");
  const attempts = useRef(0);

  useEffect(() => {
    if (!paymentId || alreadyViewed) return;
    let cancelled = false;
    let timer: number | undefined;

    const check = async () => {
      try {
        const payment = await dispatch(verifyTokenPayment(paymentId)).unwrap();
        if (cancelled) return;
        if (payment.status === "succeeded") {
          await dispatch(fetchProfile());
          if (!cancelled) setState("succeeded");
          return;
        }
        if (payment.status === "failed") {
          setState("failed");
          return;
        }
        attempts.current += 1;
        if (attempts.current >= 20) {
          setState("pending");
          return;
        }
      } catch {
        attempts.current += 1;
        if (attempts.current >= 20) {
          setState("pending");
          return;
        }
      }
      timer = window.setTimeout(check, 3000);
    };

    void check();
    return () => {
      cancelled = true;
      if (timer) window.clearTimeout(timer);
    };
  }, [dispatch, paymentId, alreadyViewed]);

  // A result link is a one-time confirmation view. Using replace prevents the
  // browser Back button from reopening it after the customer returns home.
  useEffect(() => {
    if (alreadyViewed) {
      navigate({ to: "/", replace: true });
    }
  }, [alreadyViewed, navigate]);

  useEffect(() => {
    if (!resultStorageKey || state === "checking" || state === "pending") return;
    localStorage.setItem(resultStorageKey, "1");
  }, [resultStorageKey, state]);

  if (alreadyViewed) return null;

  const content = {
    checking: { title: t.confirmingTitle, text: t.confirmingText, icon: Loader2, iconClass: "animate-spin text-primary" },
    succeeded: { title: t.paymentSuccessTitle, text: t.paymentSuccessText, icon: CheckCircle2, iconClass: "text-emerald-600" },
    failed: { title: t.paymentIncompleteTitle, text: t.paymentIncompleteText, icon: CircleAlert, iconClass: "text-destructive" },
    pending: { title: t.paymentPendingTitle, text: t.paymentPendingText, icon: Loader2, iconClass: "text-amber-600" },
    invalid: { title: t.paymentReferenceMissingTitle, text: t.paymentReferenceMissingText, icon: CircleAlert, iconClass: "text-destructive" },
  }[state];
  const Icon = content.icon;

  return (
    <main className="grid min-h-screen place-items-center bg-background px-4" dir={isRtlLanguage(profile?.language?.code) ? "rtl" : "ltr"}>
      <section className="surface-card w-full max-w-md p-8 text-center">
        <Icon className={`mx-auto h-12 w-12 ${content.iconClass}`} />
        <h1 className="mt-5 font-display text-2xl font-bold">{content.title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{content.text}</p>
        {state !== "checking" && (
          <Button asChild className="mt-6 rounded-xl">
            <Link to="/">{t.backHome}</Link>
          </Button>
        )}
      </section>
    </main>
  );
}
