// pages/SignupPage.tsx
import { Link } from "@tanstack/react-router";
import { Loader2, Plane } from "lucide-react";
import { useState, type FormEvent } from "react";

import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { clearAuthError, continueAsGuest, register, loginWithProvider } from "./authSlice";
import { usePostAuthRedirect } from "./usePostAuthRedirect";

export function SignupPage() {
  const dispatch = useAppDispatch();
  const { status, error } = useAppSelector((s) => s.auth);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  // register/oauth both land here — same completeness check sends brand-new
  // signups to /onboarding since they've never set currency/country/language.
  usePostAuthRedirect();

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    setLocalError(null);
    dispatch(clearAuthError());

    if (password !== confirmPassword) {
      setLocalError("Passwords don't match");
      return;
    }
    dispatch(register({ email, password }));
  };

  return (
    <div className="grid min-h-screen w-full bg-background lg:grid-cols-2">
      <div className="bg-night hidden flex-col justify-between p-10 text-sidebar-primary-foreground lg:flex">
        <div className="flex items-center gap-3">
          <span className="bg-brand grid h-10 w-10 place-items-center rounded-xl text-primary-foreground shadow-brand">
            <Plane className="h-5 w-5" />
          </span>
          <span className="font-display text-lg font-extrabold tracking-tight">SmartTravel</span>
        </div>
        <div>
          <h2 className="font-display text-4xl font-extrabold leading-tight tracking-tight">
            Start tracking your trip spending today.
          </h2>
        </div>
        <p className="text-xs opacity-60">© 2026 SmartTravel</p>
      </div>

      <div className="flex items-center justify-center px-4 py-12 sm:px-8">
        <Card className="w-full max-w-md rounded-2xl border-border shadow-sm">
          <CardContent className="p-6 sm:p-8">
            <h1 className="font-display text-2xl font-extrabold tracking-tight">Create your account</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              We'll ask for your currency, country and language next.
            </p>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <Button
                type="button"
                variant="outline"
                className="h-11 rounded-xl"
                onClick={() => dispatch(loginWithProvider("google.com"))}
                disabled={status === "loading"}
              >
                Google
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-11 rounded-xl"
                onClick={() => dispatch(loginWithProvider("facebook.com"))}
                disabled={status === "loading"}
              >
                Facebook
              </Button>
            </div>

            <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
              <span className="h-px flex-1 bg-border" />
              or
              <span className="h-px flex-1 bg-border" />
            </div>

            <form className="space-y-4" onSubmit={onSubmit}>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="h-11 rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="h-11 rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="h-11 rounded-xl"
                />
              </div>

              {(localError || error) && (
                <p className="rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {localError ?? error}
                </p>
              )}

              <Button
                type="submit"
                disabled={status === "loading"}
                className="bg-brand h-11 w-full rounded-xl shadow-brand"
              >
                {status === "loading" && <Loader2 className="h-4 w-4 animate-spin" />}
                {status === "loading" ? "Creating account…" : "Create account"}
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link to="/login" className="font-medium text-primary hover:underline">
                Sign in
              </Link>
            </p>
            <Button
              type="button"
              variant="ghost"
              className="mt-3 w-full rounded-xl"
              onClick={() => {
                dispatch(continueAsGuest());
                window.location.assign("/scan");
              }}
            >
              Continue as guest
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
