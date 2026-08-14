// pages/NotificationsPage.tsx
import { useEffect } from "react";
import { CheckCheck, ExternalLink, ShieldCheck, TrendingUp, Wallet } from "lucide-react";

import { PageHeader } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { useAppDispatch, useAppSelector, useTranslations } from "@/app/hooks";
import { interpolate } from "@/lib/i18n";
import { isRtlLanguage } from "@/lib/rtl";
import notificationsStrings from "@/locales/en/notifications.json";

import {
  fetchNotifications,
  markAllRead,
  markRead,
} from "@/features/notifications/notificationsSlice";

const icons = {
  success: CheckCheck,
  brand: TrendingUp,
  warning: Wallet,
  muted: ShieldCheck,
} as const;

const tones = {
  success: "bg-success/15 text-success",
  brand: "bg-primary/15 text-primary",
  warning: "bg-warning/20 text-warning-foreground",
  muted: "bg-muted text-muted-foreground",
} as const;

export function NotificationsPage() {
  const dispatch = useAppDispatch();
  const t = useTranslations("notifications", notificationsStrings);

  const {
    items,
    notificationsLoaded,
    markAllPending,
    error,
  } = useAppSelector((state) => state.notifications);
  const profile = useAppSelector((s) => s.account.profile);

  const isRtl = isRtlLanguage(profile?.language?.code);

  useEffect(() => {
    dispatch(fetchNotifications());
  }, [dispatch]);

  const unreadCount = items.filter((n) => n.unread).length;

  // True until the notifications fetch has settled (fulfilled OR rejected)
  // at least once — mirrors Convert/Dashboard's isPageLoading gate.
  const isPageLoading = !notificationsLoaded;

  if (isPageLoading) {
    return <NotificationsSkeleton dir={isRtl ? "rtl" : "ltr"} />;
  }

  return (
    <div className="space-y-6 lg:space-y-8" dir={isRtl ? "rtl" : "ltr"}>
      <PageHeader
        title={t.title}
        subtitle={interpolate(unreadCount === 1 ? t.subtitle : t.subtitle_plural, {
          count: unreadCount,
        })}
        actions={
          <Button
            variant="outline"
            className="rounded-xl"
            disabled={unreadCount === 0 || markAllPending}
            onClick={() => dispatch(markAllRead())}
          >
            <CheckCheck className="h-4 w-4" />
            {t.markAllRead}
          </Button>
        }
      />

      <ul className="surface-card divide-y divide-border overflow-hidden">
        {items.length === 0 && (
          <li className="px-5 py-6 text-sm text-muted-foreground">
            {t.allCaughtUp}
          </li>
        )}

        {items.map((n) => {
          const Icon = icons[n.tone];
          return (
            <li
              key={n.id}
              role={n.unread ? "button" : undefined}
              onClick={() => n.unread && dispatch(markRead(n.id))}
              className={cn(
                "grid grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-4 px-5 py-4",
                n.unread && "bg-accent/40 cursor-pointer",
              )}
            >
              <span className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-xl", tones[n.tone])}>
                <Icon className="h-4 w-4" />
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold">{n.title}</span>
                <span className="block text-sm text-muted-foreground">{n.body}</span>
                {n.data?.type === "nearby-place" && n.data.googleMapsUri && (
                  <a
                    href={n.data.googleMapsUri}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(event) => event.stopPropagation()}
                    className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
                  >
                    {t.openDirections}
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                )}
              </span>
              <span className="shrink-0 text-xs text-muted-foreground">{n.time}</span>
            </li>
          );
        })}
      </ul>

      {error && (
        <p className="rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

function NotificationsSkeleton({ dir }: { dir: "rtl" | "ltr" }) {
  // Purely visual placeholders — no translatable text, so only `dir` is
  // threaded through, same reasoning as ConvertSkeleton/DashboardSkeleton.
  return (
    <div className="space-y-6 lg:space-y-8" aria-busy="true" aria-label="Loading notifications" dir={dir}>
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-6 w-40 animate-pulse rounded-md bg-muted" />
          <div className="h-4 w-32 animate-pulse rounded-md bg-muted" />
        </div>
        <div className="h-10 w-32 animate-pulse rounded-xl bg-muted" />
      </div>

      <div className="surface-card divide-y divide-border overflow-hidden">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-4 px-5 py-4">
            <div className="h-10 w-10 shrink-0 animate-pulse rounded-xl bg-muted" />
            <div className="min-w-0 space-y-2">
              <div className="h-4 w-40 animate-pulse rounded-md bg-muted" />
              <div className="h-3 w-56 animate-pulse rounded-md bg-muted" />
            </div>
            <div className="h-3 w-10 animate-pulse rounded-md bg-muted" />
          </div>
        ))}
      </div>
    </div>
  );
}
