import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import type { MerchantCandidate, MerchantMatchResult } from "./merchant-types";

const inputSchema = z.object({
  merchantName: z.string().trim().min(2).max(160),
  receiptAddress: z.string().trim().max(300).nullable().optional(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  languageCode: z.string().trim().min(2).max(10).optional(),
});

type GooglePlace = {
  id?: string;
  displayName?: { text?: string };
  formattedAddress?: string;
  location?: { latitude?: number; longitude?: number };
  googleMapsUri?: string;
  primaryType?: string;
};

type GoogleErrorPayload = {
  error?: {
    code?: number;
    message?: string;
    status?: string;
    details?: Array<{ reason?: string }>;
  };
};

function googlePlacesError(status: number, payload: GoogleErrorPayload) {
  const googleStatus = payload.error?.status;
  const reason = payload.error?.details?.find((detail) => detail.reason)?.reason;
  const detail = `${googleStatus ?? ""} ${reason ?? ""} ${payload.error?.message ?? ""}`.toLowerCase();

  if (status === 429 || detail.includes("quota")) {
    return "Google Places quota was exceeded. Check quota and billing in Google Cloud.";
  }
  if (detail.includes("api_key_invalid") || detail.includes("invalid api key")) {
    return "The Google Places API key is invalid. Create or rotate the server key in Google Cloud.";
  }
  if (detail.includes("billing") || detail.includes("billing_not_active")) {
    return "Google Maps billing is not enabled for this project.";
  }
  if (detail.includes("service_disabled") || detail.includes("has not been used") || detail.includes("not enabled")) {
    return "Places API (New) is not enabled for the Google Cloud project.";
  }
  if (status === 403 || googleStatus === "PERMISSION_DENIED") {
    return "Google rejected this Places key. Check its Places API restriction and VPS IP restriction.";
  }
  if (status === 400 || googleStatus === "INVALID_ARGUMENT") {
    return "Google rejected the merchant search request. Check the extracted merchant and location values.";
  }
  return "Unable to search nearby establishments. Check the SmartTravel server logs for the Google error.";
}

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase()
    .replace(/[^a-z0-9\u0600-\u06ff]+/g, " ")
    .trim();
}

function similarity(left: string, right: string) {
  const a = new Set(normalize(left).split(" ").filter(Boolean));
  const b = new Set(normalize(right).split(" ").filter(Boolean));
  if (!a.size || !b.size) return 0;
  const intersection = [...a].filter((token) => b.has(token)).length;
  return intersection / new Set([...a, ...b]).size;
}

function distanceMeters(lat1: number, lon1: number, lat2: number, lon2: number) {
  const toRadians = (value: number) => value * Math.PI / 180;
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const value = Math.sin(dLat / 2) ** 2
    + Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLon / 2) ** 2;
  return 6371000 * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
}

export const matchReceiptMerchant = createServerFn({ method: "POST" })
  .validator((input: unknown) => inputSchema.parse(input))
  .handler(async ({ data }): Promise<MerchantMatchResult> => {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) throw new Error("Google Maps API key is not configured on the server.");

    const response = await fetch("https://places.googleapis.com/v1/places:searchText", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress,places.location,places.googleMapsUri,places.primaryType",
      },
      body: JSON.stringify({
        textQuery: [data.merchantName, data.receiptAddress].filter(Boolean).join(" "),
        pageSize: 5,
        languageCode: data.languageCode?.slice(0, 2),
        locationBias: {
          circle: {
            center: { latitude: data.latitude, longitude: data.longitude },
            radius: 5000,
          },
        },
      }),
    });

    if (!response.ok) {
      const responseText = await response.text();
      let payload: GoogleErrorPayload = {};
      try {
        payload = JSON.parse(responseText) as GoogleErrorPayload;
      } catch {
        // Preserve the raw response in the server log only.
      }
      console.error("Google Places search failed", {
        status: response.status,
        googleStatus: payload.error?.status,
        reason: payload.error?.details?.find((detail) => detail.reason)?.reason,
        message: payload.error?.message ?? responseText.slice(0, 300),
      });
      throw new Error(googlePlacesError(response.status, payload));
    }

    const payload = await response.json() as { places?: GooglePlace[] };
    const candidates = (payload.places ?? []).flatMap((place): MerchantCandidate[] => {
      const latitude = place.location?.latitude;
      const longitude = place.location?.longitude;
      const name = place.displayName?.text;
      if (!place.id || !name || latitude == null || longitude == null) return [];
      const distance = distanceMeters(data.latitude, data.longitude, latitude, longitude);
      const nameScore = similarity(data.merchantName, name);
      const addressScore = data.receiptAddress ? similarity(data.receiptAddress, place.formattedAddress ?? "") : 0;
      const distanceScore = Math.max(0, 1 - distance / 5000);
      const confidence = Math.round(Math.min(1, nameScore * 0.65 + distanceScore * 0.25 + addressScore * 0.1) * 100);
      return [{
        placeId: place.id,
        name,
        address: place.formattedAddress ?? "",
        latitude,
        longitude,
        distanceMeters: Math.round(distance),
        confidence,
        googleMapsUri: place.googleMapsUri ?? null,
        primaryType: place.primaryType ?? null,
      }];
    }).sort((a, b) => b.confidence - a.confidence || a.distanceMeters - b.distanceMeters);

    return { candidates };
  });
