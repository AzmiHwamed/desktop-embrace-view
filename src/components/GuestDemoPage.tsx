import { Link } from "@tanstack/react-router";
import { Languages, MapPin, ReceiptText, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";

type GuestDemoKind = "scan" | "interpreter" | "explore";

const demos = {
  scan: {
    title: "Receipt scan demo",
    subtitle: "See how SmartTravel extracts and organizes receipt details.",
    icon: ReceiptText,
  },
  interpreter: {
    title: "Live interpreter demo",
    subtitle: "Preview a two-way travel conversation without using AI tokens.",
    icon: Languages,
  },
  explore: {
    title: "Explore nearby demo",
    subtitle: "Browse sample travel recommendations without using live Places search.",
    icon: MapPin,
  },
} as const;

/** Offline examples used for store-review and visitor preview. No API calls. */
export function GuestDemoPage({ kind }: { kind: GuestDemoKind }) {
  const demo = demos[kind];
  const Icon = demo.icon;

  return (
    <div className="mx-auto max-w-4xl space-y-6 py-4 lg:py-8">
      <div className="text-center">
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-accent text-accent-foreground">
          <Icon className="h-6 w-6" />
        </span>
        <h1 className="mt-4 font-display text-2xl font-bold">{demo.title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{demo.subtitle}</p>
      </div>

      <div className="surface-card p-5 sm:p-7">
        {kind === "scan" && <ReceiptSample />}
        {kind === "interpreter" && <InterpreterSample />}
        {kind === "explore" && <ExploreSample />}
      </div>

      <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5 text-center">
        <Sparkles className="mx-auto h-5 w-5 text-primary" />
        <p className="mt-2 text-sm font-semibold">This is offline sample data.</p>
        <p className="mt-1 text-sm text-muted-foreground">Sign in to add tokens and use the live feature.</p>
        <Button asChild className="mt-4 rounded-xl">
          <Link to="/login">Sign in to continue</Link>
        </Button>
      </div>
    </div>
  );
}

function ReceiptSample() {
  return <div className="mx-auto max-w-md space-y-4">
    <div className="flex items-start justify-between border-b pb-4"><div><p className="font-bold">Café Roma</p><p className="text-sm text-muted-foreground">Rome, Italy · Sample receipt</p></div><p className="font-semibold">€18.50</p></div>
    {[['Espresso', '€2.50'], ['Pasta lunch', '€12.00'], ['Service', '€4.00']].map(([name, price]) => <div className="flex justify-between text-sm" key={name}><span>{name}</span><span>{price}</span></div>)}
    <div className="flex justify-between border-t pt-4 font-bold"><span>Total</span><span>€18.50</span></div>
  </div>;
}

function InterpreterSample() {
  return <div className="mx-auto max-w-xl space-y-4 text-sm">
    <div className="max-w-[85%] rounded-2xl rounded-es-sm bg-muted p-4"><p className="font-medium">Where is the nearest train station?</p><p className="mt-1 text-muted-foreground">أين أقرب محطة قطار؟</p></div>
    <div className="ms-auto max-w-[85%] rounded-2xl rounded-ee-sm bg-primary p-4 text-primary-foreground"><p className="font-medium">It is two blocks ahead, on your left.</p><p className="mt-1 opacity-80">إنها على بعد شارعين إلى الأمام، على يسارك.</p></div>
  </div>;
}

function ExploreSample() {
  const places = [['Old Town Museum', 'Culture · 8 min walk'], ['Riverside Café', 'Café · 12 min walk'], ['Central Market', 'Shopping · 15 min walk']];
  return <div className="grid gap-3 sm:grid-cols-3">{places.map(([name, detail]) => <article className="rounded-xl border p-4" key={name}><MapPin className="h-5 w-5 text-primary" /><p className="mt-3 font-semibold">{name}</p><p className="mt-1 text-xs text-muted-foreground">{detail}</p><span className="mt-3 inline-block text-xs text-muted-foreground">Sample place</span></article>)}</div>;
}
