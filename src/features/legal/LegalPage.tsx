import { Link } from "@tanstack/react-router";
import { ArrowLeft, FileText, ShieldCheck, Plane } from "lucide-react";
import { useEffect, useState } from "react";
import { legalDetails, legalDocuments, legalLinkStrings, legalPageStrings } from "./legal-content";
import { useAppDispatch, useAppSelector, useTranslatedData } from "@/app/hooks";
import { saveProfile } from "@/features/account/accountSlice";
import type { Language } from "@/features/account/types";
import { resetTranslations } from "@/features/i18n/i18nSlice";
import { getStoredLanguage, storeLanguage } from "@/lib/language-preference";
import { isRtlLanguage } from "@/lib/rtl";
import { apiFetch, type ApiResponse } from "@/lib/api-client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function LegalLinks() {
  const t = useTranslatedData("legal-links", legalLinkStrings);

  return (
    <nav
      aria-label="Legal"
      className="flex flex-wrap justify-center gap-x-5 gap-y-2 text-xs text-muted-foreground"
    >
      <Link
        to="/terms"
        className="underline-offset-4 hover:text-foreground hover:underline focus-visible:underline"
      >
        {t.termsOfService}
      </Link>
      <Link
        to="/privacy"
        className="underline-offset-4 hover:text-foreground hover:underline focus-visible:underline"
      >
        {t.privacyPolicy}
      </Link>
    </nav>
  );
}

export function LegalPage({ document }: { document: keyof typeof legalDocuments }) {
  const dispatch = useAppDispatch();
  const documents = useTranslatedData("legal", legalDocuments);
  const t = useTranslatedData("legal-page", legalPageStrings);
  const profile = useAppSelector((state) => state.account.profile);
  const storedLanguage = getStoredLanguage();
  const [languages, setLanguages] = useState<Language[]>([]);
  const [languagesLoading, setLanguagesLoading] = useState(true);
  const [selectedLanguageId, setSelectedLanguageId] = useState(
    profile?.language?.id ?? storedLanguage?.id ?? "",
  );
  const selectedLanguage =
    languages.find((language) => language.id === selectedLanguageId) ??
    profile?.language ??
    storedLanguage;
  const languageCode = selectedLanguage?.code ?? "en";
  const isRtl = isRtlLanguage(languageCode);
  const content = documents[document];
  const Icon = document === "privacy" ? ShieldCheck : FileText;

  useEffect(() => {
    let cancelled = false;

    apiFetch<ApiResponse<Language[]>>("/languages")
      .then((response) => {
        if (!cancelled) setLanguages(response.data);
      })
      .catch(() => {
        if (!cancelled) setLanguages([]);
      })
      .finally(() => {
        if (!cancelled) setLanguagesLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const languageId = profile?.language?.id ?? getStoredLanguage()?.id ?? "";
    setSelectedLanguageId(languageId);
  }, [profile?.language?.id]);

  const handleLanguageChange = (languageId: string) => {
    const language = languages.find((item) => item.id === languageId);
    if (!language) return;

    setSelectedLanguageId(languageId);
    storeLanguage(language);
    dispatch(resetTranslations());

    if (profile && profile.languageId !== languageId) {
      void dispatch(saveProfile({ fields: { languageId } }));
    }
  };

  return (
    <div
      className="min-h-screen bg-background text-foreground"
      lang={languageCode}
      dir={isRtl ? "rtl" : "ltr"}
    >
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-5 py-5 sm:px-8">
          <Link to="/" className="flex items-center gap-2 font-display text-lg font-bold">
            <Plane className="h-5 w-5 text-primary" />
            SmartTravel
          </Link>
          <div className="flex flex-wrap items-center justify-end gap-3">
            <div className="min-w-40">
              <label htmlFor="legal-language" className="sr-only">
                {t.language}
              </label>
              <Select
                value={selectedLanguageId}
                onValueChange={handleLanguageChange}
                disabled={languagesLoading || languages.length === 0}
              >
                <SelectTrigger id="legal-language" className="h-9 rounded-lg text-xs">
                  <SelectValue placeholder={t.selectLanguage} />
                </SelectTrigger>
                <SelectContent>
                  {languages.map((language) => (
                    <SelectItem key={language.id} value={language.id}>
                      {language.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <LegalLinks />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-5 py-10 sm:px-8 sm:py-14">
        <Link
          to="/login"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          {t.backToSignIn}
        </Link>
        <div className="mb-9 mt-8 max-w-2xl">
          <span className="mb-5 grid h-12 w-12 place-items-center rounded-2xl bg-accent text-primary">
            <Icon className="h-6 w-6" />
          </span>
          <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
            {content.title}
          </h1>
          <p className="mt-3 text-base text-muted-foreground">{content.description}</p>
          <p className="mt-4 text-xs text-muted-foreground">
            {t.lastUpdated.replace("{date}", legalDetails.updated)}
          </p>
          {legalDetails.draft && (
            <p className="mt-5 rounded-xl border border-border bg-muted/50 p-4 text-sm text-muted-foreground">
              {t.draftNotice}
            </p>
          )}
        </div>
        <div className="grid items-start gap-10 lg:grid-cols-[210px_minmax(0,1fr)]">
          <nav
            aria-label="On this page"
            className="rounded-2xl border border-border bg-card p-5 lg:sticky lg:top-8"
          >
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t.onThisPage}
            </p>
            <ol className="space-y-3 text-sm">
              {content.sections.map((section, index) => (
                <li key={section.id}>
                  <a href={`#${section.id}`} className="text-muted-foreground hover:text-primary">
                    {index + 1}. {section.title}
                  </a>
                </li>
              ))}
              <li>
                <a href="#contact" className="text-muted-foreground hover:text-primary">
                  {t.contact}
                </a>
              </li>
            </ol>
          </nav>
          <article className="min-w-0 space-y-9">
            {content.sections.map((section, index) => (
              <section key={section.id} id={section.id} className="scroll-mt-8">
                <h2 className="font-display text-xl font-semibold">
                  {index + 1}. {section.title}
                </h2>
                {section.paragraphs.map((paragraph) => (
                  <p key={paragraph} className="mt-3 text-sm leading-7 text-muted-foreground">
                    {paragraph}
                  </p>
                ))}
              </section>
            ))}
            <section
              id="contact"
              className="scroll-mt-8 rounded-2xl border border-border bg-card p-6"
            >
              <h2 className="font-display text-xl font-semibold">{t.contact}</h2>
              <p className="mt-3 text-sm">
                {legalDetails.operatorName} {t.support}
                {legalDetails.country ? ` · ${legalDetails.country}` : ""}
              </p>
              {legalDetails.contactEmail && (
                <a
                  className="mt-3 block text-sm text-primary underline"
                  href={`mailto:${legalDetails.contactEmail}`}
                >
                  {legalDetails.contactEmail}
                </a>
              )}
              <p className="mt-3 text-sm text-muted-foreground">
                {t.inAppSupportPrefix}{" "}
                <Link to="/chat" className="text-primary underline underline-offset-4">
                  {t.inAppSupport}
                </Link>
                {t.inAppSupportSuffix}
              </p>
            </section>
          </article>
        </div>
      </main>
      <footer className="border-t border-border px-5 py-7">
        <LegalLinks />
      </footer>
    </div>
  );
}
