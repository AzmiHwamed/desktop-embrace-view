// pages/HistoryPage.tsx
import { useEffect, useMemo, useState } from "react";
import { Search, Download, Plus } from "lucide-react";

import { PageHeader } from "@/components/AppLayout";
import { InlineLoading } from "@/components/Loading";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAppDispatch, useAppSelector, useTranslations } from "@/app/hooks";
import { isRtlLanguage } from "@/lib/rtl";
import historyStrings from "@/locales/en/history.json";
import {
  fetchHistory,
  fetchExpenseCategories,
  fetchCurrencies,
  createExpense,
  updateExpense,
  setQuery,
  setCategory,
  setDateRange,
} from "@/features/history/historySlice";
import { exportExpensesToCsv } from "@/lib/csv-export";
import type { DateRangeDays, Expense, ExpenseFormValues } from "@/features/history/types";
import { ExpenseFormDialog } from "@/components/Expense/ExpenseFormDialog";
import { MerchantLink } from "@/components/MerchantLink";

export function HistoryPage() {
  const dispatch = useAppDispatch();
  const t = useTranslations("history", historyStrings);
  const {
    query,
    categoryId,
    dateRange,
    items,
    categories,
    currencies,
    loading,
    creating,
    updating,
    error,
    categoriesLoaded,
    currenciesLoaded,
    historyLoaded,
  } = useAppSelector((s) => s.history);
  const profile = useAppSelector((s) => s.account.profile);

  const isRtl = isRtlLanguage(profile?.language?.code);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  useEffect(() => {
    dispatch(fetchExpenseCategories());
    dispatch(fetchCurrencies());
  }, [dispatch]);

  useEffect(() => {
    dispatch(fetchHistory({ categoryId, dateRange }));
  }, [dispatch, categoryId, dateRange]);

  // Client-side text search on top of the server-filtered (category/date) set —
  // no shop/merchant search param exists on the backend's ExpenseQueryDto.
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((e) => {
      const shop = e.shop?.toLowerCase() ?? "";
      const category = e.category?.name.toLowerCase() ?? "";
      return shop.includes(q) || category.includes(q);
    });
  }, [items, query]);

  function openCreateDialog() {
    setEditingExpense(null);
    setDialogOpen(true);
  }

  function openEditDialog(expense: Expense) {
    setEditingExpense(expense);
    setDialogOpen(true);
  }

  async function handleSubmitExpense(values: ExpenseFormValues) {
    try {
      if (editingExpense) {
        await dispatch(updateExpense({ id: editingExpense.id, ...values })).unwrap();
      } else {
        await dispatch(createExpense(values)).unwrap();
      }
      setDialogOpen(false);
      setEditingExpense(null);
      // Re-pull the current filtered window so the new/edited expense shows
      // up in its correct sorted position (or disappears if it now falls
      // outside the active category/date filters).
      dispatch(fetchHistory({ categoryId, dateRange }));
    } catch {
      // Swallowed here — historySlice.error already carries the message and
      // is surfaced inside the dialog via the `error` prop below.
    }
  }

  // True until categories, currencies, and the initial history page have
  // all settled (fulfilled OR rejected) at least once. Subsequent
  // re-fetches from filter changes use `loading` inline further down
  // instead of re-showing this full skeleton.
  const isPageLoading = !categoriesLoaded || !currenciesLoaded || !historyLoaded;

  if (isPageLoading) {
    return <HistorySkeleton dir={isRtl ? "rtl" : "ltr"} />;
  }

  return (
    <div className="space-y-6 lg:space-y-8" dir={isRtl ? "rtl" : "ltr"}>
      <PageHeader
        title={t.title}
        subtitle={t.subtitle}
        actions={
          <Button
            variant="outline"
            className="rounded-xl"
            onClick={() => exportExpensesToCsv(filtered)}
            disabled={filtered.length === 0}
          >
            <Download className="h-4 w-4" />
            {t.exportCsv}
          </Button>
        }
      />

      <div className="surface-card grid gap-3 p-4 md:grid-cols-[minmax(0,1fr)_auto_auto] md:items-center">
        <div className="relative min-w-0">
          {/* Search glass isn't directional (no left/right asymmetry in the
              glyph itself), so it just needs its position mirrored via
              start-3, not a flip. */}
          <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => dispatch(setQuery(e.target.value))}
            placeholder={t.searchPlaceholder}
            className="h-10 rounded-xl ps-9"
          />
        </div>
        <Select value={categoryId} onValueChange={(v) => dispatch(setCategory(v))}>
          <SelectTrigger className="h-10 rounded-xl md:w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t.allCategories}</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={dateRange} onValueChange={(v) => dispatch(setDateRange(v as DateRangeDays))}>
          <SelectTrigger className="h-10 rounded-xl md:w-[150px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">{t.last7Days}</SelectItem>
            <SelectItem value="30">{t.last30Days}</SelectItem>
            <SelectItem value="90">{t.last90Days}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="surface-card overflow-hidden">
        <div className="hidden grid-cols-[1.5fr_2fr_1fr_1fr_auto] gap-4 border-b border-border bg-muted/50 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground lg:grid">
          <span>{t.shop}</span>
          <span>{t.description}</span>
          <span>{t.category}</span>
          <span>{t.date}</span>
          <span className="text-end">{t.amount}</span>
        </div>

        {loading && (
          <div className="grid min-h-28 place-items-center p-5">
            <InlineLoading label={t.refreshingExpenses} />
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <p className="p-5 text-sm text-muted-foreground">{t.noExpensesMatch}</p>
        )}

        <ul className="divide-y divide-border">
          {filtered.map((e) => (
            <li
              key={e.id}
              onClick={() => openEditDialog(e)}
              className="grid cursor-pointer grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-5 py-4 transition-colors hover:bg-muted/50 lg:grid-cols-[1.5fr_2fr_1fr_1fr_auto]"
            >
              <div className="flex min-w-0 items-center gap-3">
                <span
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-xs font-bold text-white"
                  style={{ backgroundColor: e.category?.color ?? "#94a3b8" }}
                >
                  {(e.shop ?? e.category?.name ?? "?").slice(0, 2).toUpperCase()}
                </span>

                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold">
                    <MerchantLink expense={e} fallback={t.untitledExpense} />
                  </span>

                  <span className="block truncate text-xs text-muted-foreground lg:hidden">
                    {e.description ? `${e.description} · ` : ""}
                    {e.category?.name ?? t.uncategorized} · {new Date(e.date).toLocaleDateString()}
                  </span>
                </span>
              </div>

              <span className="hidden truncate text-sm text-muted-foreground lg:block">
                {e.description ?? "—"}
              </span>

              <span className="hidden lg:block">
                <Badge variant="secondary" className="rounded-lg">
                  {e.category?.name ?? t.uncategorized}
                </Badge>
              </span>
              <span className="hidden truncate text-sm text-muted-foreground lg:block">
                {new Date(e.date).toLocaleDateString()}
              </span>
              <span className="shrink-0 text-end">
                <span className="block text-sm font-bold">
                  {Number(e.convertedAmount).toFixed(2)} {profile?.currency?.code ?? ""}
                </span>
              </span>
            </li>
          ))}
        </ul>
      </div>

      <button
        onClick={openCreateDialog}
        aria-label={t.addExpense}
        // Fixed FAB anchors to a physical corner, which `dir` alone can't
        // mirror (unlike in-flow content). Swap the side explicitly so it
        // sits at the reading "end" corner in RTL instead of the same
        // visual corner regardless of language.
        className={
          "fixed bottom-6 z-40 grid h-14 w-14 place-items-center rounded-full bg-brand text-primary-foreground shadow-lg shadow-brand/30 transition-transform hover:scale-105 active:scale-95 lg:bottom-8 " +
          (isRtl ? "left-6 lg:left-8" : "right-6 lg:right-8")
        }
      >
        <Plus className="h-6 w-6" />
      </button>

      <ExpenseFormDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditingExpense(null);
        }}
        expense={editingExpense}
        categories={categories}
        currencies={currencies}
        saving={creating || updating}
        error={error}
        onSubmit={handleSubmitExpense}
      />
    </div>
  );
}

