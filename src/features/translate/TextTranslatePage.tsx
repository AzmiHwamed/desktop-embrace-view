import { useEffect, useState } from "react";
import { Languages, Loader2, X } from "lucide-react";

import { useAppSelector, useTranslations } from "@/app/hooks";
import { PageHeader } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Language } from "@/features/account/types";
import { apiFetch, type ApiResponse } from "@/lib/api-client";
import { isRtlLanguage } from "@/lib/rtl";
import strings from "@/locales/en/text-translate.json";

type TranslationPayload = { translation?: string } | string;

function translatedText(payload: TranslationPayload): string | null {
  if (typeof payload === "string") return payload;
  return payload.translation ?? null;
}

export function TextTranslatePage() {
  const t = useTranslations("text-translate", strings);
  const isGuest = useAppSelector((state) => state.auth.isGuest);
  const profile = useAppSelector((state) => state.account.profile);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [source, setSource] = useState("");
  const [translation, setTranslation] = useState("");
  const [target, setTarget] = useState(profile?.language?.name ?? "English");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isRtl = isRtlLanguage(profile?.language?.code);

  useEffect(() => {
    let cancelled = false;
    apiFetch<ApiResponse<Language[]>>("/languages")
      .then((response) => {
        if (!cancelled) setLanguages(response.data);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  async function translate() {
    if (!source.trim()) {
      setError(t.emptyText);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await apiFetch<ApiResponse<TranslationPayload>>(
        isGuest ? "/guest/translation/text" : "/translation/text",
        {
          method: "POST",
          body: JSON.stringify({ text: source, target }),
        },
      );
      const result = translatedText(response.data);
      if (!result) throw new Error("No translation returned");
      setTranslation(result);
    } catch {
      setError(t.translationFailed);
    } finally {
      setLoading(false);
    }
  }

  function clear() {
    setSource("");
    setTranslation("");
    setError(null);
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 lg:space-y-8" dir={isRtl ? "rtl" : "ltr"}>
      <PageHeader title={t.title} subtitle={t.subtitle} />

      <section className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
        <div className="flex flex-wrap items-center gap-3 border-b border-border bg-muted/30 px-5 py-4 sm:px-6">
          <span className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground">
            <Languages className="h-4 w-4 text-primary" />
            {t.detectLanguage}
          </span>
          <span className="hidden text-muted-foreground sm:inline">→</span>
          <div className="min-w-44">
            <Select value={target} onValueChange={setTarget}>
              <SelectTrigger className="h-9 rounded-lg bg-background text-sm">
                <SelectValue placeholder={t.translateTo} />
              </SelectTrigger>
              <SelectContent>
                {(languages.length ? languages.map((language) => language.name) : ["English"]).map(
                  (name) => (
                    <SelectItem key={name} value={name}>
                      {name}
                    </SelectItem>
                  ),
                )}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid divide-y divide-border md:grid-cols-2 md:divide-x md:divide-y-0">
          <div className="p-5 sm:p-6">
            <textarea
              value={source}
              onChange={(event) => setSource(event.target.value)}
              placeholder={t.sourcePlaceholder}
              className="min-h-56 w-full resize-none bg-transparent text-lg outline-none placeholder:text-muted-foreground"
              aria-label={t.sourcePlaceholder}
            />
          </div>
          <div className="min-h-56 bg-muted/30 p-5 sm:p-6">
            <p
              className={
                translation ? "whitespace-pre-wrap text-lg" : "text-lg text-muted-foreground"
              }
            >
              {translation || t.translationPlaceholder}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-5 py-4 sm:px-6">
          <div>{error && <p className="text-sm text-destructive">{error}</p>}</div>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={clear} disabled={!source && !translation}>
              <X className="h-4 w-4" />
              {t.clear}
            </Button>
            <Button onClick={() => void translate()} disabled={loading} className="rounded-xl">
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Languages className="h-4 w-4" />
              )}
              {loading ? t.translating : t.translate}
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
