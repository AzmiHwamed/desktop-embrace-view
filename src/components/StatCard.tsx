import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "default",
}: {
  label: string;
  value: string;
  hint?: string;
  icon: LucideIcon;
  tone?: "default" | "brand";
}) {
  return (
    <div
      className={cn(
        "surface-card p-5",
        tone === "brand" && "bg-brand border-transparent text-primary-foreground shadow-brand",
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <span
          className={cn(
            "text-xs font-semibold uppercase tracking-wide",
            tone === "brand" ? "opacity-80" : "text-muted-foreground",
          )}
        >
          {label}
        </span>
        <span
          className={cn(
            "grid h-9 w-9 shrink-0 place-items-center rounded-xl",
            tone === "brand" ? "bg-background/20" : "bg-accent text-accent-foreground",
          )}
        >
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <p className="mt-4 font-display text-2xl font-extrabold tracking-tight lg:text-3xl">{value}</p>
      {hint && (
        <p className={cn("mt-1 text-xs", tone === "brand" ? "opacity-80" : "text-muted-foreground")}>
          {hint}
        </p>
      )}
    </div>
  );
}
