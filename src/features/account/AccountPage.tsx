// pages/AccountPage.tsx
import { useEffect, useRef, useState } from "react";
import { LogOut, MapPin, Receipt, CreditCard, Trash2 } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";

import { PageHeader } from "@/components/AppLayout";
import { StatCard } from "@/components/StatCard";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { fetchProfile, saveProfile, fetchReferenceData } from "./accountSlice";
import { useAppDispatch, useAppSelector, useTranslations } from "@/app/hooks";
import { interpolate } from "@/lib/i18n";
import { isRtlLanguage } from "@/lib/rtl";
import accountStrings from "@/locales/en/account.json";
import type { CountryPreferences, Profile, SubscriptionStatus } from "./types";
import { fetchTranslation, resetTranslations } from "@/features/i18n/i18nSlice";
import { storeLanguage } from "@/lib/language-preference";
import loginStrings from "@/locales/en/login.json";
import appShellStrings from "@/locales/en/app-shell.json";
import { apiFetch, type ApiResponse } from "@/lib/api-client";
import { logout } from "@/features/auth/authSlice";

// Maps status -> which timestamp on the profile is the relevant one to
// show, and which message key describes it. Trial has no fixed end in the
// sample data (`trialEndsAt: null`) so it falls back to noEndDate rather
// than rendering "Trial ends -".
function getSubscriptionDisplay(
  profile: Profile | null,
  t: typeof accountStrings,
): { statusLabel: string; hint: string } {
  if (!profile) return { statusLabel: "—", hint: "" };

  const status: SubscriptionStatus = profile.subscriptionStatus;
  const format = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString() : null);

  switch (status) {
    case "active": {
      const date = format(profile.subscriptionEndsAt);
      return {
        statusLabel: t.active,
        hint: date ? interpolate(t.renewsOn, { date }) : t.noEndDate,
      };
    }
    case "trial": {
      const date = format(profile.trialEndsAt);
      return {
        statusLabel: t.trial,
        hint: date ? interpolate(t.trialEndsOn, { date }) : t.noEndDate,
      };
    }
    case "expired": {
      const date = format(profile.subscriptionEndsAt);
      return {
        statusLabel: t.expired,
        hint: date ? interpolate(t.expiredOn, { date }) : t.noEndDate,
      };
    }
    case "cancelled":
    case "canceled": {
      const date = format(profile.subscriptionEndsAt);
      return {
        statusLabel: t.canceled,
        hint: date ? interpolate(t.accessUntil, { date }) : t.noEndDate,
      };
    }
    default:
      return { statusLabel: "—", hint: "" };
  }
}

