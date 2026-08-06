// pages/ForgotPasswordPage.tsx
import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Loader2, Plane } from "lucide-react";

import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
  requestPasswordReset,
  validateResetOtp,
  completePasswordReset,
  resetPasswordFlowReset,
} from "./authSlice";

export function ForgotPasswordPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { step, email, resetPassToken, loading, error } = useAppSelector(
    (s) => s.auth.resetFlow,
  );

  const [emailInput, setEmailInput] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  // Reset local flow state on unmount so a stale step doesn't linger if the
  // user navigates away mid-flow and comes back later.
  useEffect(() => {
    return () => {
      dispatch(resetPasswordFlowReset());
    };
  }, [dispatch]);

  function handleSendCode(event: FormEvent) {
    event.preventDefault();
    dispatch(requestPasswordReset({ email: emailInput }));
  }

  function handleValidateOtp(event: FormEvent) {
    event.preventDefault();
    if (!email) return;
    dispatch(validateResetOtp({ email, otp }));
  }

  function handleResetPassword(event: FormEvent) {
    event.preventDefault();
    setLocalError(null);
    if (newPassword !== confirmPassword) {
      setLocalError("Passwords don't match");
      return;
    }
    if (!email || !resetPassToken) {
      setLocalError("Your reset session is missing or expired. Please request a new code.");
      return;
    }

    dispatch(
      completePasswordReset({
        email,
        newPassword,
        resetPassToken,
      }),
    );
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

          {step === "idle" && (
            <>
              <h1 className="mt-6 font-display text-2xl font-extrabold tracking-tight">
                Reset your password
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Enter your email and we'll send you a code.
              </p>
              <form className="mt-6 space-y-4" onSubmit={handleSendCode}>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="you@example.com"
                    className="h-11 rounded-xl"
                  />
                </div>
                {error && (
                  <p className="rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    {error}
                  </p>
                )}
                <Button
                  type="submit"
                  disabled={loading}
                  className="bg-brand h-11 w-full rounded-xl shadow-brand"
                >
                  {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                  {loading ? "Sending…" : "Send code"}
                </Button>
              </form>
            </>
          )}

          {step === "otp-sent" && (
            <>
              <h1 className="mt-6 font-display text-2xl font-extrabold tracking-tight">
                Check your email
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Enter the 4-digit code we sent to {email}.
              </p>
              <form className="mt-6 space-y-4" onSubmit={handleValidateOtp}>
                <div className="space-y-2">
                  <Label htmlFor="otp">Code</Label>
                  <Input
                    id="otp"
                    inputMode="numeric"
                    maxLength={4}
                    required
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="1234"
                    className="h-11 rounded-xl text-center tracking-[0.5em]"
                  />
                </div>
                {error && (
                  <p className="rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    {error}
                  </p>
                )}
                <Button
                  type="submit"
                  disabled={loading || otp.length !== 4}
                  className="bg-brand h-11 w-full rounded-xl shadow-brand"
                >
                  {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                  {loading ? "Verifying…" : "Verify code"}
                </Button>
              </form>
            </>
          )}

          {step === "otp-verified" && (
            <>
              <h1 className="mt-6 font-display text-2xl font-extrabold tracking-tight">
                Set a new password
              </h1>
              <form className="mt-6 space-y-4" onSubmit={handleResetPassword}>
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    required
                    minLength={6}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="h-11 rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
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
                  disabled={loading}
                  className="bg-brand h-11 w-full rounded-xl shadow-brand"
                >
                  {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                  {loading ? "Saving…" : "Reset password"}
                </Button>
              </form>
            </>
          )}

          {step === "done" && (
            <>
              <h1 className="mt-6 font-display text-2xl font-extrabold tracking-tight">
                Password updated
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                You can now sign in with your new password.
              </p>
              <Button
                className="bg-brand mt-6 h-11 w-full rounded-xl shadow-brand"
                onClick={() => navigate({ to: "/login", replace: true })}
              >
                Back to sign in
              </Button>
            </>
          )}

          {step !== "done" && (
            <p className="mt-6 text-center text-sm text-muted-foreground">
              <Link to="/login" className="font-medium text-primary hover:underline">
                Back to sign in
              </Link>
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
