import { useEffect, useMemo, useState } from "react";

import { useAppSelector } from "@/app/hooks";
import { apiFetch, type ApiResponse } from "@/lib/api-client";
import type { BudgetPlan } from "./types";

const translationCache = new Map<string, Record<string, string>>();

export function useTranslatedBudgetNames(plans: BudgetPlan[]): Record<string, string> {
  const languageKey = useAppSelector(
    (state) => state.account.profile?.languageId ?? state.account.profile?.language?.code ?? "default",
  );
  const sourceKey = useMemo(
    () => plans.map((plan) => `${plan.id}:${plan.name}`).sort().join("|"),
    [plans],
  );
  const cacheKey = `${languageKey}:${sourceKey}`;
  const [translated, setTranslated] = useState<Record<string, string>>(
    () => translationCache.get(cacheKey) ?? {},
  );

  useEffect(() => {
    let cancelled = false;
    const cached = translationCache.get(cacheKey);
    if (cached) {
      setTranslated(cached);
      return () => { cancelled = true; };
    }
    if (!plans.length || languageKey === "default") {
      setTranslated({});
      return () => { cancelled = true; };
    }

    const source = Object.fromEntries(plans.map((plan) => [plan.id, plan.name]));
    apiFetch<ApiResponse<{ data: Record<string, string> }>>("/translation/json", {
      method: "POST",
      body: JSON.stringify({ data: source }),
    })
      .then((response) => {
        if (cancelled) return;
        const result = response.data.data;
        translationCache.set(cacheKey, result);
        setTranslated(result);
      })
      .catch(() => {
        if (!cancelled) setTranslated({});
      });

    return () => { cancelled = true; };
  }, [cacheKey, languageKey, sourceKey]);

  return translated;
}