export function AccountPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const t = useTranslations("account", accountStrings);
  const {
    profile,
    currencies,
    countries,
    languages,
    loading,
    referenceLoading,
    saving,
    error,
    profileLoaded,
    referenceLoaded,
  } = useAppSelector((s) => s.account);

  const isRtl = isRtlLanguage(profile?.language?.code);

  const [displayName, setDisplayName] = useState("");
  const [currencyId, setCurrencyId] = useState("");
  const [currentCountryId, setCurrentCountryId] = useState("");
  const [languageId, setLanguageId] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [preferencesLoading, setPreferencesLoading] = useState(false);
  const [preferencesError, setPreferencesError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const preferenceRequest = useRef(0);

  useEffect(() => {
    dispatch(fetchProfile());
    dispatch(fetchReferenceData());
  }, [dispatch]);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.displayName ?? "");
      setCurrencyId(profile.currencyId ?? "");
      setCurrentCountryId(profile.currentCountryId ?? "");
      setLanguageId(profile.languageId ?? "");
    }
  }, [profile]);

  function handlePickPhoto() {
    fileInputRef.current?.click();
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  }

  async function handleSave() {
    try {
      await dispatch(
        saveProfile({
          fields: { displayName, currencyId, currentCountryId, languageId },
          image: imageFile ?? undefined,
        }),
      ).unwrap();

      // The PATCH response may not contain freshly loaded language/currency
      // relations. Refetch only after the save has committed so translation
      // hooks receive the new languageId and request the correct dictionaries.
      await dispatch(fetchProfile()).unwrap();

      const selectedLanguage = languages.find((language) => language.id === languageId);
      if (selectedLanguage) storeLanguage(selectedLanguage);

      // Discard dictionaries and reference lists produced for the previous
      // language. Translation hooks will now repopulate their namespaces
      // using the freshly fetched profile language.
      dispatch(resetTranslations());
      await dispatch(
        fetchTranslation({
          namespace: "login",
          source: loginStrings,
          languageCacheKey: languageId,
        }),
      ).unwrap();
      await dispatch(
        fetchTranslation({
          namespace: "app-shell",
          source: appShellStrings,
          languageCacheKey: languageId,
        }),
      ).unwrap();
      await dispatch(fetchReferenceData()).unwrap();

      setImageFile(null);
      setPreviewUrl(null);
    } catch {
      // accountSlice exposes the request error in the page UI.
    }
  }

  async function handleCountryChange(countryId: string) {
    const requestId = ++preferenceRequest.current;
    setCurrentCountryId(countryId);
    setCurrencyId("");
    setLanguageId("");
    setPreferencesError(null);
    setPreferencesLoading(true);

    try {
      const response = await apiFetch<ApiResponse<CountryPreferences>>(
        `/countries/${countryId}/preferences`,
      );
      if (requestId !== preferenceRequest.current) return;
      if (response.data.currency) setCurrencyId(response.data.currency.id);
      if (response.data.language) setLanguageId(response.data.language.id);
    } catch {
      if (requestId !== preferenceRequest.current) return;
      setPreferencesError(t.preferencesUnavailable);
    } finally {
      if (requestId === preferenceRequest.current) setPreferencesLoading(false);
    }
  }

  function handleCancel() {
    preferenceRequest.current += 1;
    setPreferencesLoading(false);
    setPreferencesError(null);
    if (profile) {
      setDisplayName(profile.displayName ?? "");
      setCurrencyId(profile.currencyId ?? "");
      setCurrentCountryId(profile.currentCountryId ?? "");
      setLanguageId(profile.languageId ?? "");
    }
    setImageFile(null);
    setPreviewUrl(null);
  }

  async function handleDeleteAccount() {
    if (!profile?.email || deleteConfirmation.trim().toLowerCase() !== profile.email.toLowerCase())
      return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await apiFetch("/users/me", {
        method: "DELETE",
        body: JSON.stringify({ confirmEmail: deleteConfirmation.trim() }),
      });
      dispatch(logout());
      navigate({ to: "/login", replace: true });
    } catch (deleteAccountError) {
      setDeleteError(
        deleteAccountError instanceof Error
          ? deleteAccountError.message
          : "Unable to delete account",
      );
      setDeleting(false);
    }
  }

  const initials =
    displayName
      .split(" ")
      .map((p) => p[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "?";

  const { statusLabel, hint: subscriptionHint } = getSubscriptionDisplay(profile, t);

  // True until profile and reference data have both settled (fulfilled OR
  // rejected) at least once — mirrors the isPageLoading gate on the other
  // pages. `saving` is a separate in-place spinner and doesn't affect this.
  const isPageLoading = !profileLoaded || !referenceLoaded;

  if (isPageLoading) {
    return <AccountSkeleton dir={isRtl ? "rtl" : "ltr"} />;
  }

  return (
    <div className="space-y-6 lg:space-y-8" dir={isRtl ? "rtl" : "ltr"}>
      <PageHeader title={t.title} subtitle={t.subtitle} />

      <section className="grid gap-4 sm:grid-cols-2">
        <StatCard
          label={t.currentCurrency}
          value={profile?.currency?.name ?? t.unknown}
          icon={Receipt}
        />
        <StatCard
          label={t.currentCountry}
          value={profile?.currentCountry?.name ?? t.unknown}
          hint={t.europeLisbon}
          icon={MapPin}
        />
      </section>

      <div className="grid gap-4 lg:grid-cols-[1fr_1.6fr] lg:gap-6">
        <div className="surface-card p-6 text-center">
          <Avatar className="mx-auto h-20 w-20">
            {previewUrl || profile?.photoURL ? (
              <AvatarImage src={previewUrl ?? profile?.photoURL} alt={displayName} />
            ) : null}
            <AvatarFallback className="bg-brand text-xl font-extrabold text-primary-foreground">
              {initials}
            </AvatarFallback>
          </Avatar>
          <h2 className="mt-4 font-display text-lg font-bold">{displayName || "—"}</h2>
          <p className="text-sm text-muted-foreground">{profile?.email}</p>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
          <Button variant="outline" className="mt-5 w-full rounded-xl" onClick={handlePickPhoto}>
            {t.changePhoto}
          </Button>
          <Button variant="ghost" className="mt-2 w-full rounded-xl text-destructive">
            <LogOut className="h-4 w-4" />
            {t.logOut}
          </Button>

          {/* Subscription status — replaces the old trips card and the
              plans/checkout section, sourced straight from /users/me. */}
          <div className="mt-5 rounded-xl border border-border p-4 text-start">
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {t.subscription}
              </span>
            </div>
            <p className="mt-2 text-sm font-bold">{statusLabel}</p>
            <p className="text-xs text-muted-foreground">{subscriptionHint}</p>
          </div>
        </div>

        <div className="surface-card p-5 lg:p-6">
          <h2 className="font-display text-lg font-bold">{t.editProfile}</h2>
          {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="displayName">{t.fullName}</Label>
              <Input
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="h-11 rounded-xl"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="email">{t.email}</Label>
              <Input
                id="email"
                type="email"
                value={profile?.email ?? ""}
                disabled
                className="h-11 rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="country">{t.country}</Label>
              <Select
                value={currentCountryId}
                onValueChange={handleCountryChange}
                disabled={referenceLoading}
              >
                <SelectTrigger id="country" className="h-11 rounded-xl">
                  <SelectValue placeholder={t.selectCountry} />
                </SelectTrigger>
                <SelectContent>
                  {countries.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.flag ? `${c.flag} ` : ""}
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency">{t.homeCurrency}</Label>
              <Select
                value={currencyId}
                onValueChange={setCurrencyId}
                disabled={referenceLoading || preferencesLoading || !currentCountryId}
              >
                <SelectTrigger id="currency" className="h-11 rounded-xl">
                  <SelectValue
                    placeholder={preferencesLoading ? t.detectingCurrency : t.selectCurrency}
                  />
                </SelectTrigger>
                <SelectContent>
                  {currencies.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.code} — {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="language">{t.language}</Label>
              <Select
                value={languageId}
                onValueChange={setLanguageId}
                disabled={referenceLoading || preferencesLoading || !currentCountryId}
              >
                <SelectTrigger id="language" className="h-11 rounded-xl">
                  <SelectValue
                    placeholder={preferencesLoading ? t.detectingLanguage : t.selectLanguage}
                  />
                </SelectTrigger>
                <SelectContent>
                  {languages.map((l) => (
                    <SelectItem key={l.id} value={l.id}>
                      {l.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {preferencesError && (
              <p className="rounded-xl bg-amber-500/10 px-3 py-2 text-sm text-amber-700 md:col-span-2 dark:text-amber-300">
                {preferencesError}
              </p>
            )}
          </div>
          <div className="mt-6 flex flex-wrap gap-2">
            <Button
              className="bg-brand rounded-xl shadow-brand"
              onClick={handleSave}
              disabled={
                saving ||
                loading ||
                preferencesLoading ||
                !currentCountryId ||
                !currencyId ||
                !languageId
              }
            >
              {saving ? t.saving : t.saveChanges}
            </Button>
            <Button variant="ghost" className="rounded-xl" onClick={handleCancel} disabled={saving}>
              {t.cancel}
            </Button>
          </div>

          <div className="mt-8 border-t border-destructive/20 pt-6">
            <h3 className="font-display text-base font-bold text-destructive">Delete account</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Permanently deletes your profile, saved data, payments, conversations, and sign-in
              identity.
            </p>
            <AlertDialog
              onOpenChange={(open) => {
                if (!open) {
                  setDeleteConfirmation("");
                  setDeleteError(null);
                }
              }}
            >
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="mt-4 rounded-xl">
                  <Trash2 className="h-4 w-4" /> Delete my account
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete your account permanently?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This cannot be undone. Type <strong>{profile?.email}</strong> to confirm.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <Input
                  type="email"
                  value={deleteConfirmation}
                  onChange={(event) => setDeleteConfirmation(event.target.value)}
                  placeholder={profile?.email ?? "Email"}
                  autoComplete="off"
                />
                {deleteError && <p className="text-sm text-destructive">{deleteError}</p>}
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    disabled={
                      deleting ||
                      !profile?.email ||
                      deleteConfirmation.trim().toLowerCase() !== profile.email.toLowerCase()
                    }
                    onClick={(event) => {
                      event.preventDefault();
                      void handleDeleteAccount();
                    }}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {deleting ? "Deleting…" : "Delete permanently"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>
    </div>
  );
}

function AccountSkeleton({ dir }: { dir: "rtl" | "ltr" }) {
  return (
    <div className="space-y-6 lg:space-y-8" aria-busy="true" aria-label="Loading account" dir={dir}>
      <div className="space-y-2">
        <div className="h-6 w-24 animate-pulse rounded-md bg-muted" />
        <div className="h-4 w-56 animate-pulse rounded-md bg-muted" />
      </div>

      <section className="grid gap-4 sm:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="surface-card space-y-3 p-5">
            <div className="h-4 w-28 animate-pulse rounded-md bg-muted" />
            <div className="h-7 w-24 animate-pulse rounded-md bg-muted" />
            <div className="h-3 w-16 animate-pulse rounded-md bg-muted" />
          </div>
        ))}
      </section>

      <div className="grid gap-4 lg:grid-cols-[1fr_1.6fr] lg:gap-6">
        <div className="surface-card space-y-4 p-6 text-center">
          <div className="mx-auto h-20 w-20 animate-pulse rounded-full bg-muted" />
          <div className="mx-auto h-5 w-32 animate-pulse rounded-md bg-muted" />
          <div className="mx-auto h-4 w-40 animate-pulse rounded-md bg-muted" />
          <div className="h-10 w-full animate-pulse rounded-xl bg-muted" />
          <div className="h-10 w-full animate-pulse rounded-xl bg-muted" />
          <div className="h-20 w-full animate-pulse rounded-xl bg-muted" />
        </div>

        <div className="surface-card p-5 lg:p-6">
          <div className="h-5 w-32 animate-pulse rounded-md bg-muted" />
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className={"space-y-2 " + (i < 2 ? "md:col-span-2" : "")}>
                <div className="h-3.5 w-20 animate-pulse rounded-md bg-muted" />
                <div className="h-11 w-full animate-pulse rounded-xl bg-muted" />
              </div>
            ))}
          </div>
          <div className="mt-6 flex gap-2">
            <div className="h-10 w-32 animate-pulse rounded-xl bg-muted" />
            <div className="h-10 w-24 animate-pulse rounded-xl bg-muted" />
          </div>
        </div>
      </div>
    </div>
  );
}
