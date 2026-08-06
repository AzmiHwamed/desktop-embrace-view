// pages/Dashboard.tsx
import { useEffect } from "react";
import { Link } from "@tanstack/react-router";
import {
  ArrowLeftRight,
  Layers,
  Receipt,
  ScanLine,
  TrendingUp,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { PageHeader } from "@/components/AppLayout";
import { InlineLoading } from "@/components/Loading";
import { StatCard } from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { useAppDispatch, useAppSelector, useHasMounted, useTranslations } from "@/app/hooks";
import { fetchDashboardData, fetchSpendingTrend, setRange } from "@/features/dashboard/dashboardSlice";
import type { DashboardRange } from "@/features/dashboard/types";
import { interpolate } from "@/lib/i18n";
import { isRtlLanguage } from "@/lib/rtl";
import dashboardStrings from "@/locales/en/dashboard.json";

export function Dashboard() {
  const dispatch = useAppDispatch();
  const {
    range,
    spentThisPeriod,
    countThisPeriod,
    byCategory,
    trend,
    recent,
    loading,
    trendLoading,
    dataLoaded,
    trendLoaded,
    error,
  } = useAppSelector((s) => s.dashboard);
  const profile = useAppSelector((s) => s.account.profile);
  const t = useTranslations("dashboard", dashboardStrings);

  const isRtl = isRtlLanguage(profile?.language?.code);

  const rangeOptions: { value: DashboardRange; label: string }[] = [
    { value: "week", label: t.thisWeek },
    { value: "month", label: t.thisMonth },
  ];

  useEffect(() => {
    dispatch(fetchDashboardData(range));
  }, [dispatch, range]);

  useEffect(() => {
    dispatch(fetchSpendingTrend());
  }, [dispatch]);

  const hasMounted = useHasMounted();
  const currencyCode = hasMounted ? profile?.currency?.code ?? "" : "";
  // Always "there" on server AND on the client's first paint — only swaps
  // to the real name after mount, once hydration has already succeeded.
  const displayName = hasMounted ? profile?.displayName?.split(" ")[0] ?? "there" : "there";

  const topCategory = byCategory[0] ?? null;
  const avgPerExpense = countThisPeriod > 0 ? spentThisPeriod / countThisPeriod : 0;
  const categoryTotal = byCategory.reduce((sum, c) => sum + c.total, 0);

  // True until both thunks have settled (fulfilled OR rejected) at least once.
  const isPageLoading = !dataLoaded || !trendLoaded;

  if (isPageLoading) {
    return <DashboardSkeleton dir={isRtl ? "rtl" : "ltr"} />;
  }

  return (
    <div className="space-y-6 lg:space-y-8" dir={isRtl ? "rtl" : "ltr"}>
      <PageHeader
        title={interpolate(t.welcomeBack, { name: displayName })}
        subtitle={t.subtitle}
        actions={
          <>
            <Button asChild variant="outline" className="rounded-xl">
              <Link to="/convert">
                {/* Directional icon: reads backwards in RTL, so flip it horizontally rather than relying on `dir` (which only reorders layout, not glyph shape). */}
                <ArrowLeftRight className={"h-4 w-4" + (isRtl ? " scale-x-[-1]" : "")} />
                {t.convert}
              </Link>
            </Button>
            <Button asChild className="bg-brand rounded-xl shadow-brand">
              <Link to="/scan">
                <ScanLine className="h-4 w-4" />
                {t.scanReceipt}
              </Link>
            </Button>
          </>
        }
      />

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex gap-2">
        {rangeOptions.map((opt) => (
          <button
            key={opt.value}
            onClick={() => dispatch(setRange(opt.value))}
            className={
              "rounded-full px-4 py-1.5 text-sm font-semibold transition-colors " +
              (range === opt.value
                ? "bg-brand text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80")
            }
          >
            {opt.label}
          </button>
        ))}
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label={range === "week" ? t.spentThisWeek : t.spentThisMonth}
          value={`${currencyCode} ${spentThisPeriod.toFixed(2)}`}
          hint={loading ? t.loading : undefined}
          icon={TrendingUp}
          tone="brand"
        />
        <StatCard
          label={t.expensesLogged}
          value={String(countThisPeriod)}
          hint={range === "week" ? t.thisWeek : t.thisMonth}
          icon={Receipt}
        />
        <StatCard
          label={t.avgPerExpense}
          value={`${currencyCode} ${avgPerExpense.toFixed(2)}`}
          hint={countThisPeriod > 0 ? interpolate(t.acrossExpenses, { count: countThisPeriod }) : undefined}
          icon={ScanLine}
        />
        <StatCard
          label={t.topCategory}
          value={topCategory?.categoryName ?? "—"}
          hint={topCategory ? `${currencyCode} ${topCategory.total.toFixed(2)}` : t.noExpensesYet}
          icon={Layers}
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-3 xl:gap-6">
        <div className="surface-card p-5 xl:col-span-2">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
            <div className="min-w-0">
              <h2 className="truncate font-display text-lg font-bold">{t.spendingTrend}</h2>
              <p className="text-sm text-muted-foreground">
                {interpolate(t.last30Days, { currency: currencyCode || t.yourCurrency })}
              </p>
            </div>
          </div>
          <div className="mt-6 h-[240px] w-full lg:h-[280px]">
            {trendLoading ? (
              <div className="grid h-full place-items-center">
                <InlineLoading label={t.loading} />
              </div>
            ) : trend.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t.noExpensesLast30}</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={trend}
                  margin={{ left: -20, right: 8, top: 8 }}
                  // Recharts renders LTR internally regardless of page `dir`,
                  // so the trend line's chronological order (oldest → newest)
                  // is preserved left-to-right even on an RTL page. Flipping
                  // a time-series chart's reading direction would make it
                  // read newest-to-oldest, which is more confusing than
                  // leaving this one chart LTR.
                  style={{ direction: "ltr" }}
                >
                  <defs>
                    <linearGradient id="spendFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.45} />
                      <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="4 4" stroke="var(--color-border)" vertical={false} />
                  <XAxis
                    dataKey="day"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 12, fill: "var(--color-muted-foreground)" }}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    orientation={isRtl ? "right" : "left"}
                    tick={{ fontSize: 12, fill: "var(--color-muted-foreground)" }}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 12,
                      border: "1px solid var(--color-border)",
                      background: "var(--color-popover)",
                      color: "var(--color-popover-foreground)",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="spend"
                    stroke="var(--color-primary)"
                    strokeWidth={2.5}
                    fill="url(#spendFill)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="surface-card p-5">
          <h2 className="font-display text-lg font-bold">{t.byCategory}</h2>
          <p className="text-sm text-muted-foreground">
            {range === "week" ? t.thisWeek : t.thisMonth}
          </p>
          {byCategory.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">{t.noExpensesPeriod}</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {byCategory.map((c) => {
                const pct = categoryTotal > 0 ? (c.total / categoryTotal) * 100 : 0;
                return (
                  <li key={c.categoryId ?? "uncategorized"}>
                    <div className="flex items-center justify-between gap-2 text-sm">
                      <span className="flex min-w-0 items-center gap-2">
                        <span
                          className="h-2.5 w-2.5 shrink-0 rounded-full"
                          style={{ backgroundColor: c.categoryColor ?? "#94a3b8" }}
                        />
                        <span className="truncate font-medium">
                          {c.categoryName ?? t.uncategorized}
                        </span>
                      </span>
                      <span className="shrink-0 font-semibold">
                        {currencyCode} {c.total.toFixed(2)}
                      </span>
                    </div>
                    <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: c.categoryColor ?? "#94a3b8",
                        }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>

      <section className="surface-card overflow-hidden">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 p-5">
          <div className="min-w-0">
            <h2 className="truncate font-display text-lg font-bold">{t.recentActivity}</h2>
            <p className="text-sm text-muted-foreground">{t.yourLatestExpenses}</p>
          </div>
          <Button asChild variant="ghost" className="shrink-0 rounded-xl">
            <Link to="/history">{t.viewAll}</Link>
          </Button>
        </div>
        <div className="divide-y divide-border border-t border-border">
          {!loading && recent.length === 0 && (
            <p className="p-5 text-sm text-muted-foreground">{t.noExpensesPeriod}</p>
          )}
          {recent.map((e) => (
            <div
              key={e.id}
              className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-5 py-4 transition-colors hover:bg-muted/50"
            >
              <div className="flex min-w-0 items-center gap-3">
                <span
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-xs font-bold text-white"
                  style={{ backgroundColor: e.category?.color ?? "#94a3b8" }}
                >
                  {(e.shop ?? e.category?.name ?? "?").slice(0, 2).toUpperCase()}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold">
                    {e.shop ?? e.category?.name ?? t.expense}
                  </span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {e.category?.name ?? t.uncategorized} ·{" "}
                    {new Date(e.date).toLocaleDateString()}
                  </span>
                </span>
              </div>
              {/* text-end instead of text-right: text-right stays glued to
                  the physical right edge in RTL (wrong side, reads as
                  misaligned); text-end follows `dir` and lands on whichever
                  side is the "end" of the line for the active direction. */}
              <span className="shrink-0 text-end">
                <span className="block text-sm font-bold">
                  {e.convertedAmount !== null
                    ? `${currencyCode} ${e.convertedAmount.toFixed(2)}`
                    : `${e.currency?.code ?? ""} ${Number(e.amount).toFixed(2)}`}
                </span>
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function DashboardSkeleton({ dir }: { dir: "rtl" | "ltr" }) {
  // Purely visual placeholders — no translatable text lives here, so only
  // `dir` is threaded through (keeps the skeleton's layout mirrored to match
  // the real page instead of flashing LTR then flipping to RTL on load).
  return (
    <div className="space-y-6 lg:space-y-8" aria-busy="true" aria-label="Loading dashboard" dir={dir}>
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="h-6 w-56 animate-pulse rounded-md bg-muted" />
          <div className="h-4 w-72 animate-pulse rounded-md bg-muted" />
        </div>
        <div className="flex gap-2">
          <div className="h-9 w-28 animate-pulse rounded-xl bg-muted" />
          <div className="h-9 w-36 animate-pulse rounded-xl bg-muted" />
        </div>
      </div>

      <div className="flex gap-2">
        <div className="h-8 w-24 animate-pulse rounded-full bg-muted" />
        <div className="h-8 w-28 animate-pulse rounded-full bg-muted" />
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="surface-card space-y-3 p-5">
            <div className="h-4 w-24 animate-pulse rounded-md bg-muted" />
            <div className="h-7 w-20 animate-pulse rounded-md bg-muted" />
            <div className="h-3 w-16 animate-pulse rounded-md bg-muted" />
          </div>
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-3 xl:gap-6">
        <div className="surface-card p-5 xl:col-span-2">
          <div className="h-5 w-40 animate-pulse rounded-md bg-muted" />
          <div className="mt-2 h-4 w-32 animate-pulse rounded-md bg-muted" />
          <div className="mt-6 h-[240px] w-full animate-pulse rounded-xl bg-muted lg:h-[280px]" />
        </div>
        <div className="surface-card p-5">
          <div className="h-5 w-28 animate-pulse rounded-md bg-muted" />
          <div className="mt-2 h-4 w-20 animate-pulse rounded-md bg-muted" />
          <ul className="mt-4 space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <li key={i} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="h-3.5 w-24 animate-pulse rounded-md bg-muted" />
                  <div className="h-3.5 w-14 animate-pulse rounded-md bg-muted" />
                </div>
                <div className="h-1.5 w-full animate-pulse rounded-full bg-muted" />
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="surface-card overflow-hidden">
        <div className="flex items-center justify-between gap-4 p-5">
          <div className="space-y-2">
            <div className="h-5 w-32 animate-pulse rounded-md bg-muted" />
            <div className="h-4 w-24 animate-pulse rounded-md bg-muted" />
          </div>
          <div className="h-9 w-20 animate-pulse rounded-xl bg-muted" />
        </div>
        <div className="divide-y divide-border border-t border-border">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between gap-4 px-5 py-4">
              <div className="flex min-w-0 items-center gap-3">
                <div className="h-10 w-10 shrink-0 animate-pulse rounded-xl bg-muted" />
                <div className="space-y-2">
                  <div className="h-4 w-32 animate-pulse rounded-md bg-muted" />
                  <div className="h-3 w-24 animate-pulse rounded-md bg-muted" />
                </div>
              </div>
              <div className="h-4 w-16 shrink-0 animate-pulse rounded-md bg-muted" />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
