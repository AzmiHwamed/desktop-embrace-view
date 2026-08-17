import { useEffect } from "react";

import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { fetchNotifications } from "@/features/notifications/notificationsSlice";
import { apiFetch, type ApiResponse } from "@/lib/api-client";
import { getStoredLanguage } from "@/lib/language-preference";
import { getCurrentDeviceLocation } from "@/lib/device-location";

const CHECK_INTERVAL_MS = 60 * 60 * 1000;

type CheckInResult = { recommended: boolean };

export function NearbyGuide() {
  const dispatch = useAppDispatch();
  const userId = useAppSelector((state) => state.account.profile?.id);
  const languageCode =
    useAppSelector((state) => state.account.profile?.language?.code) ??
    getStoredLanguage()?.code ??
    "en";

  useEffect(() => {
    if (!userId) return;
    const storageKey = `smarttravel.nearby-check.${userId}`;

    const checkNearby = () => {
      const lastCheck = Number(localStorage.getItem(storageKey) ?? 0);
      if (Date.now() - lastCheck < CHECK_INTERVAL_MS) return;

      void getCurrentDeviceLocation({
        enableHighAccuracy: false,
        timeout: 15000,
        maximumAge: 5 * 60 * 1000,
      })
        .then(async (location) => {
          // Record the attempt only after obtaining a fresh position. A denied
          // permission can therefore be retried after the user enables it.
          localStorage.setItem(storageKey, String(Date.now()));
          try {
            const response = await apiFetch<ApiResponse<CheckInResult>>("/explore/check-in", {
              method: "POST",
              body: JSON.stringify({
                latitude: location.latitude,
                longitude: location.longitude,
                accuracy: location.accuracy,
                languageCode: ["en", "fr", "ar"].includes(languageCode) ? languageCode : "en",
              }),
            });
            if (response.data.recommended) dispatch(fetchNotifications());
          } catch {
            // Nearby discovery is optional and must never interrupt normal app use.
          }
        })
        .catch(() => undefined);
    };

    checkNearby();
    const timer = window.setInterval(checkNearby, CHECK_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [dispatch, languageCode, userId]);

  return null;
}
