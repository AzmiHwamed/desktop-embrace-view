import { useEffect, useMemo, useState } from "react";
import { HelpCircle, Search } from "lucide-react";

import { useAppDispatch, useAppSelector, useTranslations } from "@/app/hooks";
import { PageHeader } from "@/components/AppLayout";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { isRtlLanguage } from "@/lib/rtl";
import settingsStrings from "@/locales/en/settings.json";
import { fetchFaqs } from "./faqSlice";
import type { Faq } from "./types";

const ALL_CATEGORY = "all";

function categoriesFor(faqs: Faq[]) {
  const categories = new Map<string, { id: string; name: string; order: number }>();
  for (const faq of faqs) {
    if (faq.category) categories.set(faq.category.id, faq.category);
  }
  return [...categories.values()].sort((a, b) => a.order - b.order);
}

export function FaqPage() {
  const dispatch = useAppDispatch();
  const t = useTranslations("settings", settingsStrings);
  const { items, loading, error } = useAppSelector((state) => state.faq);
  const profile = useAppSelector((state) => state.account.profile);
  const [category, setCategory] = useState(ALL_CATEGORY);
  const [search, setSearch] = useState("");
  const isRtl = isRtlLanguage(profile?.language?.code);

  useEffect(() => {
    dispatch(fetchFaqs());
  }, [dispatch]);

  const categories = useMemo(() => categoriesFor(items), [items]);
  const faqs = useMemo(() => {
    const query = search.trim().toLowerCase();
    return items.filter((faq) => {
      const inCategory = category === ALL_CATEGORY || faq.category?.id === category;
      return (
        inCategory &&
        (!query ||
          faq.question.toLowerCase().includes(query) ||
          faq.answer.toLowerCase().includes(query))
      );
    });
  }, [category, items, search]);

  return (
    <div className="mx-auto max-w-3xl space-y-6 lg:space-y-8" dir={isRtl ? "rtl" : "ltr"}>
      <PageHeader title={t.faqs} subtitle={t.subtitle} />
      <section className="surface-card p-5 sm:p-7">
        <span className="grid h-11 w-11 place-items-center rounded-xl bg-accent text-accent-foreground">
          <HelpCircle className="h-5 w-5" />
        </span>
        <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setCategory(ALL_CATEGORY)}
            className={cn(
              "shrink-0 rounded-full px-4 py-1.5 text-sm font-semibold",
              category === ALL_CATEGORY
                ? "bg-brand text-primary-foreground"
                : "bg-muted text-muted-foreground",
            )}
          >
            {t.all}
          </button>
          {categories.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setCategory(item.id)}
              className={cn(
                "shrink-0 rounded-full px-4 py-1.5 text-sm font-semibold",
                category === item.id
                  ? "bg-brand text-primary-foreground"
                  : "bg-muted text-muted-foreground",
              )}
            >
              {item.name}
            </button>
          ))}
        </div>
        <div className="relative mt-4">
          <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t.searchPlaceholder}
            className="h-11 rounded-xl ps-9"
          />
        </div>
        {loading && <p className="mt-5 text-sm text-muted-foreground">{t.loading}</p>}
        {error && <p className="mt-5 text-sm text-destructive">{error}</p>}
        {!loading && !error && faqs.length === 0 && (
          <p className="mt-5 text-sm text-muted-foreground">{t.noQuestionsMatch}</p>
        )}
        {!loading && !error && faqs.length > 0 && (
          <Accordion type="single" collapsible className="mt-4">
            {faqs.map((faq) => (
              <AccordionItem key={faq.id} value={faq.id}>
                <AccordionTrigger className="text-start text-sm">{faq.question}</AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </section>
    </div>
  );
}
