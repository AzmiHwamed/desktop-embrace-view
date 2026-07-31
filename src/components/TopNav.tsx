import { Link, useNavigate } from "@tanstack/react-router";
import { Bell, LogOut, Plus, Search, ScanLine } from "lucide-react";

import { useAppDispatch } from "@/app/hooks";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { logout } from "@/features/auth/authSlice";

export function TopNav({ isAuthenticated = false }: { isAuthenticated?: boolean }) {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const handleSignOut = () => {
    dispatch(logout());
    navigate({ to: "/login", replace: true });
  };

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-background/85 backdrop-blur">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 sm:gap-4 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <SidebarTrigger className="shrink-0" />
          <div className="relative hidden min-w-0 flex-1 md:block lg:max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search receipts, currencies, trips…"
              className="h-10 rounded-xl border-border bg-muted/60 pl-9"
            />
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Button asChild variant="ghost" size="icon" className="rounded-xl md:hidden">
            <Link to="/scan" aria-label="Scan receipt">
              <ScanLine className="h-4 w-4" />
            </Link>
          </Button>
          <Button asChild className="bg-brand hidden rounded-xl shadow-brand md:inline-flex">
            <Link to="/scan">
              <Plus className="h-4 w-4" />
              New scan
            </Link>
          </Button>
          <Button asChild variant="ghost" size="icon" className="relative rounded-xl">
            <Link to="/notifications" aria-label="Notifications">
              <Bell className="h-4 w-4" />
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-destructive" />
            </Link>
          </Button>

          {isAuthenticated ? (
            <>
              <Link to="/account" className="flex min-w-0 items-center gap-2 rounded-xl px-1 py-1">
                <Avatar className="h-9 w-9 shrink-0">
                  <AvatarFallback className="bg-accent text-accent-foreground text-xs font-bold">
                    AL
                  </AvatarFallback>
                </Avatar>
                <span className="hidden min-w-0 lg:block">
                  <span className="block truncate text-sm font-semibold leading-tight">
                    Alex Lang
                  </span>
                  <span className="block truncate text-xs text-muted-foreground">Lisbon · EUR</span>
                </span>
              </Link>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-xl"
                aria-label="Sign out"
                onClick={handleSignOut}
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <Button asChild variant="outline" className="rounded-xl">
              <Link to="/login">Sign in</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
