import { createFileRoute } from "@tanstack/react-router";
import { ArrowLeftRight, Star } from "lucide-react";

import { PageHeader } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { currencies, rates } from "@/lib/travel-data";

export const Route = createFileRoute("/convert")({
  head: () => ({
    meta: [
      { title: "Convert currency · SmartTravel" },
      {
        name: "description",
        content: "Convert between 42 currencies with live mid-market rates and saved pairs.",
      },
      { property: "og:title", content: "Convert currency · SmartTravel" },
      {
        property: "og:description",
        content: "Live mid-market currency conversion with saved pairs.",
      },
    ],
  }),
  component: ConvertPage,
});

function ConvertPage() {
  return (
    <div className="space-y-6 lg:space-y-8">
      <PageHeader
        title="Convert currency"
        subtitle="Live mid-market rates, no hidden markup."
      />

      <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr] lg:gap-6">
        <div className="surface-card p-5 lg:p-8">
          <div className="grid gap-4 md:grid-cols-[1fr_auto_1fr] md:items-end">
            <div className="space-y-2">
              <Label htmlFor="from-amount">You send</Label>
              <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2">
                <Input
                  id="from-amount"
                  defaultValue="250.00"
                  className="h-14 rounded-xl text-lg font-bold"
                />
                <Select defaultValue="EUR">
                  <SelectTrigger className="h-14 w-[110px] rounded-xl font-semibold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {currencies.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button
              variant="outline"
              size="icon"
              aria-label="Swap currencies"
              className="mx-auto h-12 w-12 shrink-0 rounded-full"
            >
              <ArrowLeftRight className="h-4 w-4" />
            </Button>

            <div className="space-y-2">
              <Label htmlFor="to-amount">They receive</Label>
              <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2">
                <Input
                  id="to-amount"
                  readOnly
                  defaultValue="42,310"
                  className="h-14 rounded-xl bg-muted/60 text-lg font-bold"
                />
                <Select defaultValue="JPY">
                  <SelectTrigger className="h-14 w-[110px] rounded-xl font-semibold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {currencies.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <dl className="mt-6 grid gap-3 rounded-xl bg-muted/60 p-4 sm:grid-cols-3">
            {[
              ["Rate", "1 EUR = 169.24 JPY"],
              ["Fee", "€0.00"],
              ["Arrives", "Instantly"],
            ].map(([k, v]) => (
              <div key={k} className="min-w-0">
                <dt className="text-xs uppercase tracking-wide text-muted-foreground">{k}</dt>
                <dd className="truncate text-sm font-semibold">{v}</dd>
              </div>
            ))}
          </dl>

          <Button className="bg-brand mt-6 h-12 w-full rounded-xl text-base shadow-brand">
            Convert €250.00
          </Button>
        </div>

        <div className="surface-card p-5">
          <h2 className="font-display text-lg font-bold">Saved pairs</h2>
          <p className="text-sm text-muted-foreground">Quick access to your usual conversions</p>
          <ul className="mt-4 space-y-3">
            {rates.map((r) => (
              <li
                key={r.pair}
                className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-xl border border-border px-4 py-3"
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold">{r.pair}</span>
                  <span className="block text-xs text-muted-foreground">Mid-market · live</span>
                </span>
                <span className="flex shrink-0 items-center gap-2">
                  <span className="text-sm font-bold">{r.rate}</span>
                  <Star className="h-4 w-4 text-primary" />
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
