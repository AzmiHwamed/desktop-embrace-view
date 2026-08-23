// components/SubscriptionGate.tsx
import { useEffect } from "react";
import { Navigate, useLocation } from "@tanstack/react-router";

import { useAppDispatch, useAppSelector, useTranslations } from "@/app/hooks";
import { hasActiveAccess } from "@/lib/subscription";
import { fetchProfile } from "@/features/account/accountSlice";
import { PageLoading } from "@/components/Loading";
import appShellStrings from "@/locales/en/app-shell.json";

// Routes exempt from the paywall — /subscribe itself (or the redirect
// loops forever). Add auth-adjacent routes (login, verify-email, etc.) if
// you have any — I don't know your route list, so this is a starting point.
const AUTH_EXEMPT_PATHS = ["/login", "/signup", "/forgot-password", "/onboarding"];

export function SubscriptionGate({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();
  const location = useLocation();
  const { profile, profileLoaded } = useAppSelector((s) => s.account);
  const isGuest = useAppSelector((s) => s.auth.isGuest);
  const isAuthExempt = AUTH_EXEMPT_PATHS.some((p) =>
    location.pathname.startsWith(p),
  );
  const isSubscribePage = location.pathname.startsWith("/subscribe");
  const t = useTranslations("app-shell", appShellStrings);

  // This gate sits above the whole route tree, so it can't assume
  // AccountPage has mounted and already triggered the fetch — it needs its
  // own trigger, guarded so it only fires once.
  useEffect(() => {
    if (!isGuest && !isAuthExempt && !profileLoaded) {
      dispatch(fetchProfile());
    }
  }, [dispatch, isGuest, isAuthExempt, profileLoaded]);

  // Auth and onboarding pages must render without touching protected profile
  // endpoints. Otherwise a missing session causes another 401 while the login
  // page itself is mounting, resulting in a redirect/error-boundary loop.
  if (isAuthExempt || isGuest) {
    return <>{children}</>;
  }

  // Don't decide anything until the profile has actually settled — avoids
  // a flash of "redirecting" for a split second on every load before the
  // fetch resolves.
  if (!profileLoaded) {
    return <PageLoading label={t.loadingAccount} description={t.checkingAccess} />;
  }

  if (!isSubscribePage && !hasActiveAccess(profile)) {
    return <Navigate to="/subscribe" />;
  }

  return <>{children}</>;
}
