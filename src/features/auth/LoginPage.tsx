import { LegalLinks } from "@/features/legal/LegalPage";
import { ErrorText } from "@/components/ErrorText";
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
                 <img style={{ width: '30px', height: '30px' , borderRadius: '50%' }} src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQnCm1xNfvCva9lLJuoQe6muPjvuJciUyEqmmfps2T-ew&s=10" alt="Facebook" className="h-5 w-5" />
                Google
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-11 rounded-xl"
                onClick={onFacebook}
                disabled={status === "loading"}
              >
                <img style={{ width: '30px', height: '30px' , borderRadius: '50%' }} src="data:image/jpeg;base64,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" alt="Facebook" className="h-5 w-5" />
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
                  <ErrorText message={error} />
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
            <div className="mt-6"><LegalLinks /></div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
