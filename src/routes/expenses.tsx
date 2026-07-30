import { createFileRoute } from "@tanstack/react-router";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { CreditCard, PiggyBank, Receipt, TrendingUp } from "lucide-react";

import { PageHeader } from "@/components/AppLayout";
import { StatCard } from "@/components/StatCard";
import { Progress } from "@/components/ui/progress";
import { spendByCategory, transactions } from "@/lib/travel-data";

export const Route = createFileRoute("/expenses")({
  head: () => ({
    meta: [
      { title: "Expenses · SmartTravel" },
      {
        name: "description",
        content: "Break down travel spending by category, city and budget with visual reports.",
      },
      { property: "og:title", content: "Expenses · SmartTravel" },
      {
        property: "og:description",
        content: "Travel spending broken down by category, city and budget.",
      },
    ],
  }),
  component: ExpensesPage,
});

const total = spendByCategory.reduce((s, c) => s + c.value, 0);

function ExpensesPage() {
  return (
    <div className="space-y-6 lg:space-y-8">
      <PageHeader title="Expenses" subtitle="Japan trip · 03 – 18 July 2026" />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total spent" value="€4,219" hint="Across 38 receipts" icon={Receipt} tone="brand" />
        <StatCard label="Daily average" value="€281" hint="Budget €360/day" icon={TrendingUp} />
        <StatCard label="Card spend" value="€3,104" hint="74% of total" icon={CreditCard} />
        <StatCard label="Saved on FX" value="€128" hint="vs bank rates" icon={PiggyBank} />
      </section>

      <section className="grid gap-4 lg:grid-cols-[1fr_1.2fr] lg:gap-6">
        <div className="surface-card p-5">
          <h2 className="font-display text-lg font-bold">By category</h2>
          <p className="text-sm text-muted-foreground">Share of total trip spend</p>
          <div className="mt-4 h-[240px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={spendByCategory}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={65}
                  outerRadius={95}
                  paddingAngle={3}
                  stroke="none"
                >
                  {spendByCategory.map((c) => (
                    <Cell key={c.name} fill={c.color} />
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
            {spendByCategory.map((c) => (
              <li key={c.name} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
                <span className="flex min-w-0 items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: c.color }}
                  />
                  <span className="truncate text-sm">{c.name}</span>
                </span>
                <span className="shrink-0 text-sm font-semibold">
                  €{c.value.toFixed(2)}{" "}
                  <span className="text-xs text-muted-foreground">
                    ({Math.round((c.value / total) * 100)}%)
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-4 lg:space-y-6">
          <div className="surface-card p-5">
            <h2 className="font-display text-lg font-bold">Budgets</h2>
            <ul className="mt-4 space-y-5">
              {[
                { name: "Accommodation", used: 1420, cap: 1800 },
                { name: "Food & drink", used: 960, cap: 1200 },
                { name: "Transport", used: 720, cap: 900 },
                { name: "Shopping", used: 610, cap: 700 },
              ].map((b) => (
                <li key={b.name}>
                  <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 text-sm">
                    <span className="truncate font-medium">{b.name}</span>
                    <span className="shrink-0 text-muted-foreground">
                      €{b.used} / €{b.cap}
                    </span>
                  </div>
                  <Progress value={(b.used / b.cap) * 100} className="mt-2" />
                </li>
              ))}
            </ul>
          </div>

          <div className="surface-card overflow-hidden">
            <h2 className="p-5 font-display text-lg font-bold">Largest expenses</h2>
            <ul className="divide-y divide-border border-t border-border">
              {[...transactions]
                .sort((a, b) => b.converted - a.converted)
                .slice(0, 4)
                .map((t) => (
                  <li
                    key={t.id}
                    className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-5 py-4"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold">{t.merchant}</span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {t.category} · {t.date}
                      </span>
                    </span>
                    <span className="shrink-0 text-sm font-bold">€{t.converted.toFixed(2)}</span>
                  </li>
                ))}
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
