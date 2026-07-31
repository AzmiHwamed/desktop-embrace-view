import type { Txn } from "@/lib/travel-data";

export type SpendPoint = { day: string; spend: number };
export type RateRow = { pair: string; rate: string; change: string; up: boolean };
export type DashboardRange = "week" | "month";

export type DashboardState = {
  range: DashboardRange;
  balance: number;
  recent: Txn[];
  trend: SpendPoint[];
  rates: RateRow[];
};
