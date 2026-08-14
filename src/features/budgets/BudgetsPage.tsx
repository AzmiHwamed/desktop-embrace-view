import { useEffect, useMemo, useState } from "react";
import {
  Bell,
  CalendarDays,
  Copy,
  Eye,
  Pencil,
  Plus,
  RotateCcw,
  Target,
  Trash2,
  TrendingDown,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";

import { useAppDispatch, useAppSelector, useTranslations } from "@/app/hooks";
import { PageHeader } from "@/components/AppLayout";
import { InlineLoading } from "@/components/Loading";
import { MerchantLink } from "@/components/MerchantLink";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { fetchExpenseCategories } from "@/features/history/historySlice";
import { isRtlLanguage } from "@/lib/rtl";
import { interpolate } from "@/lib/i18n";
import budgetStrings from "@/locales/en/budgets.json";
import {
  activatePlan,
  archivePlan,
  dismissAlert,
  hydrateBudgets,
  saveBudgetPlan,
  updatePlan,
} from "./budgetSlice";
import type { BudgetCategoryLimit, BudgetDraft, BudgetExpense, BudgetPlan } from "./types";
import { useTranslatedBudgetNames } from "./useTranslatedBudgetNames";

export function BudgetsPage() {
  const dispatch = useAppDispatch();
  const t = useTranslations("budgets", budgetStrings);
  const profile = useAppSelector((state) => state.account.profile);
  const categories = useAppSelector((state) => state.history.categories);
  const { plans, activePlanId, expenses, alerts, hydrated, loadingExpenses, saving, error } =
    useAppSelector((state) => state.budgets);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<BudgetPlan | null>(null);
  const [viewingPlan, setViewingPlan] = useState<BudgetPlan | null>(null);
  const activePlan = plans.find((plan) => plan.id === activePlanId) ?? null;
  const translatedBudgetNames = useTranslatedBudgetNames(plans);
  const isRtl = isRtlLanguage(profile?.language?.code);

  useEffect(() => {
    if (!hydrated) dispatch(hydrateBudgets());
  }, [dispatch, hydrated]);
  useEffect(() => {
    if (!categories.length) dispatch(fetchExpenseCategories());
  }, [dispatch, categories.length]);
  return (
    <div className="space-y-6 lg:space-y-8" dir={isRtl ? "rtl" : "ltr"}>
      <PageHeader
        title={t.title}
        subtitle={t.subtitle}
        actions={
          <Button
            className="bg-brand rounded-xl shadow-brand"
            onClick={() => {
              setEditingPlan(null);
              setDialogOpen(true);
            }}
          >
            <Plus className="h-4 w-4" />
            {t.createBudget}
          </Button>
        }
      />

      {error && (
        <p className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p>
      )}

      {alerts.length > 0 && (
        <section className="space-y-2">
          <h2 className="flex items-center gap-2 font-semibold">
            <Bell className="h-4 w-4 text-amber-500" />
            {t.alerts}
          </h2>
          {alerts.slice(0, 3).map((alert) => (
            <div
              key={alert.id}
              className="flex items-start justify-between gap-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-100"
            >
              <div>
                <p className="text-sm font-bold">
                  {alert.kind === "threshold"
                    ? interpolate(t.thresholdAlertTitle, {
                        name: activePlan
                          ? (translatedBudgetNames[activePlan.id] ?? activePlan.name)
                          : alert.title,
                        threshold: alert.threshold ?? "",
                      })
                    : alert.title}
                </p>
                <p className="mt-0.5 text-sm opacity-80">
                  {alert.kind === "daily"
                    ? t.dailyAlertBody
                    : alert.kind === "threshold"
                      ? interpolate(t.thresholdAlertBody, {
                          spent: `${activePlan?.currencyCode ?? ""} ${Number(alert.spent).toFixed(2)}`,
                          total: `${activePlan?.currencyCode ?? ""} ${Number(alert.total).toFixed(2)}`,
                        })
                      : alert.body}
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => dispatch(dismissAlert(alert.id))}>
                {t.dismiss}
              </Button>
            </div>
          ))}
        </section>
      )}

      {!hydrated ? (
        <div className="surface-card grid min-h-64 place-items-center">
          <InlineLoading label={t.loading} />
        </div>
      ) : activePlan ? (
        <ActiveBudget
          plan={activePlan}
          translatedName={translatedBudgetNames[activePlan.id] ?? activePlan.name}
          expenses={expenses}
          loading={loadingExpenses}
          t={t}
          onArchive={() => dispatch(archivePlan(activePlan.id))}
          onEdit={() => {
            setEditingPlan(activePlan);
            setDialogOpen(true);
          }}
        />
      ) : (
        <EmptyBudget t={t} onCreate={() => setDialogOpen(true)} />
      )}

      {plans.some((plan) => plan.id !== activePlanId) && (
        <section className="space-y-3">
          <h2 className="font-display text-lg font-bold">{t.pastPlans}</h2>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {plans
              .filter((plan) => plan.id !== activePlanId)
              .map((plan) => (
                <Card key={plan.id} className="transition hover:border-primary/30">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-bold">
                          {translatedBudgetNames[plan.id] ?? plan.name}
                        </h3>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {plan.startDate} – {plan.endDate}
                        </p>
                      </div>
                      <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-semibold">
                        {plan.status === "archived" ? t.archived : t.completed}
                      </span>
                    </div>
                    <p className="mt-4 text-lg font-bold">
                      {plan.currencyCode} {plan.totalAmount.toFixed(2)}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Button size="sm" variant="outline" onClick={() => setViewingPlan(plan)}>
                        <Eye className="h-3.5 w-3.5" />
                        {t.viewTrip}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setEditingPlan(plan);
                          setDialogOpen(true);
                        }}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        {t.edit}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </section>
      )}

      <BudgetDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        categories={categories}
        currencyId={profile?.currencyId ?? ""}
        currencyCode={profile?.currency?.code ?? ""}
        saving={saving}
        t={t}
        plan={editingPlan}
        onSave={async (draft) => {
          if (editingPlan) dispatch(updatePlan({ id: editingPlan.id, draft }));
          else await dispatch(saveBudgetPlan(draft)).unwrap();
          setDialogOpen(false);
          setEditingPlan(null);
        }}
      />
      <TripDetailsDialog
        plan={viewingPlan}
        translatedName={viewingPlan
          ? (translatedBudgetNames[viewingPlan.id] ?? viewingPlan.name)
          : undefined}
        t={t}
        onOpenChange={(open) => {
          if (!open) setViewingPlan(null);
        }}
        onEdit={() => {
          if (!viewingPlan) return;
          setEditingPlan(viewingPlan);
          setViewingPlan(null);
          setDialogOpen(true);
        }}
        onActivate={() => {
          if (!viewingPlan) return;
          dispatch(activatePlan(viewingPlan.id));
          setViewingPlan(null);
        }}
        onDuplicate={async () => {
          if (!viewingPlan) return;
          const {
            id,
            status,
            notifiedThresholds,
            lastDailyReminderDate,
            createdAt,
            updatedAt,
            ...draft
          } = viewingPlan;
          void id;
          void status;
          void notifiedThresholds;
          void lastDailyReminderDate;
          void createdAt;
          void updatedAt;
          await dispatch(
            saveBudgetPlan({ ...draft, name: `${draft.name} ${t.copySuffix}` }),
          ).unwrap();
          setViewingPlan(null);
        }}
      />
    </div>
  );
}

function ActiveBudget({
  plan,
  translatedName,
  expenses,
  loading,
  t,
  onArchive,
  onEdit,
}: {
  plan: BudgetPlan;
  translatedName: string;
  expenses: BudgetExpense[];
  loading: boolean;
  t: typeof budgetStrings;
  onArchive: () => void;
  onEdit: () => void;
}) {
  const today = new Date();
  const start = new Date(`${plan.startDate}T00:00:00`);
  const end = new Date(`${plan.endDate}T23:59:59`);
  const totalDays = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / 86400000) + 1);
  const elapsedDays = Math.max(
    1,
    Math.min(totalDays, Math.ceil((today.getTime() - start.getTime()) / 86400000) + 1),
  );
  const daysRemaining = Math.max(0, Math.ceil((end.getTime() - today.getTime()) / 86400000));
  const spent = expenses.reduce(
    (sum, expense) => sum + Number(expense.convertedAmount ?? expense.amount ?? 0),
    0,
  );
  const remaining = Math.max(0, plan.totalAmount - spent);
  const percentage = plan.totalAmount > 0 ? (spent / plan.totalAmount) * 100 : 0;
  const safeDaily = daysRemaining > 0 ? remaining / daysRemaining : remaining;
  const projected = elapsedDays > 0 ? (spent / elapsedDays) * totalDays : 0;
  const pace =
    percentage > 100
      ? t.overBudget
      : projected > plan.totalAmount * 1.05
        ? t.overBudget
        : projected < plan.totalAmount * 0.8
          ? t.underBudget
          : t.onTrack;
  const categorySpent = useMemo(
    () =>
      Object.fromEntries(
        plan.categoryLimits.map((limit) => [
          limit.categoryId,
          expenses
            .filter((expense) => expense.category?.id === limit.categoryId)
            .reduce(
              (sum, expense) => sum + Number(expense.convertedAmount ?? expense.amount ?? 0),
              0,
            ),
        ]),
      ),
    [expenses, plan.categoryLimits],
  );

  return (
    <div className="space-y-5">
      <Card className="overflow-hidden border-primary/15 bg-gradient-to-br from-primary/[0.09] via-card to-card">
        <CardContent className="p-5 sm:p-7">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                {t.active}
              </span>
              <h2 className="mt-3 font-display text-2xl font-extrabold">{translatedName}</h2>
              <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                <CalendarDays className="h-4 w-4" />
                {plan.startDate} – {plan.endDate}
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={onEdit}>
                <Pencil className="h-4 w-4" />
                {t.edit}
              </Button>
              <Button variant="ghost" size="sm" onClick={onArchive}>
                <Trash2 className="h-4 w-4" />
                {t.archive}
              </Button>
            </div>
          </div>
          <div className="mt-7 flex items-end justify-between gap-4">
            <div>
              <p className="text-sm text-muted-foreground">
                {interpolate(t.spentOf, {
                  spent: `${plan.currencyCode} ${spent.toFixed(2)}`,
                  total: `${plan.currencyCode} ${plan.totalAmount.toFixed(2)}`,
                })}
              </p>
              <p className="mt-1 text-3xl font-extrabold">{Math.round(percentage)}%</p>
            </div>
            {loading && <InlineLoading label={t.loading} />}
          </div>
          <Progress value={Math.min(100, percentage)} className="mt-3 h-3" />
        </CardContent>
      </Card>
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric
          icon={Wallet}
          label={t.remaining}
          value={`${plan.currencyCode} ${remaining.toFixed(2)}`}
        />
        <Metric icon={CalendarDays} label={t.daysRemaining} value={String(daysRemaining)} />
        <Metric
          icon={TrendingDown}
          label={t.dailyAllowance}
          value={`${plan.currencyCode} ${safeDaily.toFixed(2)}`}
        />
        <Metric
          icon={Target}
          label={t.projectedTotal}
          value={`${plan.currencyCode} ${projected.toFixed(2)}`}
          hint={pace}
        />
      </section>
      <section className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardContent className="p-5">
            <h3 className="font-display text-lg font-bold">{t.categoryProgress}</h3>
            {plan.categoryLimits.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">{t.noCategoryLimits}</p>
            ) : (
              <ul className="mt-4 space-y-4">
                {plan.categoryLimits.map((limit) => {
                  const used = categorySpent[limit.categoryId] ?? 0;
                  const pct = limit.amount > 0 ? (used / limit.amount) * 100 : 0;
                  return (
                    <li key={limit.categoryId}>
                      <div className="flex justify-between gap-3 text-sm">
                        <span className="flex items-center gap-2 font-medium">
                          <span
                            className="h-2.5 w-2.5 rounded-full"
                            style={{ backgroundColor: limit.color }}
                          />
                          {limit.categoryName}
                        </span>
                        <span>
                          {plan.currencyCode} {used.toFixed(2)} / {limit.amount.toFixed(2)}
                        </span>
                      </div>
                      <Progress value={Math.min(100, pct)} className="mt-2 h-2" />
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <h3 className="font-display text-lg font-bold">{t.recentExpenses}</h3>
            {expenses.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">{t.noExpenses}</p>
            ) : (
              <ul className="mt-3 divide-y">
                {expenses.slice(0, 6).map((expense) => (
                  <li
                    key={expense.id}
                    className="flex items-center justify-between gap-3 py-3 text-sm"
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-semibold">
                        <MerchantLink expense={expense} fallback={expense.category?.name ?? "—"} />
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(expense.date).toLocaleDateString()}
                      </span>
                    </span>
                    <span className="shrink-0 font-bold">
                      {plan.currencyCode}{" "}
                      {Number(expense.convertedAmount ?? expense.amount).toFixed(2)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: typeof Wallet;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary/10 text-primary">
          <Icon className="h-4 w-4" />
        </span>
        <p className="mt-3 text-xs font-semibold text-muted-foreground">{label}</p>
        <p className="mt-1 text-xl font-extrabold">{value}</p>
        {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
      </CardContent>
    </Card>
  );
}
function EmptyBudget({ t, onCreate }: { t: typeof budgetStrings; onCreate: () => void }) {
  return (
    <div className="surface-card grid min-h-80 place-items-center border-dashed p-8 text-center">
      <div>
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-primary/10 text-primary">
          <Wallet className="h-7 w-7" />
        </span>
        <h2 className="mt-4 font-display text-xl font-bold">{t.noActiveBudget}</h2>
        <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
          {t.noActiveBudgetHint}
        </p>
        <Button className="mt-5" onClick={onCreate}>
          <Plus className="h-4 w-4" />
          {t.createBudget}
        </Button>
      </div>
    </div>
  );
}

function BudgetDialog({
  open,
  onOpenChange,
  categories,
  currencyId,
  currencyCode,
  saving,
  t,
  onSave,
  plan,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: { id: string; name: string; color: string }[];
  currencyId: string;
  currencyCode: string;
  saving: boolean;
  t: typeof budgetStrings;
  onSave: (draft: BudgetDraft) => Promise<void>;
  plan: BudgetPlan | null;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [total, setTotal] = useState("");
  const [limits, setLimits] = useState<Record<string, string>>({});
  const [dailyEnabled, setDailyEnabled] = useState(true);
  const [dailyTime, setDailyTime] = useState("20:00");
  const [threshold80, setThreshold80] = useState(true);
  const [threshold100, setThreshold100] = useState(true);
  const [browserNotifications, setBrowserNotifications] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  useEffect(() => {
    if (!open) return;
    setName(plan?.name ?? "");
    setStartDate(plan?.startDate ?? today);
    setEndDate(plan?.endDate ?? today);
    setTotal(plan ? String(plan.totalAmount) : "");
    setLimits(
      Object.fromEntries(
        (plan?.categoryLimits ?? []).map((limit) => [limit.categoryId, String(limit.amount)]),
      ),
    );
    setDailyEnabled(plan?.reminders.dailyEnabled ?? true);
    setDailyTime(plan?.reminders.dailyTime ?? "20:00");
    setThreshold80(plan?.reminders.threshold80 ?? true);
    setThreshold100(plan?.reminders.threshold100 ?? true);
    setBrowserNotifications(plan?.reminders.browserNotifications ?? false);
    setLocalError(null);
  }, [open, plan, today]);
  async function submit() {
    setLocalError(null);
    if (endDate < startDate) {
      setLocalError(t.invalidDates);
      return;
    }
    if (
      browserNotifications &&
      typeof Notification !== "undefined" &&
      Notification.permission === "default"
    ) {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setBrowserNotifications(false);
        toast.info(t.permissionDenied);
      }
    }
    const categoryLimits: BudgetCategoryLimit[] = categories
      .filter((category) => Number(limits[category.id]) > 0)
      .map((category) => ({
        categoryId: category.id,
        categoryName: category.name,
        color: category.color,
        amount: Number(limits[category.id]),
      }));
    await onSave({
      name: name.trim(),
      startDate,
      endDate,
      totalAmount: Number(total),
      currencyId,
      currencyCode,
      categoryLimits,
      reminders: { dailyEnabled, dailyTime, threshold80, threshold100, browserNotifications },
    });
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{plan ? t.editTrip : t.newBudget}</DialogTitle>
          <DialogDescription>{plan ? t.editTripHint : t.newBudgetHint}</DialogDescription>
        </DialogHeader>
        <div className="space-y-5">
          <div className="space-y-2">
            <Label>{t.tripName}</Label>
            <Input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder={t.tripNamePlaceholder}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>{t.startDate}</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>{t.endDate}</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(event) => setEndDate(event.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>
              {t.totalBudget} ({currencyCode})
            </Label>
            <Input
              type="number"
              min="1"
              step="0.01"
              value={total}
              onChange={(event) => setTotal(event.target.value)}
            />
          </div>
          <div>
            <h3 className="font-semibold">{t.categoryLimits}</h3>
            <p className="text-xs text-muted-foreground">{t.categoryLimitsHint}</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {categories.map((category) => (
                <label
                  key={category.id}
                  className="flex items-center gap-2 rounded-xl border p-2.5"
                >
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: category.color }}
                  />
                  <span className="min-w-0 flex-1 truncate text-sm">{category.name}</span>
                  <Input
                    className="h-8 w-24"
                    type="number"
                    min="0"
                    placeholder="0"
                    value={limits[category.id] ?? ""}
                    onChange={(event) =>
                      setLimits((current) => ({ ...current, [category.id]: event.target.value }))
                    }
                  />
                </label>
              ))}
            </div>
          </div>
          <div>
            <h3 className="font-semibold">{t.reminders}</h3>
            <div className="mt-3 space-y-3 rounded-2xl bg-muted/50 p-4">
              <Setting
                label={t.dailyReminder}
                hint={t.dailyReminderHint}
                checked={dailyEnabled}
                onChange={setDailyEnabled}
              />
              {dailyEnabled && (
                <div className="flex items-center justify-between gap-3">
                  <Label>{t.reminderTime}</Label>
                  <Input
                    className="w-32"
                    type="time"
                    value={dailyTime}
                    onChange={(event) => setDailyTime(event.target.value)}
                  />
                </div>
              )}
              <Setting label={t.threshold80} checked={threshold80} onChange={setThreshold80} />
              <Setting label={t.threshold100} checked={threshold100} onChange={setThreshold100} />
              <Setting
                label={t.browserNotifications}
                hint={t.browserNotificationsHint}
                checked={browserNotifications}
                onChange={setBrowserNotifications}
              />
            </div>
          </div>
          {localError && <p className="text-sm text-destructive">{localError}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            {t.cancel}
          </Button>
          <Button
            onClick={submit}
            disabled={saving || !name.trim() || Number(total) <= 0 || !currencyId}
          >
            {saving ? t.saving : plan ? t.saveChanges : t.saveBudget}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
function Setting({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-sm font-medium">{label}</p>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

function TripDetailsDialog({
  plan,
  translatedName,
  t,
  onOpenChange,
  onEdit,
  onActivate,
  onDuplicate,
}: {
  plan: BudgetPlan | null;
  translatedName?: string;
  t: typeof budgetStrings;
  onOpenChange: (open: boolean) => void;
  onEdit: () => void;
  onActivate: () => void;
  onDuplicate: () => Promise<void>;
}) {
  return (
    <Dialog open={!!plan} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        {plan && (
          <>
            <DialogHeader>
              <DialogTitle>{translatedName ?? plan.name}</DialogTitle>
              <DialogDescription>
                {plan.startDate} - {plan.endDate}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl bg-muted/50 p-4">
                <p className="text-xs text-muted-foreground">{t.totalBudget}</p>
                <p className="mt-1 text-xl font-bold">
                  {plan.currencyCode} {plan.totalAmount.toFixed(2)}
                </p>
              </div>
              <div className="rounded-2xl bg-muted/50 p-4">
                <p className="text-xs text-muted-foreground">{t.status}</p>
                <p className="mt-1 font-bold">
                  {plan.status === "archived"
                    ? t.archived
                    : plan.status === "active"
                      ? t.active
                      : t.completed}
                </p>
              </div>
            </div>
            <div>
              <h3 className="font-semibold">{t.categoryLimits}</h3>
              {plan.categoryLimits.length ? (
                <ul className="mt-2 space-y-2">
                  {plan.categoryLimits.map((limit) => (
                    <li
                      key={limit.categoryId}
                      className="flex justify-between rounded-xl border px-3 py-2 text-sm"
                    >
                      <span className="flex items-center gap-2">
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: limit.color }}
                        />
                        {limit.categoryName}
                      </span>
                      <strong>
                        {plan.currencyCode} {limit.amount.toFixed(2)}
                      </strong>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-1 text-sm text-muted-foreground">{t.noCategoryLimits}</p>
              )}
            </div>
            <div className="rounded-2xl border p-4">
              <h3 className="font-semibold">{t.reminders}</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {plan.reminders.dailyEnabled
                  ? `${t.dailyReminder}: ${plan.reminders.dailyTime}`
                  : t.dailyReminderOff}{" "}
                · {plan.reminders.threshold80 ? "80%" : ""}{" "}
                {plan.reminders.threshold100 ? "100%" : ""}
              </p>
            </div>
            <DialogFooter className="flex-wrap gap-2">
              <Button variant="outline" onClick={onEdit}>
                <Pencil className="h-4 w-4" />
                {t.edit}
              </Button>
              <Button variant="outline" onClick={() => void onDuplicate()}>
                <Copy className="h-4 w-4" />
                {t.duplicate}
              </Button>
              {plan.status !== "active" && (
                <Button onClick={onActivate}>
                  <RotateCcw className="h-4 w-4" />
                  {t.makeActive}
                </Button>
              )}
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
