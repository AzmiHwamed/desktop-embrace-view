// components/TopNav.tsx
import { Link, useNavigate } from "@tanstack/react-router";
import { Bell, LogOut, Plus, Search, ScanLine, Clock } from "lucide-react";

import { useAppDispatch, useAppSelector, useTranslations } from "@/app/hooks";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { logout } from "@/features/auth/authSlice";
import { useEffect } from "react";
import { fetchProfile } from "@/features/account/accountSlice";
import { interpolate } from "@/lib/i18n";
import { isRtlLanguage } from "@/lib/rtl";
import { getEffectiveSubscriptionStatus, getSubscriptionDisplay } from "@/lib/subscription";
import subscriptionStatusStrings from "@/locales/en/subscriptionStatus.json";
import topNavStrings from "@/locales/en/topnav.json";

export function TopNav({ isAuthenticated = false }: { isAuthenticated?: boolean }) {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const statusT = useTranslations("subscriptionStatus", subscriptionStatusStrings);
  const t = useTranslations("topnav", topNavStrings);
  const isGuest = useAppSelector((s) => s.auth.isGuest);

  useEffect(() => {
    if (!isGuest) dispatch(fetchProfile());
  }, [dispatch, isGuest]);
  const {
    profile,
  } = useAppSelector((s) => s.account);

  const isRtl = isRtlLanguage(profile?.language?.code);

  const handleSignOut = () => {
    dispatch(logout());
    navigate({ to: "/login", replace: true });
  };

  const { statusLabel, hint } = getSubscriptionDisplay(profile, statusT, interpolate);
  const effectiveStatus = getEffectiveSubscriptionStatus(profile);

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-background/85 backdrop-blur">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 sm:gap-4 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <SidebarTrigger className="shrink-0" />
          <div className="relative hidden min-w-0 flex-1 md:block lg:max-w-md">
            <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t.searchPlaceholder}
              className="h-10 rounded-xl border-border bg-muted/60 ps-9"
            />
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {profile && (
            <Link
              to="/subscribe"
              className={
                "hidden items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-xs font-semibold sm:flex " +
                (effectiveStatus === "expired"
                  ? "border-destructive/30 bg-destructive/10 text-destructive"
                  : effectiveStatus === "cancelled"
                    ? "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300"
                  : "border-border bg-muted/60 text-muted-foreground")
              }
              title={hint}
            >
              <Clock className="h-3.5 w-3.5 shrink-0" />
              <span className="whitespace-nowrap">
                {statusLabel}
                {hint && <span className="hidden font-normal lg:inline"> · {hint}</span>}
              </span>
            </Link>
          )}

          <Button asChild variant="ghost" size="icon" className="rounded-xl md:hidden">
            <Link to="/scan" aria-label={t.scanReceipt}>
              <ScanLine className="h-4 w-4" />
            </Link>
          </Button>
          <Button asChild className="bg-brand hidden rounded-xl shadow-brand md:inline-flex">
            <Link to="/scan">
              <Plus className="h-4 w-4" />
              {t.newScan}
            </Link>
          </Button>
          <Button asChild variant="ghost" size="icon" className="relative rounded-xl">
            <Link to="/notifications" aria-label={t.notifications}>
              <Bell className="h-4 w-4" />
              {/* Unread-dot position: right-2/top-2 is a physical corner
                  pinned to the bell icon's own box, not the page edge, so it
                  doesn't need an isRtl swap — the icon and its dot move
                  together as one unit regardless of where the button sits
                  in the (already-mirroring) flex row. */}
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-destructive" />
            </Link>
          </Button>

          {isAuthenticated && !isGuest ? (
            <>
              <Link to="/account" className="flex min-w-0 items-center gap-2 rounded-xl px-1 py-1">
                <Avatar className="h-9 w-9 shrink-0">
                  {profile?.photoURL ? (
                    <img src={profile?.photoURL ?? ""} alt="User avatar" />
                  ) : (
                    <AvatarFallback className="bg-accent text-accent-foreground text-xs font-bold">
                      AL
                    </AvatarFallback>
                  )}
                </Avatar>
                <span className="hidden min-w-0 lg:block">
                  <span className="block truncate text-sm font-semibold leading-tight">
                    {profile?.displayName}
                  </span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {profile?.currentCountry?.name ?? t.unknown} · {profile?.currency?.code ?? t.unknown}
                  </span>
                </span>
              </Link>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-xl"
                aria-label={t.signOut}
                onClick={handleSignOut}
              >
                <LogOut className={"h-4 w-4" + (isRtl ? " scale-x-[-1]" : "")} />
              </Button>
            </>
          ) : (
            <Button asChild variant="outline" className="rounded-xl">
              <Link to="/login">{t.signIn}</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
