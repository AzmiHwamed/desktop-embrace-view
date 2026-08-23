import { useEffect, useState } from "react";
import { Loader2, PlusCircle } from "lucide-react";

import { useAppDispatch, useAppSelector, useTranslations } from "@/app/hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createExpenseCategory } from "@/features/history/historySlice";
import { hydrateBudgets } from "@/features/budgets/budgetSlice";
import type {
  Currency,
  Expense,
  ExpenseCategory,
  ExpenseFormValues,
} from "@/features/history/types";
import historyStrings from "@/locales/en/history.json";

const NEW_CATEGORY_VALUE = "__new__";

type ExpenseFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expense: Expense | null;
  categories: ExpenseCategory[];
  currencies: Currency[];
  saving: boolean;
  error: string | null;
  onSubmit: (values: ExpenseFormValues) => void;
};

const emptyForm: ExpenseFormValues = {
  amount: 0,
  description: "",
  shop: "",
  date: new Date().toISOString().slice(0, 10),
  categoryId: "",
  currencyId: "",
};

export function ExpenseFormDialog({
  open,
  onOpenChange,
  expense,
  categories,
  currencies,
  saving,
  error,
  onSubmit,
}: ExpenseFormDialogProps) {
  const dispatch = useAppDispatch();
  const t = useTranslations("history", historyStrings);
  const creatingCategory = useAppSelector((state) => state.history.creatingCategory);
  const trips = useAppSelector((state) =>
    state.budgets.plans.filter((trip) => trip.status !== "archived"),
  );
  const budgetsHydrated = useAppSelector((state) => state.budgets.hydrated);
  const [form, setForm] = useState<ExpenseFormValues>(emptyForm);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);
  const isEditing = expense !== null;
  const isSaving = saving || creatingCategory;

  useEffect(() => {
    if (open && !budgetsHydrated) void dispatch(hydrateBudgets());
  }, [open, budgetsHydrated, dispatch]);

  useEffect(() => {
    if (!open) return;
    setNewCategoryName("");
    setLocalError(null);
    setForm(
      expense
        ? {
            amount: Number(expense.amount),
            description: expense.description ?? "",
            shop: expense.shop ?? "",
            date: expense.date.slice(0, 10),
            categoryId: expense.category?.id ?? "",
            currencyId: expense.currency?.id ?? "",
            tripId: expense.tripId ?? "",
          }
        : { ...emptyForm, date: new Date().toISOString().slice(0, 10) },
    );
  }, [open, expense]);

  function handleChange<K extends keyof ExpenseFormValues>(key: K, value: ExpenseFormValues[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLocalError(null);
    let categoryId = form.categoryId;

    if (categoryId === NEW_CATEGORY_VALUE) {
      try {
        const category = await dispatch(
          createExpenseCategory({ name: newCategoryName.trim() }),
        ).unwrap();
        categoryId = category.id;
      } catch {
        setLocalError(t.createCategoryError);
        return;
      }
    }

    onSubmit({
      ...form,
      categoryId,
      description: form.description || undefined,
      shop: form.shop || undefined,
      currencyId: form.currencyId || undefined,
      tripId: form.tripId || undefined,
    });
  }

  const canSubmit =
    form.amount > 0 &&
    !!form.date &&
    !!form.categoryId &&
    (form.categoryId !== NEW_CATEGORY_VALUE || newCategoryName.trim().length > 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? t.editExpense : t.addExpense}</DialogTitle>
          <DialogDescription>
            {isEditing ? t.editExpenseDescription : t.addExpenseDescription}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {(localError || error) && (
            <p className="text-sm text-destructive">{localError ?? error}</p>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">{t.amount}</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                value={form.amount || ""}
                onChange={(event) => handleChange("amount", Number(event.target.value))}
                className="h-11 rounded-xl"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency">{t.currency}</Label>
              <Select
                value={form.currencyId || ""}
                onValueChange={(value) => handleChange("currencyId", value)}
              >
                <SelectTrigger id="currency" className="h-11 rounded-xl">
                  <SelectValue placeholder={t.defaultCurrency} />
                </SelectTrigger>
                <SelectContent>
                  {currencies.map((currency) => (
                    <SelectItem key={currency.id} value={currency.id}>
                      {currency.code}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="shop">{t.shop}</Label>
            <Input
              id="shop"
              value={form.shop}
              onChange={(event) => handleChange("shop", event.target.value)}
              placeholder={t.shopPlaceholder}
              className="h-11 rounded-xl"
            />
          </div>

          {trips.length > 0 && (
            <div className="space-y-2">
              <Label>{t.trip}</Label>
              <Select
                value={form.tripId || "none"}
                onValueChange={(value) => handleChange("tripId", value === "none" ? "" : value)}
              >
                <SelectTrigger className="h-11 rounded-xl">
                  <SelectValue placeholder={t.noTrip} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{t.noTrip}</SelectItem>
                  {trips.map((trip) => (
                    <SelectItem key={trip.id} value={trip.id}>
                      {trip.name} · {trip.destination}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="description">{t.description}</Label>
            <Input
              id="description"
              value={form.description}
              onChange={(event) => handleChange("description", event.target.value)}
              placeholder={t.descriptionPlaceholder}
              className="h-11 rounded-xl"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">{t.date}</Label>
              <Input
                id="date"
                type="date"
                value={form.date}
                onChange={(event) => handleChange("date", event.target.value)}
                className="h-11 rounded-xl"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">{t.category}</Label>
              <Select
                value={form.categoryId}
                onValueChange={(value) => handleChange("categoryId", value)}
              >
                <SelectTrigger id="category" className="h-11 rounded-xl">
                  <SelectValue placeholder={t.selectCategory} />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                  <SelectItem value={NEW_CATEGORY_VALUE}>
                    <span className="flex items-center gap-1.5">
                      <PlusCircle className="h-3.5 w-3.5" />
                      {t.createNewCategory}
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
              {form.categoryId === NEW_CATEGORY_VALUE && (
                <Input
                  autoFocus
                  value={newCategoryName}
                  onChange={(event) => setNewCategoryName(event.target.value)}
                  placeholder={t.newCategoryName}
                  className="mt-2 h-11 rounded-xl"
                />
              )}
            </div>
          </div>

          <DialogFooter className="mt-2">
            <Button
              type="button"
              variant="ghost"
              className="rounded-xl"
              onClick={() => onOpenChange(false)}
              disabled={isSaving}
            >
              {t.cancel}
            </Button>
            <Button
              type="submit"
              className="bg-brand rounded-xl shadow-brand"
              disabled={isSaving || !canSubmit}
            >
              {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
              {isSaving ? t.saving : isEditing ? t.saveChanges : t.addExpense}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
