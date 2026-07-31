import { Bell, CheckCheck, ShieldCheck, TrendingUp, Wallet } from "lucide-react";

import { PageHeader } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { notifications } from "@/lib/travel-data";
import { cn } from "@/lib/utils";


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
  return (
    <div className="space-y-6 lg:space-y-8">
      <PageHeader
        title="Notifications"
        subtitle="2 unread updates"
        actions={
          <Button variant="outline" className="rounded-xl">
            <CheckCheck className="h-4 w-4" />
            Mark all read
          </Button>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr] lg:gap-6">
        <ul className="surface-card divide-y divide-border overflow-hidden">
          {notifications.map((n) => {
            const Icon = icons[n.tone];
            return (
              <li
                key={n.id}
                className={cn(
                  "grid grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-4 px-5 py-4",
                  n.unread && "bg-accent/40",
                )}
              >
                <span className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-xl", tones[n.tone])}>
                  <Icon className="h-4 w-4" />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold">{n.title}</span>
                  <span className="block text-sm text-muted-foreground">{n.body}</span>
                </span>
                <span className="shrink-0 text-xs text-muted-foreground">{n.time}</span>
              </li>
            );
          })}
        </ul>

        <div className="surface-card p-5">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-accent text-accent-foreground">
            <Bell className="h-5 w-5" />
          </span>
          <h2 className="mt-4 font-display text-lg font-bold">Stay in the loop</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Rate alerts fire the moment your target is hit, so you can convert at the best moment of
            the day.
          </p>
          <Button className="bg-brand mt-4 w-full rounded-xl shadow-brand">Create rate alert</Button>
        </div>
      </div>
    </div>
  );
}
