// lib/csv-export.ts
import type { Expense } from "@/features/history/types";

// Client-side export — no /expenses/export endpoint exists on the backend,
// so this builds a CSV from whatever's currently loaded (i.e. respects the
// active filters, but only the current page/range, not the user's full history).
export function exportExpensesToCsv(expenses: Expense[]) {
  const header = ["Shop", "Category", "Date", "Amount", "Currency"];
  const rows = expenses.map((e) => [
    e.shop ?? "",
    e.category?.name ?? "Uncategorized",
    e.date.slice(0, 10),
    String(e.amount),
    e.currency?.code ?? "",
  ]);

  const csv = [header, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `expenses-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}