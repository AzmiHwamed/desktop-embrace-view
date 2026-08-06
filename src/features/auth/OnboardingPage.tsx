// pages/OnboardingPage.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Plane } from "lucide-react";

import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { fetchReferenceData, saveProfile } from "@/features/account/accountSlice";
import { fetchCurrentUser } from "@/features/auth/authSlice";

export function OnboardingPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const { currencies, countries, languages, referenceLoading, saving, error } = useAppSelector(
    (s) => s.account,
  );

  const [currencyId, setCurrencyId] = useState("");
  const [currentCountryId, setCurrentCountryId] = useState("");
  const [languageId, setLanguageId] = useState("");

  useEffect(() => {
    dispatch(fetchReferenceData());
  }, [dispatch]);

  const canSubmit = currencyId && currentCountryId && languageId && !saving;

  async function handleContinue() {
    const result = await dispatch(
      saveProfile({ fields: { currencyId, currentCountryId, languageId } }),
    );
    if (saveProfile.fulfilled.match(result)) {
      // Keep auth.user (used by isProfileComplete elsewhere) in sync too,
      // since saveProfile only updates the account slice's profile.
      await dispatch(fetchCurrentUser());
      navigate({ to: "/", replace: true });
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <Card className="w-full max-w-md rounded-2xl border-border shadow-sm">
        <CardContent className="p-6 sm:p-8">
          <div className="flex items-center gap-3">
            <span className="bg-brand grid h-10 w-10 place-items-center rounded-xl text-primary-foreground shadow-brand">
              <Plane className="h-5 w-5" />
            </span>
            <span className="font-display text-lg font-extrabold tracking-tight">SmartTravel</span>
          </div>

          <h1 className="mt-6 font-display text-2xl font-extrabold tracking-tight">
            A few quick details
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            This helps us show prices and dates the way you expect.
          </p>

          <div className="mt-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currency">Home currency</Label>
              <Select value={currencyId} onValueChange={setCurrencyId} disabled={referenceLoading}>
                <SelectTrigger id="currency" className="h-11 rounded-xl">
                  <SelectValue placeholder="Select currency" />
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
              <Label htmlFor="country">Country</Label>
              <Select value={currentCountryId} onValueChange={setCurrentCountryId} disabled={referenceLoading}>
                <SelectTrigger id="country" className="h-11 rounded-xl">
                  <SelectValue placeholder="Select country" />
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
              <Label htmlFor="language">Language</Label>
              <Select value={languageId} onValueChange={setLanguageId} disabled={referenceLoading}>
                <SelectTrigger id="language" className="h-11 rounded-xl">
                  <SelectValue placeholder="Select language" />
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

            {error && (
              <p className="rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            )}

            <Button
              className="bg-brand h-11 w-full rounded-xl shadow-brand"
              disabled={!canSubmit}
              onClick={handleContinue}
            >
              {saving ? "Saving…" : "Continue"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}