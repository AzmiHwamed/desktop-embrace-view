import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Plane, ShieldAlert, Trash2 } from "lucide-react";

import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ErrorText } from "@/components/ErrorText";
import { fetchProfile } from "@/features/account/accountSlice";
import { logout } from "@/features/auth/authSlice";
import { apiFetch } from "@/lib/api-client";
import { LegalLinks } from "@/features/legal/LegalPage";

/**
 * Public account-deletion URL for app-store requirements. A signed-in user can
 * complete deletion here; signed-out visitors are sent to sign in first.
 */
export function DeleteAccountPage() {
  const dispatch = useAppDispatch();
  const { token, isGuest } = useAppSelector((state) => state.auth);
  const profile = useAppSelector((state) => state.account.profile);
  const [confirmation, setConfirmation] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isSignedIn = Boolean(token) && !isGuest;

  useEffect(() => {
    if (isSignedIn && !profile) void dispatch(fetchProfile());
  }, [dispatch, isSignedIn, profile]);

  async function deleteAccount() {
    if (!profile?.email || confirmation.trim().toLowerCase() !== profile.email.toLowerCase())
      return;

    setDeleting(true);
    setError(null);
    try {
      await apiFetch("/users/me", {
        method: "DELETE",
        body: JSON.stringify({ confirmEmail: confirmation.trim() }),
      });
      dispatch(logout());
      window.location.replace("/login");
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Unable to delete account.");
      setDeleting(false);
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground" lang="en" dir="ltr">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-5 py-5 sm:px-8">
          <Link to="/" className="flex items-center gap-2 font-display text-lg font-bold">
            <Plane className="h-5 w-5 text-primary" /> SmartTravel
          </Link>
          <LegalLinks />
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-5 py-10 sm:px-8 sm:py-14">
        <Card className="border-destructive/30">
          <CardContent className="p-6 sm:p-8">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-destructive/10 text-destructive">
              <ShieldAlert className="h-6 w-6" />
            </span>
            <h1 className="mt-5 font-display text-3xl font-bold tracking-tight">
              Delete your SmartTravel account
            </h1>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Deleting your account is permanent. Your profile, saved travel data, receipts,
              conversations, payment records, and sign-in identity will be deleted. This action
              cannot be undone.
            </p>

            {!isSignedIn ? (
              <div className="mt-7 rounded-xl border border-border bg-muted/30 p-5">
                <h2 className="font-semibold">Sign in to continue</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  For your security, sign in to the account you want to delete. You will return here
                  to confirm the deletion.
                </p>
                <Button asChild className="mt-4 rounded-xl">
                  <a href="/login?redirect=/delete-account">Sign in to delete account</a>
                </Button>
              </div>
            ) : !profile ? (
              <p className="mt-7 text-sm text-muted-foreground">Loading your account details…</p>
            ) : (
              <div className="mt-7 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="delete-confirmation">
                    Type <strong>{profile.email}</strong> to confirm
                  </Label>
                  <Input
                    id="delete-confirmation"
                    type="email"
                    autoComplete="off"
                    value={confirmation}
                    onChange={(event) => setConfirmation(event.target.value)}
                    placeholder={profile.email}
                  />
                </div>
                {error && (
                  <p className="text-sm text-destructive">
                    <ErrorText message={error} />
                  </p>
                )}
                <Button
                  variant="destructive"
                  className="rounded-xl"
                  disabled={
                    deleting || confirmation.trim().toLowerCase() !== profile.email.toLowerCase()
                  }
                  onClick={() => void deleteAccount()}
                >
                  <Trash2 className="h-4 w-4" />{" "}
                  {deleting ? "Deleting account…" : "Delete account permanently"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
      <footer className="border-t border-border px-5 py-7">
        <LegalLinks />
      </footer>
    </div>
  );
}
