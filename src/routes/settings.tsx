import { createFileRoute } from "@tanstack/react-router";
import { HelpCircle, MessageCircle, ShieldCheck } from "lucide-react";

import { PageHeader } from "@/components/AppLayout";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings · SmartTravel" },
      {
        name: "description",
        content: "Notification, security and support settings for your SmartTravel workspace.",
      },
      { property: "og:title", content: "Settings · SmartTravel" },
      {
        property: "og:description",
        content: "Notification, security and support settings.",
      },
    ],
  }),
  component: SettingsPage,
});

const toggles = [
  { id: "push", label: "Push notifications", hint: "Scan results and rate alerts" },
  { id: "email", label: "Email summaries", hint: "Weekly spend digest" },
  { id: "budget", label: "Budget warnings", hint: "Alert at 80% of budget" },
  { id: "biometric", label: "Biometric unlock", hint: "Face ID on supported devices" },
];

const faqs = [
  ["How accurate are the exchange rates?", "We use live mid-market rates refreshed every 60 seconds, with no hidden markup added to conversions."],
  ["Which languages can be translated?", "42 languages including Japanese, Thai, Korean, Arabic and all major European languages."],
  ["Can I export my expenses?", "Yes — export any date range to CSV or PDF from the History page, ready for accounting."],
  ["Is my data secure?", "Receipts are encrypted at rest and in transit, and never shared with third parties."],
];

function SettingsPage() {
  return (
    <div className="space-y-6 lg:space-y-8">
      <PageHeader title="Settings" subtitle="Preferences, security and support" />

      <div className="grid gap-4 lg:grid-cols-2 lg:gap-6">
        <div className="surface-card p-5">
          <h2 className="font-display text-lg font-bold">Preferences</h2>
          <ul className="mt-4 space-y-4">
            {toggles.map((t) => (
              <li key={t.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
                <span className="min-w-0">
                  <Label htmlFor={t.id} className="text-sm font-semibold">
                    {t.label}
                  </Label>
                  <span className="block truncate text-xs text-muted-foreground">{t.hint}</span>
                </span>
                <Switch id={t.id} defaultChecked className="shrink-0" />
              </li>
            ))}
          </ul>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="lang">Language</Label>
              <Select defaultValue="en">
                <SelectTrigger id="lang" className="h-11 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="pt">Português</SelectItem>
                  <SelectItem value="ja">日本語</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="theme">Appearance</Label>
              <Select defaultValue="light">
                <SelectTrigger id="theme" className="h-11 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="space-y-4 lg:space-y-6">
          <div className="surface-card p-5">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-accent text-accent-foreground">
              <HelpCircle className="h-5 w-5" />
            </span>
            <h2 className="mt-4 font-display text-lg font-bold">FAQs</h2>
            <Accordion type="single" collapsible className="mt-2">
              {faqs.map(([q, a]) => (
                <AccordionItem key={q} value={q}>
                  <AccordionTrigger className="text-left text-sm">{q}</AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground">{a}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>

          <div className="surface-card grid gap-4 p-5 sm:grid-cols-2">
            <div className="rounded-xl border border-border p-4">
              <MessageCircle className="h-5 w-5 text-primary" />
              <p className="mt-2 text-sm font-semibold">Customer service</p>
              <p className="mt-1 text-xs text-muted-foreground">Chat with us, 24/7</p>
              <Button variant="outline" className="mt-3 w-full rounded-xl">
                Start chat
              </Button>
            </div>
            <div className="rounded-xl border border-border p-4">
              <ShieldCheck className="h-5 w-5 text-success" />
              <p className="mt-2 text-sm font-semibold">Security</p>
              <p className="mt-1 text-xs text-muted-foreground">Password & devices</p>
              <Button variant="outline" className="mt-3 w-full rounded-xl">
                Review
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
