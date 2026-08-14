import { useEffect } from "react";

import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { fetchNotifications } from "@/features/notifications/notificationsSlice";
import { apiFetch, type ApiResponse } from "@/lib/api-client";
import { getStoredLanguage } from "@/lib/language-preference";

const CHECK_INTERVAL_MS = 60 * 60 * 1000;

type CheckInResult = { recommended: boolean };

export function NearbyGuide() {
  const dispatch = useAppDispatch();
  const userId = useAppSelector((state) => state.account.profile?.id);
  const languageCode = useAppSelector((state) => state.account.profile?.language?.code)
    ?? getStoredLanguage()?.code
    ?? "en";

  useEffect(() => {
    if (!userId || typeof navigator === "undefined" || !("geolocation" in navigator)) return;
    const storageKey = `smarttravel.nearby-check.${userId}`;

    const checkNearby = () => {
      const lastCheck = Number(localStorage.getItem(storageKey) ?? 0);
      if (Date.now() - lastCheck < CHECK_INTERVAL_MS) return;

      navigator.geolocation.getCurrentPosition(
        async ({ coords }) => {
          // Record the attempt only after obtaining a fresh position. A denied
          // permission can therefore be retried after the user enables it.
          localStorage.setItem(storageKey, String(Date.now()));
          try {
            const response = await apiFetch<ApiResponse<CheckInResult>>("/explore/check-in", {
              method: "POST",
              body: JSON.stringify({
                latitude: coords.latitude,
                longitude: coords.longitude,
                accuracy: coords.accuracy,
                languageCode: ["en", "fr", "ar"].includes(languageCode) ? languageCode : "en",
              }),
            });
            if (response.data.recommended) dispatch(fetchNotifications());
          } catch {
            // Nearby discovery is optional and must never interrupt normal app use.
          }
        },
        () => undefined,
        { enableHighAccuracy: false, timeout: 15000, maximumAge: 5 * 60 * 1000 },
      );
    };

    checkNearby();
    const timer = window.setInterval(checkNearby, CHECK_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [dispatch, languageCode, userId]);

  return null;
}
