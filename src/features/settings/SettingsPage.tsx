// pages/SettingsPage.tsx
import { useEffect, useMemo, useState } from "react";
import { HelpCircle, MessageCircle, Search, ShieldCheck } from "lucide-react";

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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useAppDispatch, useAppSelector, useTranslations } from "@/app/hooks";
import { isRtlLanguage } from "@/lib/rtl";
import settingsStrings from "@/locales/en/settings.json";
import { fetchFaqs } from "./faqSlice";
import type { Faq } from "./types";
import { Link } from "@tanstack/react-router";

const ALL_CATEGORY = "all";

function getUniqueCategories(faqs: Faq[]) {
  const map = new Map<string, { id: string; name: string; order: number }>();
  for (const faq of faqs) {
    if (faq.category && !map.has(faq.category.id)) {
      map.set(faq.category.id, {
        id: faq.category.id,
        name: faq.category.name,
        order: faq.category.order,
      });
    }
  }
  return Array.from(map.values()).sort((a, b) => a.order - b.order);
}

export function SettingsPage() {
  const dispatch = useAppDispatch();
  const t = useTranslations("settings", settingsStrings);
  const { items: faqs, loading, error, faqsLoaded } = useAppSelector((s) => s.faq);
  const profile = useAppSelector((s) => s.account.profile);

  const isRtl = isRtlLanguage(profile?.language?.code);

  // Static toggle rows, now keyed to translated label/hint pairs instead of
  // a hardcoded English array. Same disabled-preview state as before —
  // these are the "Coming soon" preferences, not yet wired to real state.
  const toggles = [
    { id: "push", label: t.pushTitle, hint: t.pushHint },
    { id: "email", label: t.emailTitle, hint: t.emailHint },
    { id: "budget", label: t.budgetTitle, hint: t.budgetHint },
    { id: "biometric", label: t.biometricTitle, hint: t.biometricHint },
  ];

  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(ALL_CATEGORY);
  const [search, setSearch] = useState("");

  useEffect(() => {
    dispatch(fetchFaqs());
  }, [dispatch]);

  const categories = useMemo(() => getUniqueCategories(faqs), [faqs]);

  const filteredFaqs = useMemo(() => {
    const query = search.trim().toLowerCase();
    return faqs.filter((faq) => {
      const matchesCategory =
        selectedCategoryId === ALL_CATEGORY || faq.category?.id === selectedCategoryId;
      const matchesSearch =
        query.length === 0 ||
        faq.question.toLowerCase().includes(query) ||
        faq.answer.toLowerCase().includes(query);
      return matchesCategory && matchesSearch;
    });
  }, [faqs, selectedCategoryId, search]);

  // True until the FAQ fetch has settled (fulfilled OR rejected) at least
  // once — mirrors the isPageLoading gate on the other pages. The
  // Preferences card has no fetch (it's all static/local), so it isn't
  // part of this gate.
  const isPageLoading = !faqsLoaded;

  if (isPageLoading) {
    return <SettingsSkeleton dir={isRtl ? "rtl" : "ltr"} />;
  }

  return (
    <div className="space-y-6 lg:space-y-8" dir={isRtl ? "rtl" : "ltr"}>
      <PageHeader title={t.title} subtitle={t.subtitle} />

      <div className="grid gap-4 lg:grid-cols-2 lg:gap-6">
        <div className="surface-card p-5">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-display text-lg font-bold">{t.preferences}</h2>
            <span className="rounded-lg bg-accent px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-accent-foreground">
              {t.comingSoon}
            </span>
          </div>
          <ul className="mt-4 space-y-4">
            {toggles.map((tg) => (
              <li key={tg.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
                <span className="min-w-0">
                  <Label htmlFor={tg.id} className="text-sm font-semibold">
                    {tg.label}
                  </Label>
                  <span className="block truncate text-xs text-muted-foreground">{tg.hint}</span>
                </span>
                <Switch id={tg.id} defaultChecked disabled className="shrink-0" />
              </li>
            ))}
          </ul>

          
        </div>

        <div className="space-y-4 lg:space-y-6">
          <div className="surface-card p-5">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-accent text-accent-foreground">
              <HelpCircle className="h-5 w-5" />
            </span>
            <h2 className="mt-4 font-display text-lg font-bold">{t.faqs}</h2>

            {/* Category pills */}
            <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
              <button
                type="button"
                onClick={() => setSelectedCategoryId(ALL_CATEGORY)}
                className={cn(
                  "shrink-0 rounded-full px-4 py-1.5 text-sm font-semibold transition-colors",
                  selectedCategoryId === ALL_CATEGORY
                    ? "bg-brand text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80",
                )}
              >
                {t.all}
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategoryId(cat.id)}
                  className={cn(
                    "shrink-0 rounded-full px-4 py-1.5 text-sm font-semibold transition-colors",
                    selectedCategoryId === cat.id
                      ? "bg-brand text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80",
                  )}
                >
                  {cat.name}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="relative mt-3">
              <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t.searchPlaceholder}
                className="h-11 rounded-xl ps-9"
              />
            </div>

            {loading && <p className="mt-3 text-sm text-muted-foreground">{t.loading}</p>}
            {error && <p className="mt-3 text-sm text-destructive">{error}</p>}

            {!loading && !error && filteredFaqs.length === 0 && (
              <p className="mt-4 text-sm text-muted-foreground">
                {t.noQuestionsMatch}
              </p>
            )}

            {!loading && !error && filteredFaqs.length > 0 && (
              <Accordion type="single" collapsible className="mt-3">
                {filteredFaqs.map((faq) => (
                  <AccordionItem key={faq.id} value={faq.id}>
                    {/* text-start, not text-left: this accordion question
                        is body copy that should read from the reading
                        start, not glue to the physical left in RTL. */}
                    <AccordionTrigger className="text-start text-sm">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-sm text-muted-foreground">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            )}
          </div>

          <div className="surface-card grid gap-4 p-5 sm:grid-cols-2">
            <div className="rounded-xl border border-border p-4">
              <MessageCircle className="h-5 w-5 text-primary" />
              <p className="mt-2 text-sm font-semibold">{t.customerService}</p>
              <p className="mt-1 text-xs text-muted-foreground">{t.chatWithUs}</p>
              <Link to="/chat">
                <Button variant="outline" className="mt-3 w-full rounded-xl">
                  {t.startChat}
                </Button>
              </Link>
            </div>
            <div className="rounded-xl border border-border p-4">
              <ShieldCheck className="h-5 w-5 text-success" />
              <p className="mt-2 text-sm font-semibold">{t.security}</p>
              <p className="mt-1 text-xs text-muted-foreground">{t.passwordDevices}</p>
              <Button variant="outline" className="mt-3 w-full rounded-xl">
                {t.review}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SettingsSkeleton({ dir }: { dir: "rtl" | "ltr" }) {
  return (
    <div className="space-y-6 lg:space-y-8" aria-busy="true" aria-label="Loading settings" dir={dir}>
      <div className="space-y-2">
        <div className="h-6 w-28 animate-pulse rounded-md bg-muted" />
        <div className="h-4 w-64 animate-pulse rounded-md bg-muted" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2 lg:gap-6">
        <div className="surface-card space-y-4 p-5">
          <div className="h-5 w-28 animate-pulse rounded-md bg-muted" />
          <ul className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <li key={i} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
                <div className="space-y-1.5">
                  <div className="h-3.5 w-32 animate-pulse rounded-md bg-muted" />
                  <div className="h-3 w-44 animate-pulse rounded-md bg-muted" />
                </div>
                <div className="h-6 w-10 shrink-0 animate-pulse rounded-full bg-muted" />
              </li>
            ))}
          </ul>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="h-11 w-full animate-pulse rounded-xl bg-muted" />
            <div className="h-11 w-full animate-pulse rounded-xl bg-muted" />
          </div>
        </div>

        <div className="space-y-4 lg:space-y-6">
          <div className="surface-card space-y-4 p-5">
            <div className="h-11 w-11 animate-pulse rounded-xl bg-muted" />
            <div className="h-5 w-16 animate-pulse rounded-md bg-muted" />
            <div className="flex gap-2">
              <div className="h-8 w-16 animate-pulse rounded-full bg-muted" />
              <div className="h-8 w-24 animate-pulse rounded-full bg-muted" />
              <div className="h-8 w-20 animate-pulse rounded-full bg-muted" />
            </div>
            <div className="h-11 w-full animate-pulse rounded-xl bg-muted" />
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-10 w-full animate-pulse rounded-lg bg-muted" />
              ))}
            </div>
          </div>

          <div className="surface-card grid gap-4 p-5 sm:grid-cols-2">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="space-y-2 rounded-xl border border-border p-4">
                <div className="h-5 w-5 animate-pulse rounded-md bg-muted" />
                <div className="h-4 w-28 animate-pulse rounded-md bg-muted" />
                <div className="h-3 w-24 animate-pulse rounded-md bg-muted" />
                <div className="h-9 w-full animate-pulse rounded-xl bg-muted" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}