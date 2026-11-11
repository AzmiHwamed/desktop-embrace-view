import { ErrorText } from "@/components/ErrorText";
// pages/AccountPage.tsx
import { useEffect, useRef, useState } from "react";
import { Check, ChevronsUpDown, LogOut, MapPin, Receipt, Coins, Trash2 } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";

import { PageHeader } from "@/components/AppLayout";
import { StatCard } from "@/components/StatCard";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
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
import { isRtlLanguage } from "@/lib/rtl";
import accountStrings from "@/locales/en/account.json";
import type { CountryPreferences } from "./types";
import { fetchTranslation, resetTranslations } from "@/features/i18n/i18nSlice";
import { storeLanguage } from "@/lib/language-preference";
import loginStrings from "@/locales/en/login.json";
import appShellStrings from "@/locales/en/app-shell.json";
import { apiFetch, type ApiResponse } from "@/lib/api-client";
import { logout } from "@/features/auth/authSlice";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

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

  const [displayName, setDisplayName] = useState("");
  const [currencyId, setCurrencyId] = useState("");
  const [currentCountryId, setCurrentCountryId] = useState("");
  const [countryPickerOpen, setCountryPickerOpen] = useState(false);
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
  const selectedLanguageCode = languages.find((language) => language.id === languageId)?.code;
  // Preview direction as soon as a language is selected, before the profile
  // is saved and fetched again.
  const isRtl = isRtlLanguage(selectedLanguageCode ?? profile?.language?.code);
  const selectedCountry = countries.find((country) => country.id === currentCountryId);

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

  function handleLogout() {
    dispatch(logout());
    // A document navigation is reliable even while logout remounts the app's
    // authenticated layout and invalidates in-flight requests.
    window.location.replace("/login");
  }

  const initials =
    displayName
      .split(" ")
      .map((p) => p[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "?";


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

      <div className="grid gap-4 lg:grid-cols-[1fr_1.6fr] lg:gap-6 rtl:lg:grid-cols-[1.6fr_1fr]">
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
          <Button
            type="button"
            variant="ghost"
            className="mt-2 w-full rounded-xl text-destructive"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" />
            {t.logOut}
          </Button>

          {/* Token wallet is sourced from /users/me and is authoritative on the server. */}
          <div className="mt-5 rounded-xl border border-border p-4 text-start">
            <div className="flex items-center gap-2">
              <Coins className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                AI token wallet
              </span>
            </div>
            <p className="mt-2 text-2xl font-bold">{profile?.tokenBalance ?? 0} tokens</p>
            <p className="text-xs text-muted-foreground">Tokens are used when you run an AI service.</p>
            <Button
              type="button"
              size="sm"
              className="mt-3 w-full rounded-lg"
              onClick={() => navigate({ to: "/tokens" })}
            >
              <Coins className="h-4 w-4" />
              View token deals & charge wallet
            </Button>
          </div>
        </div>

        <div className="surface-card p-5 lg:p-6">
          <h2 className="font-display text-lg font-bold">{t.editProfile}</h2>
          {error && (
            <p className="mt-2 text-sm text-destructive">
              <ErrorText message={error} />
            </p>
          )}
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
                dir="ltr"
                className="h-11 rounded-xl text-left"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="country">{t.country}</Label>
              <Popover open={countryPickerOpen} onOpenChange={setCountryPickerOpen}>
                <PopoverTrigger asChild>
                  <Button
                    id="country"
                    type="button"
                    variant="outline"
                    role="combobox"
                    aria-expanded={countryPickerOpen}
                    disabled={referenceLoading}
                    className="h-11 w-full justify-between rounded-xl px-3 font-normal"
                  >
                    <span className="truncate">
                      {selectedCountry ? `${selectedCountry.flag ? `${selectedCountry.flag} ` : ""}${selectedCountry.name}` : t.selectCountry}
                    </span>
                    <ChevronsUpDown className="ms-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search country or code…" />
                    <CommandList>
                      <CommandEmpty>No countries found.</CommandEmpty>
                      <CommandGroup>
                        {countries.map((country) => (
                          <CommandItem
                            key={country.id}
                            value={`${country.name} ${country.alpha2Code} ${country.alpha3Code}`}
                            onSelect={() => {
                              handleCountryChange(country.id);
                              setCountryPickerOpen(false);
                            }}
                          >
                            <span className="w-7 text-base">{country.flag ?? "🌐"}</span>
                            <span className="min-w-0 flex-1 truncate">{country.name}</span>
                            <span className="text-xs text-muted-foreground">{country.alpha2Code}</span>
                            <Check className={cn("h-4 w-4", currentCountryId === country.id ? "opacity-100" : "opacity-0")} />
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency">{t.homeCurrency}</Label>
              <Select
                dir={isRtl ? "rtl" : "ltr"}
                value={currencyId}
                onValueChange={setCurrencyId}
                disabled={referenceLoading || preferencesLoading || !currentCountryId}
              >
                <SelectTrigger id="currency" className="h-11 rounded-xl">
                  <SelectValue
                    placeholder={preferencesLoading ? t.detectingCurrency : t.selectCurrency}
                  />
                </SelectTrigger>
                <SelectContent dir={isRtl ? "rtl" : "ltr"}>
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
                dir={isRtl ? "rtl" : "ltr"}
                value={languageId}
                onValueChange={setLanguageId}
                disabled={referenceLoading || preferencesLoading || !currentCountryId}
              >
                <SelectTrigger id="language" className="h-11 rounded-xl">
                  <SelectValue
                    placeholder={preferencesLoading ? t.detectingLanguage : t.selectLanguage}
                  />
                </SelectTrigger>
                <SelectContent dir={isRtl ? "rtl" : "ltr"}>
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
                <ErrorText message={preferencesError} />
              </p>
            )}
          </div>
          <div className="mt-6 flex flex-wrap gap-2 text-start">
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

                <Button onClick={() => { navigate({ to: "/delete-account" }); }} variant="destructive" className="mt-4 rounded-xl">
                  <Trash2 className="h-4 w-4" /> Delete my account
                </Button>
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
                {deleteError && (
                  <p className="text-sm text-destructive">
                    <ErrorText message={deleteError} />
                  </p>
                )}
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
