// components/AppLayout.tsx
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";

import { useAppDispatch, useAppSelector, useHasMounted, useTranslations } from "@/app/hooks";
import { AppSidebar } from "@/components/AppSidebar";
import { TopNav } from "@/components/TopNav";
import { PageLoading } from "@/components/Loading";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { restoreSession } from "@/features/auth/authSlice";
import { evaluateBudgetReminders, fetchBudgetExpenses, hydrateBudgets } from "@/features/budgets/budgetSlice";
import { isRtlLanguage } from "@/lib/rtl";
import { getStoredLanguage } from "@/lib/language-preference";
import appShellStrings from "@/locales/en/app-shell.json";
import { NearbyGuide } from "@/features/explore/NearbyGuide";
import { CountryLocationMonitor } from "@/features/notifications/CountryLocationMonitor";

export function AppLayout({ children }: { children: ReactNode }) {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const isAuthenticated = useAppSelector((s) => Boolean(s.auth.token));
  const profile = useAppSelector((s) => s.account.profile);
  const budgetsHydrated = useAppSelector((s) => s.budgets.hydrated);
  const activeBudget = useAppSelector((s) => s.budgets.plans.find((plan) => plan.id === s.budgets.activePlanId));
  const [sessionChecked, setSessionChecked] = useState(false);
  const hasMounted = useHasMounted();
  const t = useTranslations("app-shell", appShellStrings);

  const isRtl = isRtlLanguage(profile?.language?.code ?? getStoredLanguage()?.code);

  useEffect(() => {
    dispatch(restoreSession());
    setSessionChecked(true);
  }, [dispatch]);

  const isPublicAuthPage = pathname === "/login" || pathname === "/forgot-password";

  useEffect(() => {
    if (sessionChecked && !isAuthenticated && !isPublicAuthPage) {
      navigate({ to: "/login", replace: true });
    }
  }, [sessionChecked, isAuthenticated, isPublicAuthPage, navigate]);

  useEffect(() => {
    if (isAuthenticated && profile && !budgetsHydrated) dispatch(hydrateBudgets());
  }, [dispatch, isAuthenticated, profile, budgetsHydrated]);

  useEffect(() => {
    if (!activeBudget || activeBudget.status !== "active") return;
    dispatch(fetchBudgetExpenses(activeBudget)).then(() => dispatch(evaluateBudgetReminders()));
  }, [dispatch, activeBudget]);

  if (isPublicAuthPage) {
    return <>{children}</>;
  }

  // The server cannot read localStorage, so rendering the loader during SSR
  // would hard-code its English fallback into the initial HTML. Wait for the
  // first client mount, where the saved language and cached JSON are already
  // available, before showing any authenticated-route loading text.
  if (!hasMounted) {
    return <div className="min-h-screen bg-background" aria-hidden="true" />;
  }

  // Navigation runs in an effect. Do not mount authenticated UI during the
  // render between session restoration and the redirect to /login.
  if (!sessionChecked || !isAuthenticated) {
    return <PageLoading label={t.checkingSession} description={t.signingInSecurely} />;
  }

  // Checkout is a focused, standalone flow. Keep authentication/session
  // handling active, but omit the normal application sidebar and top bar.
  if (pathname.startsWith("/subscribe")) {
    return <div className="min-h-screen bg-background">{children}</div>;
  }

  return (
    <SidebarProvider>
      {/* dir set at the shell level, once, rather than repeated on every
          page — pages still set their own `dir` too (for SSR-safety before
          this profile is available and for standalone rendering), but this
          covers the sidebar/nav chrome that lives outside any single page's
          own root element. */}
      <div className="flex min-h-screen w-full bg-background" dir={isRtl ? "rtl" : "ltr"}>
        <NearbyGuide />
        <CountryLocationMonitor />
        <AppSidebar />
        <SidebarInset className="min-w-0 flex-1 bg-background">
          <TopNav isAuthenticated={isAuthenticated} />
          <main className="mx-auto w-full max-w-[1440px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 sm:flex sm:flex-wrap sm:justify-between">
      <div className="min-w-0">
        <h1 className="truncate font-display text-2xl font-extrabold tracking-tight lg:text-3xl">
          {title}
        </h1>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}
