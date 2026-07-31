import type { Txn } from "@/lib/travel-data";

export type HistoryState = {
  query: string;
  category: string;
  items: Txn[];
};
