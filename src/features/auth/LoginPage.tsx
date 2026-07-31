import { useNavigate } from "@tanstack/react-router";
import { Plane } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";

import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { clearAuthError, login } from "./authSlice";

export function LoginPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { status, error } = useAppSelector((s) => s.auth);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (status === "authenticated") {
      navigate({ to: "/", replace: true });
    }
  }, [status, navigate]);

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    dispatch(clearAuthError());
    dispatch(login({ email, password }));
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
            Every receipt, rate and expense — in one workspace.
          </h2>
          <p className="mt-4 max-w-md text-sm opacity-70">
            Scan receipts in any language, convert currencies live and keep your trip budget on
            track.
          </p>
        </div>
        <p className="text-xs opacity-60">© 2026 SmartTravel</p>
      </div>

      <div className="flex items-center justify-center px-4 py-12 sm:px-8">
        <Card className="w-full max-w-md rounded-2xl border-border shadow-sm">
          <CardContent className="p-6 sm:p-8">
            <h1 className="font-display text-2xl font-extrabold tracking-tight">Welcome back</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Sign in to your SmartTravel account.
            </p>

            <form className="mt-6 space-y-4" onSubmit={onSubmit}>
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
                {status === "loading" ? "Signing in…" : "Sign in"}
              </Button>
            </form>

            <p className="mt-6 text-center text-xs text-muted-foreground">
              Authenticates against your API at http://localhost:3000/auth/login
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
