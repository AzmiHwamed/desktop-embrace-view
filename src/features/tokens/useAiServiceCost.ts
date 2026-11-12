import { useEffect, useState } from "react";
import { apiFetch, type ApiResponse } from "@/lib/api-client";
import { useAppSelector } from "@/app/hooks";

export type AiServiceKey = "receiptScan" | "interpreterTurn" | "textTranslation" | "tripPlan";

const fallbackCosts: Record<AiServiceKey, number> = { receiptScan: 3, interpreterTurn: 5, textTranslation: 1, tripPlan: 8 };

export function useAiServiceCost(service: AiServiceKey) {
  const profile = useAppSelector((state) => state.account.profile);
  const [costs, setCosts] = useState(fallbackCosts);
  useEffect(() => {
    if (!profile) return;
    let cancelled = false;
    apiFetch<ApiResponse<Array<{ service: AiServiceKey; tokenCost: number }>>>("/ai-service-prices")
      .then((response) => {
        if (!cancelled) setCosts((current) => ({ ...current, ...Object.fromEntries(response.data.map((item) => [item.service, item.tokenCost])) }));
      })
      .catch(() => undefined);
    return () => { cancelled = true; };
  }, [profile]);
  const cost = costs[service];
  const balance = Number(profile?.tokenBalance ?? 0);
  return { cost, balance, hasEnoughTokens: balance >= cost };
}
