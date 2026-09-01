// pages/Dashboard.tsx
import { useEffect } from "react";
import { Link } from "@tanstack/react-router";
import {
  ArrowLeftRight,
  CalendarDays,
  Layers,
  Receipt,
  RefreshCw,
  ScanLine,
  TrendingUp,
  WalletCards,
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
import { Progress } from "@/components/ui/progress";
import { useAppDispatch, useAppSelector, useHasMounted, useTranslations } from "@/app/hooks";
import {
  fetchDashboardData,
  fetchPopularRates,
  fetchSpendingTrend,
  setRange,
} from "@/features/dashboard/dashboardSlice";
import type { DashboardRange } from "@/features/dashboard/types";
import { interpolate } from "@/lib/i18n";
import { isRtlLanguage } from "@/lib/rtl";
import dashboardStrings from "@/locales/en/dashboard.json";
import { MerchantLink } from "@/components/MerchantLink";
import { useTranslatedBudgetNames } from "@/features/budgets/useTranslatedBudgetNames";

export function Dashboard() {
  const dispatch = useAppDispatch();
  const {
    range,
    spentThisPeriod,
    countThisPeriod,
    byCategory,
    trend,
    recent,
    popularRates,
    loading,
    trendLoading,
    popularRatesLoading,
    dataLoaded,
    trendLoaded,
    error,
    popularRatesError,
  } = useAppSelector((s) => s.dashboard);
  const profile = useAppSelector((s) => s.account.profile);
  const activeBudget = useAppSelector((s) =>
    s.budgets.plans.find((plan) => plan.id === s.budgets.activePlanId),
  );
  const budgetExpenses = useAppSelector((s) => s.budgets.expenses);
  const translatedBudgetNames = useTranslatedBudgetNames(activeBudget ? [activeBudget] : []);
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

  useEffect(() => {
    if (profile?.currencyId) {
      dispatch(fetchPopularRates());
    }
  }, [dispatch, profile?.currencyId]);

  const hasMounted = useHasMounted();
  const currencyCode = hasMounted ? (profile?.currency?.code ?? "") : "";
  // Always "there" on server AND on the client's first paint — only swaps
  // to the real name after mount, once hydration has already succeeded.
  const displayName = hasMounted ? (profile?.displayName?.split(" ")[0] ?? "there") : "there";

  const topCategory = byCategory[0] ?? null;
  const avgPerExpense = countThisPeriod > 0 ? spentThisPeriod / countThisPeriod : 0;
  const categoryTotal = byCategory.reduce((sum, c) => sum + c.total, 0);
  const budgetSpent = budgetExpenses.reduce(
    (sum, expense) => sum + Number(expense.convertedAmount ?? expense.amount ?? 0),
    0,
  );
  const budgetPercent =
    activeBudget && activeBudget.totalAmount > 0
      ? (budgetSpent / activeBudget.totalAmount) * 100
      : 0;
  const budgetRemaining = activeBudget ? Math.max(0, activeBudget.totalAmount - budgetSpent) : 0;
  const tripDaysRemaining = activeBudget
    ? Math.max(
        0,
        Math.ceil((new Date(`${activeBudget.endDate}T23:59:59`).getTime() - Date.now()) / 86400000),
      )
    : 0;

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

      {activeBudget ? (
        <section className="surface-card overflow-hidden border-primary/15 bg-gradient-to-r from-primary/[0.08] to-card p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
                <WalletCards className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-primary">{t.activeTrip}</p>
                <h2 className="truncate font-display text-xl font-bold">
                  {translatedBudgetNames[activeBudget.id] ?? activeBudget.name}
                </h2>
                <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <CalendarDays className="h-3.5 w-3.5" />
                  {activeBudget.startDate} - {activeBudget.endDate}
                </p>
              </div>
            </div>
            <Button asChild variant="outline" className="rounded-xl">
              <Link to="/budgets">{t.viewBudget}</Link>
            </Button>
          </div>
          <div className="mt-5 flex items-end justify-between gap-4 text-sm">
            <span>
              {interpolate(t.budgetSpentOf, {
                spent: `${activeBudget.currencyCode} ${budgetSpent.toFixed(2)}`,
                total: `${activeBudget.currencyCode} ${activeBudget.totalAmount.toFixed(2)}`,
              })}
            </span>
            <strong>{Math.round(budgetPercent)}%</strong>
          </div>
          <Progress value={Math.min(100, budgetPercent)} className="mt-2 h-2.5" />
          <div className="mt-5 grid gap-3 border-t pt-5 sm:grid-cols-3">
            <div>
              <p className="text-xs text-muted-foreground">{t.tripRemaining}</p>
              <p className="mt-1 font-bold">
                {activeBudget.currencyCode} {budgetRemaining.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t.tripDaysLeft}</p>
              <p className="mt-1 font-bold">{tripDaysRemaining}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t.tripCategoryPlans}</p>
              <p className="mt-1 font-bold">{activeBudget.categoryLimits.length}</p>
            </div>
          </div>
        </section>
      ) : (
        <section className="surface-card flex flex-wrap items-center justify-between gap-4 border-dashed p-5 sm:p-6">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-primary/10 text-primary">
              <WalletCards className="h-5 w-5" />
            </span>
            <div>
              <h2 className="font-display font-bold">{t.noActiveTrip}</h2>
              <p className="text-sm text-muted-foreground">{t.noActiveTripHint}</p>
            </div>
          </div>
          <Button asChild className="rounded-xl">
            <Link to="/budgets">{t.planTrip}</Link>
          </Button>
        </section>
      )}

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
          hint={
            countThisPeriod > 0
              ? interpolate(t.acrossExpenses, { count: countThisPeriod })
              : undefined
          }
          icon={ScanLine}
        />
        <StatCard
          label={t.topCategory}
          value={topCategory?.categoryName ?? "—"}
          hint={topCategory ? `${currencyCode} ${topCategory.total.toFixed(2)}` : t.noExpensesYet}
          icon={Layers}
        />
      </section>

      <section className="surface-card p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-lg font-bold">{t.popularRates}</h2>
            <p className="text-sm text-muted-foreground">
              {interpolate(t.popularRatesSubtitle, { currency: currencyCode || t.yourCurrency })}
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-xl"
            disabled={popularRatesLoading || !profile?.currencyId}
            onClick={() => void dispatch(fetchPopularRates())}
          >
            <RefreshCw className={`h-4 w-4${popularRatesLoading ? " animate-spin" : ""}`} />
            {t.refreshRates}
          </Button>
        </div>

        {popularRatesLoading && popularRates.length === 0 ? (
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-24 animate-pulse rounded-2xl bg-muted" />
            ))}
          </div>
        ) : popularRatesError && popularRates.length === 0 ? (
          <p className="mt-5 text-sm text-destructive">{t.popularRatesError}</p>
        ) : popularRates.length === 0 ? (
          <p className="mt-5 text-sm text-muted-foreground">{t.noPopularRates}</p>
        ) : (
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {popularRates.map((item) => {
              const isPositive = item.changePercent > 0;
              const isNegative = item.changePercent < 0;
              return (
                <article key={item.currencyId} className="rounded-2xl border bg-card p-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className="grid h-10 min-w-10 place-items-center rounded-xl bg-primary/10 px-2 font-bold text-primary">
                      {item.badgeText}
                    </span>
                    <span
                      className={`text-xs font-semibold ${
                        isPositive
                          ? "text-emerald-600 dark:text-emerald-400"
                          : isNegative
                            ? "text-destructive"
                            : "text-muted-foreground"
                      }`}
                    >
                      {item.changePercent > 0 ? "+" : ""}
                      {item.changePercent.toFixed(2)}%
                    </span>
                  </div>
                  <p className="mt-3 text-sm font-semibold">{item.currencyCode}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{item.conversionText}</p>
                </article>
              );
            })}
          </div>
        )}
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
                  <CartesianGrid
                    strokeDasharray="4 4"
                    stroke="var(--color-border)"
                    vertical={false}
                  />
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
                    <MerchantLink expense={e} fallback={e.category?.name ?? t.expense} />
                  </span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {e.category?.name ?? t.uncategorized} · {new Date(e.date).toLocaleDateString()}
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
    <div
      className="space-y-6 lg:space-y-8"
      aria-busy="true"
      aria-label="Loading dashboard"
      dir={dir}
    >
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
