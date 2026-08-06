import { Plane } from "lucide-react";

import { cn } from "@/lib/utils";

export function BrandLoader({
  size = "md",
  className,
}: {
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const sizes = {
    sm: "h-5 w-5",
    md: "h-9 w-9",
    lg: "h-14 w-14",
  };

  return (
    <span className={cn("relative inline-grid place-items-center", sizes[size], className)}>
      <span className="absolute inset-0 rounded-full border-2 border-primary/15 border-t-primary motion-safe:animate-spin" />
      <span className="absolute inset-[5px] rounded-full border border-primary-glow/20 border-b-primary-glow motion-safe:animate-[spin_1.4s_linear_infinite_reverse]" />
      {size === "lg" && <Plane className="h-4 w-4 text-primary" aria-hidden="true" />}
    </span>
  );
}

export function PageLoading({
  label = "Preparing your workspace…",
  description = "This should only take a moment.",
  compact = false,
}: {
  label?: string;
  description?: string;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        "grid w-full place-items-center px-6",
        compact ? "min-h-64" : "min-h-screen",
      )}
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      <div className="relative overflow-hidden rounded-3xl border border-primary/10 bg-card/90 px-10 py-9 text-center shadow-card backdrop-blur">
        <span className="pointer-events-none absolute -inset-16 bg-[radial-gradient(circle_at_center,var(--color-primary)_0,transparent_60%)] opacity-[0.06] motion-safe:animate-pulse" />
        <BrandLoader size="lg" />
        <p className="relative mt-4 font-display text-sm font-bold">{label}</p>
        <p className="relative mt-1 text-xs text-muted-foreground">{description}</p>
        <span className="relative mx-auto mt-5 block h-1 w-36 overflow-hidden rounded-full bg-muted">
          <span className="loading-progress block h-full w-1/2 rounded-full bg-brand" />
        </span>
      </div>
    </div>
  );
}

export function InlineLoading({
  label = "Loading…",
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <span
      className={cn("inline-flex items-center gap-2 text-sm text-muted-foreground", className)}
      role="status"
      aria-live="polite"
    >
      <BrandLoader size="sm" />
      <span>{label}</span>
    </span>
  );
}
