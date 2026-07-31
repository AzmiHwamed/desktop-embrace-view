import { useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";

import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { AppSidebar } from "@/components/AppSidebar";
import { TopNav } from "@/components/TopNav";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { restoreSession } from "@/features/auth/authSlice";

export function AppLayout({ children }: { children: ReactNode }) {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const isAuthenticated = useAppSelector((s) => Boolean(s.auth.token));
  const [sessionChecked, setSessionChecked] = useState(false);

  useEffect(() => {
    dispatch(restoreSession());
    setSessionChecked(true);
  }, [dispatch]);

  useEffect(() => {
    if (sessionChecked && !isAuthenticated && pathname !== "/login") {
      navigate({ to: "/login", replace: true });
    }
  }, [sessionChecked, isAuthenticated, pathname, navigate]);

  if (pathname === "/login") {
    return <>{children}</>;
  }


  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
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
