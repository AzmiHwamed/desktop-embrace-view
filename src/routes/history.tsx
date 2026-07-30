import { createFileRoute } from "@tanstack/react-router";
import { Search, SlidersHorizontal, Download } from "lucide-react";

import { PageHeader } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { transactions } from "@/lib/travel-data";

export const Route = createFileRoute("/history")({
  head: () => ({
    meta: [
      { title: "History · SmartTravel" },
      {
        name: "description",
        content: "Search, filter and export every scanned receipt and currency conversion.",
      },
      { property: "og:title", content: "History · SmartTravel" },
      {
        property: "og:description",
        content: "Search, filter and export every scanned receipt and conversion.",
      },
    ],
  }),
  component: HistoryPage,
});

function HistoryPage() {
  return (
    <div className="space-y-6 lg:space-y-8">
      <PageHeader
        title="History"
        subtitle="Every scan, translation and conversion in one searchable ledger."
        actions={
          <Button variant="outline" className="rounded-xl">
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        }
      />

      <div className="surface-card grid gap-3 p-4 md:grid-cols-[minmax(0,1fr)_auto_auto_auto] md:items-center">
        <div className="relative min-w-0">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search merchant or city" className="h-10 rounded-xl pl-9" />
        </div>
        <Select defaultValue="all">
          <SelectTrigger className="h-10 rounded-xl md:w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            <SelectItem value="food">Food</SelectItem>
            <SelectItem value="transport">Transport</SelectItem>
            <SelectItem value="stay">Stay</SelectItem>
          </SelectContent>
        </Select>
        <Select defaultValue="7">
          <SelectTrigger className="h-10 rounded-xl md:w-[150px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="ghost" className="rounded-xl">
          <SlidersHorizontal className="h-4 w-4" />
          More filters
        </Button>
      </div>

      <div className="surface-card overflow-hidden">
        <div className="hidden grid-cols-[2fr_1fr_1fr_1fr_auto] gap-4 border-b border-border bg-muted/50 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground lg:grid">
          <span>Merchant</span>
          <span>Category</span>
          <span>City</span>
          <span>Date</span>
          <span className="text-right">Amount</span>
        </div>
        <ul className="divide-y divide-border">
          {transactions.map((t) => (
            <li
              key={t.id}
              className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-5 py-4 transition-colors hover:bg-muted/50 lg:grid-cols-[2fr_1fr_1fr_1fr_auto]"
            >
              <div className="flex min-w-0 items-center gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent text-xs font-bold text-accent-foreground">
                  {t.merchant.slice(0, 2).toUpperCase()}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold">{t.merchant}</span>
                  <span className="block truncate text-xs text-muted-foreground lg:hidden">
                    {t.category} · {t.city} · {t.date}
                  </span>
                </span>
              </div>
              <span className="hidden lg:block">
                <Badge variant="secondary" className="rounded-lg">
                  {t.category}
                </Badge>
              </span>
              <span className="hidden truncate text-sm text-muted-foreground lg:block">{t.city}</span>
              <span className="hidden truncate text-sm text-muted-foreground lg:block">{t.date}</span>
              <span className="shrink-0 text-right">
                <span className="block text-sm font-bold">€{t.converted.toFixed(2)}</span>
                <span className="block text-xs text-muted-foreground">
                  {t.amount.toLocaleString()} {t.currency}
                </span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
