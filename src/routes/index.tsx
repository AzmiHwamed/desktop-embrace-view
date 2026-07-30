import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeftRight,
  ArrowUpRight,
  ArrowDownRight,
  PieChart as PieIcon,
  ScanLine,
  Wallet,
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
import { StatCard } from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { rates, spendTrend, transactions } from "@/lib/travel-data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard · SmartTravel" },
      {
        name: "description",
        content:
          "Your travel wallet at a glance: balance, live FX rates, weekly spend and recent scanned receipts.",
      },
      { property: "og:title", content: "Dashboard · SmartTravel" },
      {
        property: "og:description",
        content: "Balance, live FX rates, weekly spend and recent scanned receipts.",
      },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  return (
    <div className="space-y-6 lg:space-y-8">
      <PageHeader
        title="Welcome back, Alex"
        subtitle="Here's how your Japan trip is tracking this week."
        actions={
          <>
            <Button asChild variant="outline" className="rounded-xl">
              <Link to="/convert">
                <ArrowLeftRight className="h-4 w-4" />
                Convert
              </Link>
            </Button>
            <Button asChild className="bg-brand rounded-xl shadow-brand">
              <Link to="/scan">
                <ScanLine className="h-4 w-4" />
                Scan receipt
              </Link>
            </Button>
          </>
        }
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Wallet balance"
          value="€3,518.20"
          hint="≈ ¥595,350 available"
          icon={Wallet}
          tone="brand"
        />
        <StatCard label="Spent this week" value="€824.60" hint="+12% vs last week" icon={TrendingUp} />
        <StatCard label="Receipts scanned" value="38" hint="7 translated today" icon={ScanLine} />
        <StatCard label="Trip budget left" value="€1,181" hint="22% of €5,400" icon={PieIcon} />
      </section>

      <section className="grid gap-4 xl:grid-cols-3 xl:gap-6">
        <div className="surface-card p-5 xl:col-span-2">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
            <div className="min-w-0">
              <h2 className="truncate font-display text-lg font-bold">Spending trend</h2>
              <p className="text-sm text-muted-foreground">Last 7 days, converted to EUR</p>
            </div>
            <span className="shrink-0 rounded-lg bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground">
              Weekly
            </span>
          </div>
          <div className="mt-6 h-[240px] w-full lg:h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={spendTrend} margin={{ left: -20, right: 8, top: 8 }}>
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
          </div>
        </div>

        <div className="surface-card p-5">
          <h2 className="font-display text-lg font-bold">Live rates</h2>
          <p className="text-sm text-muted-foreground">Updated 2 minutes ago</p>
          <ul className="mt-4 space-y-3">
            {rates.map((r) => (
              <li
                key={r.pair}
                className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-xl bg-muted/60 px-4 py-3"
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold">{r.pair}</span>
                  <span className="block text-xs text-muted-foreground">Mid-market</span>
                </span>
                <span className="shrink-0 text-right">
                  <span className="block text-sm font-bold">{r.rate}</span>
                  <span
                    className={`flex items-center justify-end gap-1 text-xs font-medium ${
                      r.up ? "text-success" : "text-destructive"
                    }`}
                  >
                    {r.up ? (
                      <ArrowUpRight className="h-3 w-3" />
                    ) : (
                      <ArrowDownRight className="h-3 w-3" />
                    )}
                    {r.change}
                  </span>
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-5 rounded-xl border border-border p-4">
            <div className="flex items-center justify-between text-sm font-semibold">
              <span>Japan budget</span>
              <span>78%</span>
            </div>
            <Progress value={78} className="mt-3" />
            <p className="mt-2 text-xs text-muted-foreground">€4,219 of €5,400 used</p>
          </div>
        </div>
      </section>

      <section className="surface-card overflow-hidden">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 p-5">
          <div className="min-w-0">
            <h2 className="truncate font-display text-lg font-bold">Recent activity</h2>
            <p className="text-sm text-muted-foreground">Scanned and converted receipts</p>
          </div>
          <Button asChild variant="ghost" className="shrink-0 rounded-xl">
            <Link to="/history">View all</Link>
          </Button>
        </div>
        <div className="divide-y divide-border border-t border-border">
          {transactions.slice(0, 5).map((t) => (
            <div
              key={t.id}
              className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-5 py-4 transition-colors hover:bg-muted/50"
            >
              <div className="flex min-w-0 items-center gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent text-xs font-bold text-accent-foreground">
                  {t.merchant.slice(0, 2).toUpperCase()}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold">{t.merchant}</span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {t.category} · {t.city} · {t.date}
                  </span>
                </span>
              </div>
              <span className="shrink-0 text-right">
                <span className="block text-sm font-bold">€{t.converted.toFixed(2)}</span>
                <span className="block text-xs text-muted-foreground">
                  {t.amount.toLocaleString()} {t.currency}
                </span>
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
