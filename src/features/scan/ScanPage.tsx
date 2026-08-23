// pages/ScanPage.tsx
import {
  Check,
  ScanLine,
  Upload,
  FileText,
  Languages,
  UtensilsCrossed,
  Loader2,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";

import { useEffect, useRef, useState } from "react";

import { PageHeader } from "@/components/AppLayout";
import { BrandLoader, InlineLoading } from "@/components/Loading";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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

import { useAppDispatch, useAppSelector, useTranslations } from "@/app/hooks";
import { isRtlLanguage } from "@/lib/rtl";
import { getCurrentDeviceLocation } from "@/lib/device-location";
import scanStrings from "@/locales/en/scan.json";

import { SaveToHistoryModal } from "./SaveToHistoryModal";
import { MerchantMatcher } from "./MerchantMatcher";
import { CameraCaptureDialog } from "./CameraCaptureDialog";
import type { MerchantCandidate } from "./merchant-types";

import {
  fileSelected,
  extractReceipt,
  translateReceipt,
  setTargetLanguage,
  getReceiptRecommendations,
  clearScanErrors,
} from "./scanSlice";
import type { ScanErrorCode } from "./types";

const MENU_DOCUMENT_TYPES = new Set(["menu", "restaurant menu"]);

function formatAmount(value: number | string | null | undefined): string {
  if (value === null || value === undefined) return "-";
  const num = typeof value === "number" ? value : Number(value);
  if (Number.isNaN(num)) return "-";
  return num.toFixed(2);
}

export function ScanPage() {
  const dispatch = useAppDispatch();
  const inputRef = useRef<HTMLInputElement>(null);
  const lastFileRef = useRef<File | null>(null);
  const t = useTranslations("scan", scanStrings);

  const {
    result,
    status,
    error,
    fileName,
    targetLanguage,
    translatedResult,
    translationStatus,
    translationError,
    errorCode,
    translationErrorCode,
    showTranslated,
  } = useAppSelector((state) => state.scan);
  const profile = useAppSelector((s) => s.account.profile);
  const isGuest = useAppSelector((s) => s.auth.isGuest);
  const homeCurrencyCode = useAppSelector((state) => state.account.profile?.currency?.code);
  const languages = useAppSelector((state) => state.account.languages);

  const isRtl = isRtlLanguage(profile?.language?.code);

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [matchedMerchant, setMatchedMerchant] = useState<MerchantCandidate | null>(null);
  const [cameraOpen, setCameraOpen] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setPageLoading(false), 350);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  async function getOptionalScanLocation() {
    try {
      const position = await getCurrentDeviceLocation({
        enableHighAccuracy: true,
        timeout: 8000,
        maximumAge: 60000,
      });
      return {
        latitude: position.latitude,
        longitude: position.longitude,
        accuracy: position.accuracy,
      };
    } catch {
      // Location is enrichment only. OCR extraction must continue if the user
      // denies access, location times out, or the device cannot provide it.
      return undefined;
    }
  }

  async function upload(file: File) {
    setMatchedMerchant(null);
    lastFileRef.current = file;
    if (previewUrl) URL.revokeObjectURL(previewUrl);

    const isPdf = file.type === "application/pdf";
    setPreviewUrl(isPdf ? null : URL.createObjectURL(file));

    dispatch(fileSelected(file.name));
    const location = await getOptionalScanLocation();
    dispatch(extractReceipt({ file, location }));
  }

  function openSaveModal() {
    if (!result) return;
    // Kick off recommendations as soon as the modal opens so the fields
    // can populate while the user is still looking at the receipt.
    dispatch(getReceiptRecommendations(result.id));
    setIsSaveModalOpen(true);
  }

  const isMenu = result ? MENU_DOCUMENT_TYPES.has(result.documentType) : false;
  const isScanning = status === "uploading";
  const isTranslating = translationStatus === "translating";
  const activeErrorCode = errorCode ?? translationErrorCode;
  const isTranslationFailure = !errorCode && !!translationErrorCode;

  const errorDescriptions: Record<ScanErrorCode, string> = {
    network: t.errorNetwork,
    timeout: t.errorTimeout,
    unavailable: t.errorUnavailable,
    rateLimit: t.errorRateLimit,
    invalidFile: t.errorInvalidFile,
    server: t.errorServer,
    unknown: t.errorUnknown,
  };

  function retryFailedAction() {
    if (isTranslationFailure) {
      dispatch(translateReceipt(targetLanguage));
    } else if (lastFileRef.current) {
      void getOptionalScanLocation().then((location) => {
        if (lastFileRef.current) dispatch(extractReceipt({ file: lastFileRef.current, location }));
      });
    }
  }

  function chooseAnotherFile() {
    dispatch(clearScanErrors());
    if (inputRef.current) inputRef.current.value = "";
    inputRef.current?.click();
  }

  const hasConversion = (receipt: typeof result) =>
    !!receipt &&
    receipt.convertedTotal !== undefined &&
    receipt.convertedTotal !== null &&
    !!homeCurrencyCode &&
    receipt.currency !== homeCurrencyCode;

  // Displayed record is the translated one once available and toggled on —
  // both share the same shape, so the rest of the render code doesn't
  // change based on which is active.
  const display = showTranslated && translatedResult ? translatedResult : result;

  function renderName(
    originalValue: string | null | undefined,
    translatedValue: string | null | undefined,
  ) {
    const showingTranslated = showTranslated && translatedResult;
    if (!showingTranslated || translatedValue === originalValue) {
      return <span className="font-semibold">{originalValue ?? "-"}</span>;
    }
    return (
      <span className="flex flex-col">
        <span className="font-semibold">{translatedValue}</span>
        <span className="text-xs font-normal text-muted-foreground">{originalValue}</span>
      </span>
    );
  }

  return (
    <div className="space-y-6 lg:space-y-8" dir={isRtl ? "rtl" : "ltr"}>
      <style>{`
        @keyframes scan-sweep {
          0% { top: -4%; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 104%; opacity: 0; }
        }
        .scan-sweep-line {
          animation: scan-sweep 1.8s ease-in-out infinite;
        }
      `}</style>

      <PageHeader
        title={t.title}
        subtitle={t.subtitle}
        actions={
          <Button
            className="bg-brand rounded-xl shadow-brand"
            onClick={() => setCameraOpen(true)}
            disabled={isScanning}
          >
            <ScanLine className="h-4 w-4" />
            {t.startCamera}
          </Button>
        }
      />

      {pageLoading ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <Skeleton className="h-[280px] rounded-2xl" />
          <Skeleton className="h-[280px] rounded-2xl" />
        </div>
      ) : (
        <div className="grid items-start gap-4 lg:grid-cols-2">
          <div className="surface-card sticky top-20 flex flex-col items-center justify-center gap-4 border-dashed p-8 text-center">
            {previewUrl ? (
              <div className="relative w-full overflow-hidden rounded-2xl">
                <img
                  src={previewUrl}
                  alt={fileName ?? "Receipt preview"}
                  className="max-h-[320px] w-full rounded-2xl object-contain"
                />

                {isScanning && (
                  <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
                    <div className="absolute inset-0 bg-black/10" />
                    {/* Sweep is a top→bottom animation (see keyframes above),
                        not left→right, so it needs no RTL handling. */}
                    <div className="scan-sweep-line absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-brand to-transparent shadow-[0_0_16px_4px_var(--color-primary)]" />
                  </div>
                )}
              </div>
            ) : (
              <span className="bg-brand grid h-16 w-16 place-items-center rounded-2xl text-primary-foreground">
                <Upload />
              </span>
            )}

            <h2 className="font-display text-lg font-bold">
              {previewUrl ? fileName : t.dropReceiptHere}
            </h2>

            {!previewUrl && <p className="text-sm text-muted-foreground">{t.fileHint}</p>}

            <input
              ref={inputRef}
              type="file"
              accept="image/*,.pdf"
              hidden
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) upload(file);
              }}
            />

            <Button
              variant="outline"
              className="rounded-xl"
              onClick={() => inputRef.current?.click()}
              disabled={isScanning}
            >
              {previewUrl ? t.uploadDifferentFile : t.browseFiles}
            </Button>

            {fileName && !previewUrl && <Badge>{fileName}</Badge>}
          </div>

          <div
            className="surface-card flex max-h-[calc(100vh-8rem)] flex-col overflow-hidden"
            aria-busy={isScanning || isTranslating}
          >
            <div className="flex shrink-0 justify-between border-b p-5">
              <div className="flex gap-3">
                <FileText />
                <div>
                  <h2 className="font-bold">
                    {isScanning ? (
                      <span className="inline-flex items-center gap-2">
                        <BrandLoader size="sm" />
                        {t.extracting}
                      </span>
                    ) : (
                      renderName(result?.merchant, translatedResult?.merchant)
                    )}
                  </h2>
                  <p className="text-xs text-muted-foreground">{result?.language ?? "-"}</p>
                </div>
              </div>

              {isTranslating ? (
                <InlineLoading label={t.translating} />
              ) : (
                status === "done" && (
                  <Badge>
                    <Check className="h-3 w-3" />
                    {t.extracted}
                  </Badge>
                )
              )}
            </div>

            {!isScanning && result && !isMenu && (
              <MerchantMatcher
                receipt={result}
                selected={matchedMerchant}
                languageCode={profile?.language?.code}
                onSelect={setMatchedMerchant}
              />
            )}

            <div className="overflow-y-auto">
              {isScanning && (
                <div className="space-y-3 p-5">
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              )}

              {!isScanning && result && display && (
                <>
                  {isMenu ? (
                    <>
                      <div className="grid grid-cols-[2fr_3fr_1fr] gap-3 bg-muted p-4 text-xs font-bold">
                        <span>{t.dish}</span>
                        <span>{t.description}</span>
                        {/* text-end, not text-right: right-aligns to the
                            physical right in RTL (wrong side); text-end
                            follows `dir` and lands on the reading "end". */}
                        <span className="text-end">{t.price}</span>
                      </div>
                      <ul>
                        {result.items?.map((item, idx) => {
                          const translatedItem = translatedResult?.items?.[idx];
                          return (
                            <li
                              key={item.id}
                              className="grid grid-cols-[2fr_3fr_1fr] gap-3 border-b px-5 py-4 text-sm"
                            >
                              <span className="flex items-center gap-2">
                                <UtensilsCrossed className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                                {renderName(item.name, translatedItem?.name)}
                              </span>
                              <span className="text-muted-foreground">
                                {showTranslated && translatedResult
                                  ? (translatedItem?.description ?? item.description ?? "-")
                                  : (item.description ?? "-")}
                              </span>
                              <span className="text-end font-bold">
                                {formatAmount(item.unitPrice ?? item.totalPrice)}
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                    </>
                  ) : (
                    <>
                      <div className="grid grid-cols-4 gap-3 bg-muted p-4 text-xs font-bold">
                        <span>{t.item}</span>
                        <span>{t.qty}</span>
                        <span>{t.price}</span>
                        <span>{t.total}</span>
                      </div>
                      <ul>
                        {result.items?.map((item, idx) => {
                          const translatedItem = translatedResult?.items?.[idx];
                          return (
                            <li
                              key={item.id}
                              className="grid grid-cols-4 gap-3 border-b px-5 py-4 text-sm"
                            >
                              {renderName(item.name, translatedItem?.name)}
                              <span>{item.quantity}</span>
                              <span>
                                {formatAmount(item.unitPrice) + " " + result.currency}
                                {hasConversion(result) && (
                                  <span className="block text-xs text-muted-foreground">
                                    ≈ {formatAmount(item.convertedUnitPrice)} {homeCurrencyCode}
                                  </span>
                                )}
                              </span>
                              <span className="font-bold">
                                {formatAmount(item.totalPrice) + " " + result.currency}
                                {hasConversion(result) && (
                                  <span className="block text-xs font-normal text-muted-foreground">
                                    ≈ {formatAmount(item.convertedTotalPrice)} {homeCurrencyCode}
                                  </span>
                                )}
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                      <div className="flex justify-between border-t bg-muted/40 p-5">
                        <span className="font-semibold">{t.total}</span>
                        <span className="text-end font-bold">
                          {formatAmount(result.total)} {result.currency}
                          {hasConversion(result) && (
                            <span className="block text-xs font-normal text-muted-foreground">
                              ≈ {formatAmount(result.convertedTotal)} {homeCurrencyCode}
                            </span>
                          )}
                        </span>
                      </div>
                    </>
                  )}
                </>
              )}

              {!isScanning && !result && !error && (
                <p className="p-5 text-sm text-muted-foreground">{t.emptyState}</p>
              )}
            </div>

            <div className="flex shrink-0 flex-wrap items-center gap-2 border-t p-5">
              {!isGuest && (
                <Button disabled={!result} onClick={openSaveModal}>
                  {t.saveToHistory}
                </Button>
              )}

              <Select
                value={targetLanguage}
                onValueChange={(v) => dispatch(setTargetLanguage(v))}
                disabled={!result || isTranslating}
              >
                <SelectTrigger className="h-9 w-[150px] rounded-xl">
                  <SelectValue placeholder={t.languagePlaceholder} />
                </SelectTrigger>
                <SelectContent>
                  {(languages.length > 0
                    ? languages.map((l) => l.name)
                    : ["English", "French", "Spanish", "Arabic", "Japanese"]
                  ).map((name) => (
                    <SelectItem key={name} value={name}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                className="rounded-xl"
                disabled={!result || isTranslating}
                onClick={() => dispatch(translateReceipt(targetLanguage))}
              >
                {isTranslating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Languages className="h-4 w-4" />
                )}
                {isTranslating ? t.translating : t.translate}
              </Button>
            </div>
          </div>
        </div>
      )}

      {result && (
        <SaveToHistoryModal
          open={isSaveModalOpen}
          onOpenChange={setIsSaveModalOpen}
          receipt={
            matchedMerchant
              ? { ...result, merchant: matchedMerchant.name, address: matchedMerchant.address }
              : result
          }
          matchedMerchant={matchedMerchant}
        />
      )}

      <CameraCaptureDialog
        open={cameraOpen}
        onOpenChange={setCameraOpen}
        onCapture={(file) => void upload(file)}
      />

      <Dialog
        open={!!activeErrorCode}
        onOpenChange={(open) => {
          if (!open) dispatch(clearScanErrors());
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <span className="mb-2 grid h-12 w-12 place-items-center rounded-2xl bg-destructive/10 text-destructive">
              <AlertTriangle className="h-6 w-6" />
            </span>
            <DialogTitle>
              {isTranslationFailure ? t.translationErrorTitle : t.scanErrorTitle}
            </DialogTitle>
            <DialogDescription>
              {activeErrorCode ? errorDescriptions[activeErrorCode] : t.errorUnknown}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:flex-wrap">
            <Button variant="ghost" onClick={() => dispatch(clearScanErrors())}>
              {t.dismiss}
            </Button>
            {!isTranslationFailure && (
              <Button variant="outline" onClick={chooseAnotherFile}>
                <Upload className="h-4 w-4" />
                {t.chooseAnotherFile}
              </Button>
            )}
            <Button
              onClick={retryFailedAction}
              disabled={!isTranslationFailure && !lastFileRef.current}
            >
              <RefreshCw className="h-4 w-4" />
              {t.retry}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
