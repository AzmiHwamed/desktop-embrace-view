// pages/ExpensesPage.tsx
import { useEffect, useState } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { Pencil, Receipt, TrendingUp, Wallet } from "lucide-react";

import { PageHeader } from "@/components/AppLayout";
import { StatCard } from "@/components/StatCard";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAppDispatch, useAppSelector, useTranslations } from "@/app/hooks";
import { interpolate } from "@/lib/i18n";
import { isRtlLanguage } from "@/lib/rtl";
import expensesStrings from "@/locales/en/expenses.json";
import { fetchExpensesOverview, setBudget, setExpenseRange } from "@/features/expenses/expensesSlice";
import type { ExpenseRange } from "@/features/expenses/types";

export function ExpensesPage() {
  const dispatch = useAppDispatch();
  const t = useTranslations("expenses", expensesStrings);
  const { range, total, count, byCategory, largest, budget, loading, error, dataLoaded } = useAppSelector(
    (s) => s.expenses,
  );
  const profile = useAppSelector((s) => s.account.profile);

  const isRtl = isRtlLanguage(profile?.language?.code);

  const rangeOptions: { value: ExpenseRange; label: string }[] = [
    { value: "week", label: t.thisWeek },
    { value: "month", label: t.thisMonth },
    { value: "trip", label: t.allTime },
  ];

  const [editingBudget, setEditingBudget] = useState(false);
  const [budgetDraft, setBudgetDraft] = useState(String(budget));

  useEffect(() => {
    dispatch(fetchExpensesOverview(range));
  }, [dispatch, range]);

  const currencyCode = profile?.currency?.code ?? "";
  const dailyAverage = count > 0 && range !== "trip" ? total / (range === "week" ? 7 : 30) : null;
  const budgetPct = budget > 0 ? Math.min((total / budget) * 100, 100) : 0;

  function saveBudget() {
    const value = Number(budgetDraft);
    if (!Number.isNaN(value) && value > 0) {
      dispatch(setBudget(value));
    }
    setEditingBudget(false);
  }

  // True until the overview fetch has settled (fulfilled OR rejected) at
  // least once — mirrors the isPageLoading gate on Dashboard/Convert/History.
  const isPageLoading = !dataLoaded;

  if (isPageLoading) {
    return <ExpensesSkeleton dir={isRtl ? "rtl" : "ltr"} />;
  }

  return (
    <div className="space-y-6 lg:space-y-8" dir={isRtl ? "rtl" : "ltr"}>
      <PageHeader title={t.title} subtitle={t.subtitle} />

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex gap-2">
        {rangeOptions.map((opt) => (
          <button
            key={opt.value}
            onClick={() => dispatch(setExpenseRange(opt.value))}
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

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-2">
        <StatCard
          label={t.totalSpent}
          value={`${currencyCode} ${total.toFixed(2)}`}
          hint={loading ? t.loading : interpolate(count === 1 ? t.acrossExpense : t.acrossExpenses, { count })}
          icon={Receipt}
          tone="brand"
        />
        <StatCard
          label={t.dailyAverage}
          value={dailyAverage !== null ? `${currencyCode} ${dailyAverage.toFixed(2)}` : "—"}
          hint={
            dailyAverage !== null
              ? interpolate(t.budgetPerDay, {
                  amount: `${currencyCode} ${(budget / (range === "week" ? 7 : 30)).toFixed(0)}`,
                })
              : t.selectTimeRange
          }
          icon={TrendingUp}
        />
        {/* <StatCard
          label="Budget remaining"
          value={`${currencyCode} ${Math.max(budget - total, 0).toFixed(2)}`}
          hint={`${Math.round(budgetPct)}% used`}
          icon={Wallet}
        /> */}
      </section>

      <section className="grid gap-4 lg:grid-cols-[1fr_1.2fr] lg:gap-6">
        <div className="surface-card p-5">
          <h2 className="font-display text-lg font-bold">{t.byCategory}</h2>
          <p className="text-sm text-muted-foreground">{t.shareOfSpend}</p>

          {byCategory.length === 0 ? (
            <p className="mt-6 text-sm text-muted-foreground">{t.noExpensesPeriod}</p>
          ) : (
            <>
              <div className="mt-4 h-[240px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={byCategory}
                      dataKey="total"
                      nameKey="categoryName"
                      innerRadius={65}
                      outerRadius={95}
                      paddingAngle={3}
                      stroke="none"
                    >
                      {byCategory.map((c) => (
                        <Cell key={c.categoryId ?? "uncategorized"} fill={c.categoryColor ?? "#94a3b8"} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        borderRadius: 12,
                        border: "1px solid var(--color-border)",
                        background: "var(--color-popover)",
                        color: "var(--color-popover-foreground)",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <ul className="mt-2 space-y-3">
                {byCategory.map((c) => (
                  <li
                    key={c.categoryId ?? "uncategorized"}
                    className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3"
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: c.categoryColor ?? "#94a3b8" }}
                      />
                      <span className="truncate text-sm">{c.categoryName ?? t.uncategorized}</span>
                    </span>
                    <span className="shrink-0 text-sm font-semibold">
                      {currencyCode} {c.total.toFixed(2)}{" "}
                      <span className="text-xs text-muted-foreground">
                        ({total > 0 ? Math.round((c.total / total) * 100) : 0}%)
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>

        <div className="space-y-4 lg:space-y-6">
          {/* <div className="surface-card p-5">
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-display text-lg font-bold">Budget</h2>
              {!editingBudget && (
                <Button variant="ghost" size="icon" className="rounded-xl" onClick={() => {
                  setBudgetDraft(String(budget));
                  setEditingBudget(true);
                }}>
                  <Pencil className="h-4 w-4" />
                </Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Set by you — not synced from any trip plan yet.
            </p>

            {editingBudget ? (
              <div className="mt-4 flex gap-2">
                <Input
                  type="number"
                  value={budgetDraft}
                  onChange={(e) => setBudgetDraft(e.target.value)}
                  className="h-10 rounded-xl"
                  min={0}
                />
                <Button className="rounded-xl" onClick={saveBudget}>
                  Save
                </Button>
              </div>
            ) : (
              <div className="mt-4">
                <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 text-sm">
                  <span className="truncate font-medium">Overall</span>
                  <span className="shrink-0 text-muted-foreground">
                    {currencyCode} {total.toFixed(2)} / {currencyCode} {budget.toFixed(2)}
                  </span>
                </div>
                <Progress value={budgetPct} className="mt-2" />
              </div>
            )}
          </div> */}

          <div className="surface-card overflow-hidden">
            <h2 className="p-5 font-display text-lg font-bold">{t.largestExpenses}</h2>
            {largest.length === 0 ? (
              <p className="px-5 pb-5 text-sm text-muted-foreground">{t.noExpensesYet}</p>
            ) : (
              <ul className="divide-y divide-border border-t border-border">
                {largest.map((e) => (
                  <li
                    key={e.id}
                    className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-5 py-4"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold">
                        {e.shop ?? e.category?.name ?? t.expense}
                      </span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {e.category?.name ?? t.uncategorized} ·{" "}
                        {new Date(e.date).toLocaleDateString()}
                      </span>
                    </span>
                    <span className="shrink-0 text-sm font-bold">
                      {e.convertedAmount !== null
                        ? `${currencyCode} ${e.convertedAmount.toFixed(2)}`
                        : `${e.currency?.code ?? ""} ${Number(e.amount).toFixed(2)}`}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

function ExpensesSkeleton({ dir }: { dir: "rtl" | "ltr" }) {
  return (
    <div className="space-y-6 lg:space-y-8" aria-busy="true" aria-label="Loading expenses" dir={dir}>
      <div className="space-y-2">
        <div className="h-6 w-32 animate-pulse rounded-md bg-muted" />
        <div className="h-4 w-56 animate-pulse rounded-md bg-muted" />
      </div>

      <div className="flex gap-2">
        <div className="h-8 w-24 animate-pulse rounded-full bg-muted" />
        <div className="h-8 w-28 animate-pulse rounded-full bg-muted" />
        <div className="h-8 w-24 animate-pulse rounded-full bg-muted" />
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="surface-card space-y-3 p-5">
            <div className="h-4 w-24 animate-pulse rounded-md bg-muted" />
            <div className="h-7 w-28 animate-pulse rounded-md bg-muted" />
            <div className="h-3 w-32 animate-pulse rounded-md bg-muted" />
          </div>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-[1fr_1.2fr] lg:gap-6">
        <div className="surface-card p-5">
          <div className="h-5 w-28 animate-pulse rounded-md bg-muted" />
          <div className="mt-2 h-4 w-36 animate-pulse rounded-md bg-muted" />
          <div className="mx-auto mt-4 h-[240px] w-[240px] animate-pulse rounded-full bg-muted" />
          <ul className="mt-4 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <li key={i} className="flex items-center justify-between">
                <div className="h-3.5 w-24 animate-pulse rounded-md bg-muted" />
                <div className="h-3.5 w-16 animate-pulse rounded-md bg-muted" />
              </li>
            ))}
          </ul>
        </div>

        <div className="surface-card overflow-hidden">
          <div className="p-5">
            <div className="h-5 w-40 animate-pulse rounded-md bg-muted" />
          </div>
          <ul className="divide-y divide-border border-t border-border">
            {Array.from({ length: 5 }).map((_, i) => (
              <li key={i} className="flex items-center justify-between gap-4 px-5 py-4">
                <div className="space-y-2">
                  <div className="h-4 w-32 animate-pulse rounded-md bg-muted" />
                  <div className="h-3 w-24 animate-pulse rounded-md bg-muted" />
                </div>
                <div className="h-4 w-16 shrink-0 animate-pulse rounded-md bg-muted" />
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
