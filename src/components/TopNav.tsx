// components/TopNav.tsx
import { Link } from "@tanstack/react-router";
import { Bell, LogOut, Plus, Search, ScanLine, Coins, MapPin, ReceiptText, Luggage } from "lucide-react";

import { useAppDispatch, useAppSelector, useTranslations } from "@/app/hooks";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { logout } from "@/features/auth/authSlice";
import { useEffect, useRef, useState } from "react";
import { fetchProfile } from "@/features/account/accountSlice";
import { isRtlLanguage } from "@/lib/rtl";
import topNavStrings from "@/locales/en/topnav.json";
import { apiFetch, type ApiResponse } from "@/lib/api-client";

type SearchResults = {
  receipts: Array<{ id: string; title: string; subtitle: string | null }>;
  places: Array<{ id: string; title: string; subtitle: string | null; googlePlaceId: string | null }>;
  trips: Array<{ id: string; title: string; subtitle: string | null; startDate: string; endDate: string }>;
};

export function TopNav({ isAuthenticated = false }: { isAuthenticated?: boolean }) {
  const dispatch = useAppDispatch();
  const t = useTranslations("topnav", topNavStrings);
  const isGuest = useAppSelector((s) => s.auth.isGuest);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults | null>(null);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState(false);
  const searchBoxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isGuest) dispatch(fetchProfile());
  }, [dispatch, isGuest]);
  const {
    profile,
  } = useAppSelector((s) => s.account);

  const isRtl = isRtlLanguage(profile?.language?.code);

  useEffect(() => {
    const term = query.trim();
    if (isGuest || term.length < 2) {
      setResults(null);
      setSearching(false);
      setSearchError(false);
      return;
    }

    let cancelled = false;
    const timer = window.setTimeout(async () => {
      setSearching(true);
      setSearchError(false);
      try {
        const response = await apiFetch<ApiResponse<SearchResults>>(`/search?q=${encodeURIComponent(term)}`);
        if (!cancelled) setResults(response.data);
      } catch {
        if (!cancelled) {
          setResults(null);
          setSearchError(true);
        }
      } finally {
        if (!cancelled) setSearching(false);
      }
    }, 250);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [query, isGuest]);

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (!searchBoxRef.current?.contains(event.target as Node)) setResults(null);
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  const hasResults = Boolean(results && (results.receipts.length || results.places.length || results.trips.length));

  const handleSignOut = () => {
    dispatch(logout());
    // Use a document navigation here instead of depending on the client router
    // after its auth/session state has been torn down.
    window.location.replace("/login");
  };


  return (
    <header className="sticky top-0 z-20 border-b border-border bg-background/85 backdrop-blur">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 sm:gap-4 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <SidebarTrigger className="shrink-0" />
          <div ref={searchBoxRef} className="relative hidden min-w-0 flex-1 md:block lg:max-w-md">
            <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t.searchPlaceholder}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onFocus={() => query.trim().length >= 2 && results && setResults(results)}
              className="h-10 rounded-xl border-border bg-muted/60 ps-9"
            />
            {(searching || hasResults || searchError) && (
              <div className="absolute inset-x-0 top-[calc(100%+0.5rem)] z-50 overflow-hidden rounded-xl border border-border bg-popover p-2 shadow-lg">
                {searching && <p className="px-3 py-2 text-sm text-muted-foreground">{t.searching}</p>}
                {!searching && hasResults && results && (
                  <SearchResultGroups results={results} onSelect={() => { setQuery(""); setResults(null); }} labels={t} />
                )}
                {!searching && !hasResults && (searchError || query.trim().length >= 2) && (
                  <p className="px-3 py-2 text-sm text-muted-foreground">{t.noSearchResults}</p>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {profile && (
            <Link
              to="/tokens"
              className={
                "hidden items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-xs font-semibold sm:flex " +
                "border-border bg-muted/60 text-muted-foreground"
              }
              title="AI tokens available"
            >
              <Coins className="h-3.5 w-3.5 shrink-0" />
              <span className="whitespace-nowrap">
                {profile.tokenBalance ?? 0} tokens
              </span>
            </Link>
          )}

          <Button asChild variant="ghost" size="icon" className="rounded-xl md:hidden">
            <Link to="/scan" aria-label={t.scanReceipt}>
              <ScanLine className="h-4 w-4" />
            </Link>
          </Button>
          <Button asChild className="bg-brand hidden rounded-xl shadow-brand md:inline-flex">
            <Link to="/scan">
              <Plus className="h-4 w-4" />
              {t.newScan}
            </Link>
          </Button>
          <Button asChild variant="ghost" size="icon" className="relative rounded-xl">
            <Link to="/notifications" aria-label={t.notifications}>
              <Bell className="h-4 w-4" />
              {/* Unread-dot position: right-2/top-2 is a physical corner
                  pinned to the bell icon's own box, not the page edge, so it
                  doesn't need an isRtl swap — the icon and its dot move
                  together as one unit regardless of where the button sits
                  in the (already-mirroring) flex row. */}
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-destructive" />
            </Link>
          </Button>

          {isAuthenticated && !isGuest ? (
            <>
              <Link to="/account" className="flex min-w-0 items-center gap-2 rounded-xl px-1 py-1">
                <Avatar className="h-9 w-9 shrink-0">
                  {profile?.photoURL ? (
                    <img src={profile?.photoURL ?? ""} alt="User avatar" />
                  ) : (
                    <AvatarFallback className="bg-accent text-accent-foreground text-xs font-bold">
                      AL
                    </AvatarFallback>
                  )}
                </Avatar>
                <span className="hidden min-w-0 lg:block">
                  <span className="block truncate text-sm font-semibold leading-tight">
                    {profile?.displayName}
                  </span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {profile?.currentCountry?.name ?? t.unknown} · {profile?.currency?.code ?? t.unknown}
                  </span>
                </span>
              </Link>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-xl"
                aria-label={t.signOut}
                onClick={handleSignOut}
              >
                <LogOut className={"h-4 w-4" + (isRtl ? " scale-x-[-1]" : "")} />
              </Button>
            </>
          ) : (
            <Button asChild variant="outline" className="rounded-xl">
              <Link to="/login">{t.signIn}</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}

function SearchResultGroups({
  results,
  onSelect,
  labels,
}: {
  results: SearchResults;
  onSelect: () => void;
  labels: Record<string, string>;
}) {
  const groups = [
    { label: labels.receipts, icon: ReceiptText, items: results.receipts, to: "/history" as const },
    { label: labels.places, icon: MapPin, items: results.places, to: "/explore" as const },
    { label: labels.trips, icon: Luggage, items: results.trips, to: "/budgets" as const },
  ];

  return (
    <div className="max-h-80 overflow-y-auto">
      {groups.filter((group) => group.items.length).map((group) => (
        <section key={group.label} className="py-1">
          <p className="px-3 py-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{group.label}</p>
          {group.items.map((item) => (
            <Link
              key={item.id}
              to={group.to}
              onClick={onSelect}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-muted"
            >
              <group.icon className="h-4 w-4 shrink-0 text-primary" />
              <span className="min-w-0">
                <span className="block truncate font-medium">{item.title}</span>
                {item.subtitle && <span className="block truncate text-xs text-muted-foreground">{item.subtitle}</span>}
              </span>
            </Link>
          ))}
        </section>
      ))}
    </div>
  );
}
