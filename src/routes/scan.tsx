import { createFileRoute } from "@tanstack/react-router";
import { Check, Languages, ScanLine, Upload, FileText } from "lucide-react";

import { PageHeader } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/scan")({
  head: () => ({
    meta: [
      { title: "Scan & translate · SmartTravel" },
      {
        name: "description",
        content: "Scan a foreign receipt or menu and get an instant translation with converted prices.",
      },
      { property: "og:title", content: "Scan & translate · SmartTravel" },
      {
        property: "og:description",
        content: "Instant receipt and menu translation with converted prices.",
      },
    ],
  }),
  component: ScanPage,
});

const lines = [
  { original: "醤油ラーメン", translated: "Soy sauce ramen", local: "¥1,200", eur: "€7.09" },
  { original: "餃子 (6個)", translated: "Gyoza (6 pcs)", local: "¥620", eur: "€3.66" },
  { original: "生ビール", translated: "Draft beer", local: "¥780", eur: "€4.61" },
  { original: "サービス料", translated: "Service charge", local: "¥800", eur: "€4.73" },
];

function ScanPage() {
  return (
    <div className="space-y-6 lg:space-y-8">
      <PageHeader
        title="Scan & translate"
        subtitle="Drop a receipt or menu photo — we translate and convert every line."
        actions={
          <Button className="bg-brand rounded-xl shadow-brand">
            <ScanLine className="h-4 w-4" />
            Start camera
          </Button>
        }
      />

      <div className="grid gap-4 lg:grid-cols-2 lg:gap-6 xl:grid-cols-[1fr_1.2fr]">
        <div className="surface-card flex flex-col items-center justify-center gap-4 border-dashed p-8 text-center lg:p-12">
          <span className="bg-brand grid h-16 w-16 place-items-center rounded-2xl text-primary-foreground shadow-brand">
            <Upload className="h-7 w-7" />
          </span>
          <div>
            <h2 className="font-display text-lg font-bold">Drop your receipt here</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              JPEG, PNG or PDF up to 10 MB. Auto-detects 42 languages.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            <Button variant="outline" className="rounded-xl">
              Browse files
            </Button>
            <Button variant="ghost" className="rounded-xl">
              Paste from clipboard
            </Button>
          </div>
          <div className="mt-2 flex flex-wrap justify-center gap-2">
            {["Japanese", "Thai", "Korean", "Arabic"].map((l) => (
              <Badge key={l} variant="secondary" className="rounded-lg">
                {l}
              </Badge>
            ))}
          </div>
        </div>

        <div className="surface-card overflow-hidden">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-border p-5">
            <div className="flex min-w-0 items-center gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent text-accent-foreground">
                <FileText className="h-4 w-4" />
              </span>
              <span className="min-w-0">
                <span className="block truncate font-display text-base font-bold">Sakura Ramen</span>
                <span className="block truncate text-xs text-muted-foreground">
                  Tokyo · 12 Jul 2026 · Japanese detected
                </span>
              </span>
            </div>
            <Badge className="shrink-0 rounded-lg bg-success text-success-foreground">
              <Check className="h-3 w-3" />
              Translated
            </Badge>
          </div>

          <div className="hidden grid-cols-[1.2fr_1.2fr_auto_auto] gap-4 border-b border-border bg-muted/50 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground sm:grid">
            <span>Original</span>
            <span>Translation</span>
            <span className="text-right">JPY</span>
            <span className="text-right">EUR</span>
          </div>

          <ul className="divide-y divide-border">
            {lines.map((l) => (
              <li
                key={l.original}
                className="grid gap-1 px-5 py-4 sm:grid-cols-[1.2fr_1.2fr_auto_auto] sm:items-center sm:gap-4"
              >
                <span className="truncate text-sm text-muted-foreground">{l.original}</span>
                <span className="truncate text-sm font-semibold">{l.translated}</span>
                <span className="text-sm sm:text-right">{l.local}</span>
                <span className="text-sm font-bold sm:text-right">{l.eur}</span>
              </li>
            ))}
          </ul>

          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 border-t border-border bg-muted/40 px-5 py-4">
            <span className="min-w-0 text-sm font-semibold">Total</span>
            <span className="shrink-0 text-right">
              <span className="block font-display text-lg font-extrabold">€20.09</span>
              <span className="block text-xs text-muted-foreground">¥3,400 at 169.24</span>
            </span>
          </div>

          <div className="flex flex-wrap gap-2 p-5">
            <Button className="bg-brand rounded-xl shadow-brand">Save to history</Button>
            <Button variant="outline" className="rounded-xl">
              <Languages className="h-4 w-4" />
              Change language
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
