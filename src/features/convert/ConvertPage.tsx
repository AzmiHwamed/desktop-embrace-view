// pages/ConvertPage.tsx
import { useEffect } from "react";
import { ArrowLeftRight, Loader2 } from "lucide-react";

import { PageHeader } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { useAppDispatch, useAppSelector, useTranslations } from "@/app/hooks";
import { interpolate } from "@/lib/i18n";
import { isRtlLanguage } from "@/lib/rtl";
import convertStrings from "@/locales/en/convert.json";

import {
  fetchCurrencies,
  convertCurrency,
  setAmount,
  setFromCurrency,
  setToCurrency,
  swapCurrencies,
} from "./convertSlice";

export function ConvertPage() {
  const dispatch = useAppDispatch();
  const t = useTranslations("convert", convertStrings);

  const {
    amount,
    currencies,
    fromCurrencyId,
    toCurrencyId,
    result,
    loading,
    error,
    currenciesLoaded,
  } = useAppSelector((state) => state.convert);
  const profile = useAppSelector((s) => s.account.profile);

  const isRtl = isRtlLanguage(profile?.language?.code);

  useEffect(() => {
    dispatch(fetchCurrencies());
  }, [dispatch]);

  const fromCurrency = currencies.find((c) => c.id === fromCurrencyId);
  const toCurrency = currencies.find((c) => c.id === toCurrencyId);

  // True until the currencies fetch has settled (fulfilled OR rejected) at
  // least once — mirrors Dashboard's isPageLoading gate.
  const isPageLoading = !currenciesLoaded;

  if (isPageLoading) {
    return <ConvertSkeleton dir={isRtl ? "rtl" : "ltr"} />;
  }

  return (
    <div className="space-y-6 lg:space-y-8" dir={isRtl ? "rtl" : "ltr"}>
      <PageHeader title={t.title} subtitle={t.subtitle} />

      <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr] lg:gap-6">
        <div className="surface-card p-5 lg:p-8">
          <div className="grid gap-4 md:grid-cols-[1fr_auto_1fr] md:items-end">
            {/* FROM */}
            <div className="space-y-2">
              <Label htmlFor="from-amount">{t.youSend}</Label>

              <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2">
                <Input
                  id="from-amount"
                  type="number"
                  value={amount}
                  onChange={(e) => dispatch(setAmount(Number(e.target.value)))}
                  className="h-14 rounded-xl text-lg font-bold"
                />

                <Select
                  value={fromCurrencyId}
                  onValueChange={(value) => dispatch(setFromCurrency(value))}
                >
                  <SelectTrigger className="h-14 w-[110px] rounded-xl font-semibold">
                    <SelectValue placeholder={t.fromPlaceholder} />
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

            {/* SWAP */}
            <Button
              variant="outline"
              size="icon"
              aria-label={t.swapCurrencies}
              className="mx-auto h-12 w-12 shrink-0 rounded-full"
              onClick={() => dispatch(swapCurrencies())}
            >
              <ArrowLeftRight className={"h-4 w-4" + (isRtl ? " scale-x-[-1]" : "")} />
            </Button>

            {/* TO */}
            <div className="space-y-2">
              <Label htmlFor="to-amount">{t.theyReceive}</Label>

              <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2">
                <Input
                  id="to-amount"
                  readOnly
                  value={result ? result.convertedAmount : ""}
                  className="h-14 rounded-xl bg-muted/60 text-lg font-bold"
                />

                <Select
                  value={toCurrencyId}
                  onValueChange={(value) => dispatch(setToCurrency(value))}
                >
                  <SelectTrigger className="h-14 w-[110px] rounded-xl font-semibold">
                    <SelectValue placeholder={t.toPlaceholder} />
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
          </div>

          {/* INFO */}
          <dl className="mt-6 grid gap-3 rounded-xl bg-muted/60 p-4 sm:grid-cols-3">
            <div>
              <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                {t.rate}
              </dt>
              <dd className="text-sm font-semibold">
                {result
                  ? `1 ${result.from.code} = ${result.rate} ${result.to.code}`
                  : "-"}
              </dd>
            </div>

            <div>
              <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                {t.date}
              </dt>
              <dd className="text-sm font-semibold">{result?.date ?? "-"}</dd>
            </div>
          </dl>

          {error && (
            <p className="mt-4 rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}

          <Button
            className="bg-brand mt-6 h-12 w-full rounded-xl text-base shadow-brand"
            onClick={() => dispatch(convertCurrency())}
            disabled={loading || !fromCurrencyId || !toCurrencyId}
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {loading
              ? t.converting
              : interpolate(t.convert, { amount, code: fromCurrency?.code ?? "" })}
          </Button>
        </div>

        {/* SUMMARY CARD */}
        <div className="surface-card p-5">
          <h2 className="font-display text-lg font-bold">{t.currentConversion}</h2>
          <p className="text-sm text-muted-foreground">{t.poweredBy}</p>

          <div className="mt-4 space-y-3">
            <div className="rounded-xl border border-border px-4 py-3">
              <p className="text-xs text-muted-foreground">{t.from}</p>
              <p className="font-semibold">{fromCurrency?.name ?? "-"}</p>
            </div>

            <div className="rounded-xl border border-border px-4 py-3">
              <p className="text-xs text-muted-foreground">{t.to}</p>
              <p className="font-semibold">{toCurrency?.name ?? "-"}</p>
            </div>

            {result && (
              <div className="rounded-xl border border-border px-4 py-3">
                <p className="text-xs text-muted-foreground">{t.convertedAmount}</p>
                <p className="text-lg font-bold">
                  {result.convertedAmount} {result.to.code}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ConvertSkeleton({ dir }: { dir: "rtl" | "ltr" }) {
  // Purely visual placeholders — no translatable text, so only `dir` is
  // threaded through, same reasoning as DashboardSkeleton.
  return (
    <div className="space-y-6 lg:space-y-8" aria-busy="true" aria-label="Loading currency converter" dir={dir}>
      <div className="space-y-2">
        <div className="h-6 w-48 animate-pulse rounded-md bg-muted" />
        <div className="h-4 w-64 animate-pulse rounded-md bg-muted" />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr] lg:gap-6">
        <div className="surface-card p-5 lg:p-8">
          <div className="grid gap-4 md:grid-cols-[1fr_auto_1fr] md:items-end">
            <div className="space-y-2">
              <div className="h-4 w-16 animate-pulse rounded-md bg-muted" />
              <div className="h-14 w-full animate-pulse rounded-xl bg-muted" />
            </div>
            <div className="mx-auto h-12 w-12 shrink-0 animate-pulse rounded-full bg-muted" />
            <div className="space-y-2">
              <div className="h-4 w-24 animate-pulse rounded-md bg-muted" />
              <div className="h-14 w-full animate-pulse rounded-xl bg-muted" />
            </div>
          </div>

          <div className="mt-6 grid gap-3 rounded-xl bg-muted/60 p-4 sm:grid-cols-3">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-3 w-12 animate-pulse rounded-md bg-muted" />
                <div className="h-4 w-28 animate-pulse rounded-md bg-muted" />
              </div>
            ))}
          </div>

          <div className="mt-6 h-12 w-full animate-pulse rounded-xl bg-muted" />
        </div>

        <div className="surface-card p-5">
          <div className="h-5 w-40 animate-pulse rounded-md bg-muted" />
          <div className="mt-2 h-4 w-48 animate-pulse rounded-md bg-muted" />

          <div className="mt-4 space-y-3">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="space-y-2 rounded-xl border border-border px-4 py-3">
                <div className="h-3 w-10 animate-pulse rounded-md bg-muted" />
                <div className="h-4 w-32 animate-pulse rounded-md bg-muted" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
