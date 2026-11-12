import { Link } from "@tanstack/react-router";
import { Coins, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAiServiceCost, type AiServiceKey } from "@/features/tokens/useAiServiceCost";

export function AiTokenCostNotice({ service, action }: { service: AiServiceKey; action: string }) {
  const { cost, balance, hasEnoughTokens } = useAiServiceCost(service);
  return <div className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-3 text-sm ${hasEnoughTokens ? "border-border bg-muted/40" : "border-amber-300 bg-amber-50 text-amber-950 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-100"}`}>
    <span className="flex items-center gap-2"><Coins className="h-4 w-4 text-primary" />{action} costs <strong>{cost} tokens</strong>. Your balance: <strong>{balance}</strong>.</span>
    {!hasEnoughTokens && <Button asChild size="sm" className="rounded-lg"><Link to="/tokens"><TriangleAlert className="h-4 w-4" />Buy tokens</Link></Button>}
  </div>;
}
