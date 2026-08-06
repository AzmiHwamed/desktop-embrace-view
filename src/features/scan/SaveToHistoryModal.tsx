// features/scan/SaveToHistoryModal.tsx
import { useEffect, useMemo, useState } from "react";
import { Loader2, PlusCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { useAppDispatch, useAppSelector, useTranslations } from "@/app/hooks";
import scanStrings from "@/locales/en/scan.json";
import {
  createExpenseCategory,
  fetchExpenseCategories,
  resetSaveStatus,
  saveExpenseFromReceipt,
} from "./scanSlice";
import type { Receipt } from "./types";

const NEW_CATEGORY_VALUE = "__new__";

type SaveToHistoryModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  receipt: Receipt;
};

export function SaveToHistoryModal({ open, onOpenChange, receipt }: SaveToHistoryModalProps) {
  const dispatch = useAppDispatch();
  const t = useTranslations("scan", scanStrings);

  const {
    categories,
    categoriesStatus,
    recommendation,
    recommendationStatus,
    saveStatus,
    saveError,
  } = useAppSelector((state) => state.scan);

  const [categoryId, setCategoryId] = useState("");
  const [newCategoryName, setNewCategoryName] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState("");
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const isRecommending = recommendationStatus === "loading";
  const isSaving = saveStatus === "saving" || isCreatingCategory;

  // Load categories once, the first time the modal opens.
  useEffect(() => {
    if (open && categoriesStatus === "idle") {
      dispatch(fetchExpenseCategories());
    }
  }, [open, categoriesStatus, dispatch]);

  useEffect(() => {
    if (!open) return;

    setCategoryId("");
    setNewCategoryName("");
    setDescription(receipt.merchant ?? "");
    setAmount(receipt.total == null ? "" : String(receipt.total));
    setDate(receipt.date?.slice(0, 10) ?? "");
    setLocalError(null);
    dispatch(resetSaveStatus());
  }, [open, receipt.id, receipt.merchant, receipt.total, receipt.date, dispatch]);

  // Reset the form for this receipt whenever the modal is (re)opened.
  // Prefill from the AI recommendation once it lands.
  useEffect(() => {
    if (!open || recommendationStatus !== "done") return;

    const suggestedDescription = recommendation?.descriptionRecommendation?.description;
    if (suggestedDescription) {
      setDescription(suggestedDescription);
    }

    const categoryRec = recommendation?.categoryRecommendation;
    if (categoryRec?.matched && categoryRec.expenseType?.id) {
      setCategoryId(categoryRec.expenseType.id);
    } else if (categoryRec && !categoryRec.matched && categoryRec.suggestedExpenseType?.name) {
      // No existing category matched closely enough — default to creating
      // a new one from the AI's suggestion. The name is editable, and the
      // user still has to hit "Save expense" to confirm it.
      setCategoryId(NEW_CATEGORY_VALUE);
      setNewCategoryName(categoryRec.suggestedExpenseType.name);
    }
  }, [open, recommendationStatus, recommendation]);

  const canSubmit = useMemo(() => {
    if (!description.trim() || !amount.trim()) return false;
    if (categoryId === NEW_CATEGORY_VALUE) return newCategoryName.trim().length > 0;
    return !!categoryId;
  }, [description, amount, categoryId, newCategoryName]);

  async function handleSave() {
    setLocalError(null);

    try {
      let resolvedCategoryId = categoryId;

      if (categoryId === NEW_CATEGORY_VALUE) {
        setIsCreatingCategory(true);
        const created = await dispatch(
          createExpenseCategory({ name: newCategoryName.trim() })
        ).unwrap();
        resolvedCategoryId = created.id;
        setIsCreatingCategory(false);
      }

      await dispatch(
        saveExpenseFromReceipt({
          receiptId: receipt.id,
          categoryId: resolvedCategoryId,
          description: description.trim(),
          amount: Number(amount),
          date: date || undefined,
        })
      ).unwrap();

      onOpenChange(false);
    } catch (err) {
      setIsCreatingCategory(false);
      setLocalError(typeof err === "string" ? err : t.saveExpenseError);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t.saveExpenseTitle}</DialogTitle>
          <DialogDescription>{t.saveExpenseDescription}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="expense-description">{t.description}</Label>
            <Textarea
              id="expense-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={isRecommending ? t.generatingSuggestion : t.descriptionPlaceholder}
              disabled={isRecommending}
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="expense-amount">{t.amount}</Label>
              <Input
                id="expense-amount"
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="expense-date">{t.date}</Label>
              <Input
                id="expense-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="expense-category">{t.category}</Label>
            <Select value={categoryId} onValueChange={setCategoryId} disabled={isRecommending}>
              <SelectTrigger id="expense-category">
                <SelectValue
                  placeholder={isRecommending ? t.findingCategory : t.chooseCategory}
                />
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

            {categoryId === NEW_CATEGORY_VALUE && (
              <Input
                autoFocus
                className="mt-2"
                placeholder={t.newCategoryName}
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
              />
            )}
          </div>

          {(localError || saveError) && (
            <p className="text-sm text-destructive">{localError ?? saveError}</p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            {t.cancel}
          </Button>
          <Button onClick={handleSave} disabled={!canSubmit || isSaving}>
            {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
            {t.saveExpense}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
