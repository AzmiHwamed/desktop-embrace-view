// Token balance is enforced for each AI request by the server. This component
// only makes sure the authenticated profile is available to the app shell.
import { useEffect } from "react";
import { useLocation } from "@tanstack/react-router";

import { useAppDispatch, useAppSelector, useTranslations } from "@/app/hooks";
import { fetchProfile } from "@/features/account/accountSlice";
import { PageLoading } from "@/components/Loading";
import appShellStrings from "@/locales/en/app-shell.json";

// Auth-adjacent routes must render without loading a protected profile.
const AUTH_EXEMPT_PATHS = ["/login", "/signup", "/forgot-password", "/onboarding", "/terms", "/privacy"];

export function ProfileGate({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();
  const location = useLocation();
  const { profile, profileLoaded } = useAppSelector((s) => s.account);
  const isGuest = useAppSelector((s) => s.auth.isGuest);
  const isAuthExempt = AUTH_EXEMPT_PATHS.some((p) =>
    location.pathname.startsWith(p),
  );
  const t = useTranslations("app-shell", appShellStrings);

  // This profile loader sits above the whole route tree, so it can't assume
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

  // Wait for the account fetch so shared token-balance UI does not flash a
  // stale value during app startup.
  if (!profileLoaded) {
    return <PageLoading label={t.loadingAccount} description={t.checkingAccess} />;
  }

  // Normal app access never expires; AI requests are authorized by the
  // server-side token wallet.
  return <>{children}</>;
}