function HistorySkeleton({ dir }: { dir: "rtl" | "ltr" }) {
  return (
    <div className="space-y-6 lg:space-y-8" aria-busy="true" aria-label="Loading history" dir={dir}>
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="h-6 w-32 animate-pulse rounded-md bg-muted" />
          <div className="h-4 w-64 animate-pulse rounded-md bg-muted" />
        </div>
        <div className="h-9 w-32 animate-pulse rounded-xl bg-muted" />
      </div>

      <div className="surface-card grid gap-3 p-4 md:grid-cols-[minmax(0,1fr)_auto_auto] md:items-center">
        <div className="h-10 w-full animate-pulse rounded-xl bg-muted" />
        <div className="h-10 w-full animate-pulse rounded-xl bg-muted md:w-[180px]" />
        <div className="h-10 w-full animate-pulse rounded-xl bg-muted md:w-[150px]" />
      </div>

      <div className="surface-card overflow-hidden">
        <div className="hidden grid-cols-[1.5fr_2fr_1fr_1fr_auto] gap-4 border-b border-border bg-muted/50 px-5 py-3 lg:grid">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-3 w-16 animate-pulse rounded-md bg-muted" />
          ))}
        </div>
        <ul className="divide-y divide-border">
          {Array.from({ length: 6 }).map((_, i) => (
            <li key={i} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-5 py-4 lg:grid-cols-[1.5fr_2fr_1fr_1fr_auto]">
              <div className="flex min-w-0 items-center gap-3">
                <div className="h-10 w-10 shrink-0 animate-pulse rounded-xl bg-muted" />
                <div className="space-y-2">
                  <div className="h-4 w-28 animate-pulse rounded-md bg-muted" />
                  <div className="h-3 w-40 animate-pulse rounded-md bg-muted lg:hidden" />
                </div>
              </div>
              <div className="hidden h-4 w-32 animate-pulse rounded-md bg-muted lg:block" />
              <div className="hidden h-5 w-20 animate-pulse rounded-full bg-muted lg:block" />
              <div className="hidden h-4 w-20 animate-pulse rounded-md bg-muted lg:block" />
              <div className="h-4 w-16 shrink-0 animate-pulse rounded-md bg-muted" />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
