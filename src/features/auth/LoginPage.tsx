// pages/LoginPage.tsx
import { Link } from "@tanstack/react-router";
import { Loader2, Plane } from "lucide-react";
import { useState, type FormEvent } from "react";

import { useAppDispatch, useAppSelector, useTranslations } from "@/app/hooks";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { clearAuthError, continueAsGuest, login, loginWithProvider } from "./authSlice";
import { usePostAuthRedirect } from "./usePostAuthRedirect";
import loginStrings from "@/locales/en/login.json";
import { getStoredLanguage } from "@/lib/language-preference";
import { isRtlLanguage } from "@/lib/rtl";

export function LoginPage() {
  const dispatch = useAppDispatch();
  const { status, error } = useAppSelector((s) => s.auth);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const t = useTranslations("login", loginStrings);
  const isRtl = isRtlLanguage(getStoredLanguage()?.code);

  usePostAuthRedirect();

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    dispatch(clearAuthError());
    dispatch(login({ email, password }));
  };

  const onGoogle = () => {
    dispatch(clearAuthError());
    dispatch(loginWithProvider("google.com"));
  };

  const onFacebook = () => {
    dispatch(clearAuthError());
    dispatch(loginWithProvider("facebook.com"));
  };

  const onGuest = () => {
    dispatch(continueAsGuest());
    window.location.assign("/scan");
  };

  return (
    <div className="grid min-h-screen w-full bg-background lg:grid-cols-2" dir={isRtl ? "rtl" : "ltr"}>
      <div className="bg-night hidden flex-col justify-between p-10 text-sidebar-primary-foreground lg:flex">
        <div className="flex items-center gap-3">
          <span className="bg-brand grid h-10 w-10 place-items-center rounded-xl text-primary-foreground shadow-brand">
            <Plane className="h-5 w-5" />
          </span>
          <span className="font-display text-lg font-extrabold tracking-tight">SmartTravel</span>
        </div>
        <div>
          <h2 className="font-display text-4xl font-extrabold leading-tight tracking-tight">
            {t.heroTitle}
          </h2>
          <p className="mt-4 max-w-md text-sm opacity-70">
            {t.heroSubtitle}
          </p>
        </div>
        <p className="text-xs opacity-60">© 2026 SmartTravel</p>
      </div>

      <div className="flex items-center justify-center px-4 py-12 sm:px-8">
        <Card className="w-full max-w-md rounded-2xl border-border shadow-sm">
          <CardContent className="p-6 sm:p-8">
            <h1 className="font-display text-2xl font-extrabold tracking-tight">{t.welcome}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {t.subtitle}
            </p>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <Button
                type="button"
                variant="outline"
                className="h-11 rounded-xl"
                onClick={onGoogle}
                disabled={status === "loading"}
              >
                Google
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-11 rounded-xl"
                onClick={onFacebook}
                disabled={status === "loading"}
              >
                Facebook
              </Button>
            </div>

            <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
              <span className="h-px flex-1 bg-border" />
              {t.or}
              <span className="h-px flex-1 bg-border" />
            </div>

            <form className="space-y-4" onSubmit={onSubmit}>
              <div className="space-y-2">
                <Label htmlFor="email">{t.email}</Label>
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
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">{t.password}</Label>
                  <Link
                    to="/forgot-password"
                    className="text-xs font-medium text-primary hover:underline"
                  >
                    {t.forgotPassword}
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
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
                disabled={status === "loading"}
                className="bg-brand h-11 w-full rounded-xl shadow-brand"
              >
                {status === "loading" && <Loader2 className="h-4 w-4 animate-spin" />}
                {status === "loading" ? t.signingIn : t.signIn}
              </Button>
              <Button type="button" variant="outline" className="h-11 w-full rounded-xl" onClick={onGuest}>
                Continue as guest
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-muted-foreground">
              {t.noAccount}{" "}
              <Link to="/signup" className="font-medium text-primary hover:underline">
                {t.signUp}
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
