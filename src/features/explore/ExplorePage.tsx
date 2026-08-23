import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Building2,
  Coffee,
  Compass,
  Landmark,
  LocateFixed,
  MapPin,
  Navigation,
  RefreshCw,
  ShoppingBag,
  TreePine,
  Utensils,
} from "lucide-react";

import { useAppSelector, useTranslations } from "@/app/hooks";
import { PageHeader } from "@/components/AppLayout";
import { InlineLoading } from "@/components/Loading";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { isRtlLanguage } from "@/lib/rtl";
import { DeviceLocationError, getAccurateDeviceLocation } from "@/lib/device-location";
import { apiFetch, type ApiResponse } from "@/lib/api-client";
import exploreStrings from "@/locales/en/explore.json";
import type { ExploreCategory, ExplorePlace } from "./types";
import { Link } from "@tanstack/react-router";

const categoryIcons = {
  all: Compass,
  sights: Landmark,
  food: Utensils,
  cafes: Coffee,
  culture: Building2,
  parks: TreePine,
  shopping: ShoppingBag,
};

export function ExplorePage() {
  const t = useTranslations("explore", exploreStrings);
  const profile = useAppSelector((state) => state.account.profile);
  const [position, setPosition] = useState<{
    latitude: number;
    longitude: number;
    accuracy: number;
  } | null>(null);
  const [places, setPlaces] = useState<ExplorePlace[]>([]);
  const [category, setCategory] = useState<ExploreCategory>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isRtl = isRtlLanguage(profile?.language?.code);
  const categories: ExploreCategory[] = [
    "all",
    "sights",
    "food",
    "cafes",
    "culture",
    "parks",
    "shopping",
  ];

  const loadNearby = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const location = await getAccurateDeviceLocation({
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 0,
        desiredAccuracy: 50,
      });
      const current = {
        latitude: location.latitude,
        longitude: location.longitude,
        accuracy: location.accuracy,
      };
      setPosition(current);
      const guest = window.localStorage.getItem("smarttravel.guest") === "true";
      const response = await apiFetch<ApiResponse<{ places: ExplorePlace[] }>>(
        guest ? "/guest/explore/nearby" : "/explore/nearby",
        {
          method: "POST",
          body: JSON.stringify({
            latitude: current.latitude,
            longitude: current.longitude,
            languageCode: profile?.language?.code,
            radius: 10000,
          }),
        },
      );
      setPlaces(response.data.places);
    } catch (reason) {
      setError(
        reason instanceof DeviceLocationError
          ? reason.reason === "insecure"
            ? t.secureLocationError
            : t.locationDenied
          : reason instanceof Error
            ? reason.message
            : t.loadError,
      );
    } finally {
      setLoading(false);
    }
  }, [profile?.language?.code, t.loadError, t.locationDenied, t.secureLocationError]);

  useEffect(() => {
    void loadNearby();
  }, [loadNearby]);
  const visiblePlaces = useMemo(
    () => (category === "all" ? places : places.filter((place) => place.category === category)),
    [category, places],
  );

  return (
    <div className="space-y-6 lg:space-y-8" dir={isRtl ? "rtl" : "ltr"}>
      <PageHeader
        title={t.title}
        subtitle={t.subtitle}
        actions={
          <Button
            variant="outline"
            className="rounded-xl"
            onClick={() => void loadNearby()}
            disabled={loading}
          >
            <LocateFixed className="h-4 w-4" />
            {t.refreshLocation}
          </Button>
        }
      />
      <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary/90 to-violet-600 p-6 text-primary-foreground shadow-brand sm:p-8">
        <div className="max-w-2xl">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white/15">
            <Compass className="h-6 w-6" />
          </span>
          <h2 className="mt-4 font-display text-2xl font-extrabold">{t.heroTitle}</h2>
          <p className="mt-2 text-sm text-white/80">{t.heroHint}</p>
          {position && (
            <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-xs">
              <MapPin className="h-3.5 w-3.5" />
              {t.usingCurrentLocation} · {position.latitude.toFixed(5)},{" "}
              {position.longitude.toFixed(5)} · ±{Math.round(position.accuracy)} m
            </p>
          )}
        </div>
      </section>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {categories.map((value) => {
          const Icon = categoryIcons[value];
          return (
            <button
              key={value}
              onClick={() => setCategory(value)}
              className={`inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${category === value ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
            >
              <Icon className="h-4 w-4" />
              {t[value]}
            </button>
          );
        })}
      </div>
      {loading ? (
        <div className="surface-card grid min-h-64 place-items-center">
          <InlineLoading label={t.searching} />
        </div>
      ) : error ? (
        <div className="surface-card grid min-h-64 place-items-center p-8 text-center">
          <div>
            <MapPin className="mx-auto h-10 w-10 text-destructive" />
            <h2 className="mt-4 font-bold">{t.locationProblem}</h2>
            <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">{error}</p>
            <Button className="mt-5" onClick={() => void loadNearby()}>
              <RefreshCw className="h-4 w-4" />
              {t.tryAgain}
            </Button>
          </div>
        </div>
      ) : visiblePlaces.length === 0 ? (
        <div className="surface-card p-8 text-center text-sm text-muted-foreground">
          {t.noPlaces}
        </div>
      ) : (
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {visiblePlaces.map((place) => {
            const Icon = categoryIcons[place.category];
            return (
              <Card
                key={place.placeId}
                className="group overflow-hidden transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg"
              >
                <div className="relative">
                  <img
                    src={place.photoUri ?? "/place-placeholder.svg"}
                    alt={place.photoUri ? place.name : ""}
                    className="h-44 w-full object-cover"
                    loading="lazy"
                    referrerPolicy="no-referrer"
                    onError={(event) => {
                      event.currentTarget.onerror = null;
                      event.currentTarget.src = "/place-placeholder.svg";
                    }}
                  />
                  {place.photoUri && place.photoAttributions.length > 0 && (
                    <div className="absolute bottom-1 end-1 rounded bg-black/65 px-2 py-1 text-[10px] text-white">
                      {place.photoAttributions.map((attribution, index) =>
                        attribution.uri ? (
                          <a
                            key={`${attribution.displayName ?? "Google user"}-${index}`}
                            href={attribution.uri}
                            target="_blank"
                            rel="noreferrer"
                            className="underline"
                          >
                            {attribution.displayName ?? "Google user"}
                          </a>
                        ) : (
                          <span key={`${attribution.displayName ?? "Google user"}-${index}`}>
                            {attribution.displayName ?? "Google user"}
                          </span>
                        ),
                      )}
                    </div>
                  )}
                </div>
                <CardContent className="p-5">
                  <div className="flex items-start gap-3">
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
                      <Icon className="h-5 w-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate font-display font-bold">{place.name}</h3>
                      <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                        {place.address}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-between gap-3">
                    <span className="text-xs font-semibold text-muted-foreground">
                      {place.distanceMeters < 1000
                        ? `${place.distanceMeters} m`
                        : `${(place.distanceMeters / 1000).toFixed(1)} km`}{" "}
                      {t.away}
                    </span>
                    <Button asChild size="sm" className="rounded-xl">
                      <Link to="/explore/place/$placeId" params={{ placeId: place.placeId }}>
                        <Navigation className="h-4 w-4" /> View place
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </section>
      )}
    </div>
  );
}
