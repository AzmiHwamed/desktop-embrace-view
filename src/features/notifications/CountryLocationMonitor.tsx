import { useEffect } from "react";

import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { fetchNotifications } from "@/features/notifications/notificationsSlice";
import { apiFetch, type ApiResponse } from "@/lib/api-client";
import { getCurrentDeviceLocation } from "@/lib/device-location";

const CHECK_INTERVAL_MS = 12 * 60 * 60 * 1000;

type ReverseGeocodeResult = {
  countryCode?: string;
};

type CountryCheckResult = {
  matches: boolean;
};

export function CountryLocationMonitor() {
  const dispatch = useAppDispatch();
  const userId = useAppSelector((state) => state.account.profile?.id);

  useEffect(() => {
    if (!userId) return;

    const storageKey = `smarttravel.country-check.${userId}`;
    const lastCheck = Number(localStorage.getItem(storageKey) ?? 0);
    if (Date.now() - lastCheck < CHECK_INTERVAL_MS) return;

    void getCurrentDeviceLocation({
      enableHighAccuracy: false,
      timeout: 15000,
      maximumAge: 10 * 60 * 1000,
    })
      .then(async (deviceLocation) => {
        try {
          const query = new URLSearchParams({
            latitude: String(deviceLocation.latitude),
            longitude: String(deviceLocation.longitude),
            localityLanguage: "en",
          });
          const locationResponse = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?${query}`,
          );
          if (!locationResponse.ok) return;

          const reverseGeocode = (await locationResponse.json()) as ReverseGeocodeResult;
          if (!reverseGeocode.countryCode) return;

          const response = await apiFetch<ApiResponse<CountryCheckResult>>(
            "/notifications/check-country",
            {
              method: "POST",
              body: JSON.stringify({ detectedCountryCode: reverseGeocode.countryCode }),
            },
          );

          localStorage.setItem(storageKey, String(Date.now()));
          if (!response.data.matches) dispatch(fetchNotifications());
        } catch {
          // Location detection is optional and must not interrupt app startup.
        }
      })
      .catch(() => undefined);
  }, [dispatch, userId]);

  return null;
}
