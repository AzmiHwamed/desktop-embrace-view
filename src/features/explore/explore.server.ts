import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import type { ExploreCategory, ExplorePlace } from "./types";

const inputSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  languageCode: z.string().trim().min(2).max(10).optional(),
  radius: z.number().min(500).max(20000).default(10000),
});

type GooglePlace = {
  id?: string;
  displayName?: { text?: string };
  formattedAddress?: string;
  location?: { latitude?: number; longitude?: number };
  googleMapsUri?: string;
  primaryType?: string;
  types?: string[];
};

function distanceMeters(lat1: number, lon1: number, lat2: number, lon2: number) {
  const rad = (value: number) => (value * Math.PI) / 180;
  const dLat = rad(lat2 - lat1);
  const dLon = rad(lon2 - lon1);
  const value =
    Math.sin(dLat / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 6371000 * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
}

function categoryFor(types: string[]): Exclude<ExploreCategory, "all"> {
  if (types.some((type) => ["restaurant", "meal_takeaway", "meal_delivery"].includes(type)))
    return "food";
  if (types.some((type) => ["cafe", "coffee_shop", "bakery"].includes(type))) return "cafes";
  if (types.some((type) => ["museum", "art_gallery", "cultural_landmark"].includes(type)))
    return "culture";
  if (types.some((type) => ["park", "national_park", "garden"].includes(type))) return "parks";
  if (types.some((type) => ["shopping_mall", "market", "store"].includes(type))) return "shopping";
  return "sights";
}

export const exploreNearby = createServerFn({ method: "POST" })
  .validator((input: unknown) => inputSchema.parse(input))
  .handler(async ({ data }): Promise<{ places: ExplorePlace[] }> => {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) throw new Error("Google Maps API key is not configured on the server.");
    const response = await fetch("https://places.googleapis.com/v1/places:searchNearby", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask":
          "places.id,places.displayName,places.formattedAddress,places.location,places.googleMapsUri,places.primaryType,places.types",
      },
      body: JSON.stringify({
        includedTypes: [
          "tourist_attraction",
          "historical_landmark",
          "museum",
          "restaurant",
          "cafe",
          "park",
          "shopping_mall",
        ],
        maxResultCount: 20,
        rankPreference: "POPULARITY",
        languageCode: data.languageCode?.slice(0, 2),
        locationRestriction: {
          circle: {
            center: { latitude: data.latitude, longitude: data.longitude },
            radius: data.radius,
          },
        },
      }),
    });
    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as {
        error?: { message?: string };
      } | null;
      console.error("Google Explore search failed", response.status, payload?.error?.message);
      throw new Error(payload?.error?.message ?? "Unable to find nearby places.");
    }
    const payload = (await response.json()) as { places?: GooglePlace[] };
    const places = (payload.places ?? []).flatMap((place): ExplorePlace[] => {
      const name = place.displayName?.text;
      const latitude = place.location?.latitude;
      const longitude = place.location?.longitude;
      if (!place.id || !name || latitude == null || longitude == null) return [];
      const types = place.types ?? [];
      return [
        {
          placeId: place.id,
          name,
          address: place.formattedAddress ?? "",
          latitude,
          longitude,
          distanceMeters: Math.round(
            distanceMeters(data.latitude, data.longitude, latitude, longitude),
          ),
          primaryType: place.primaryType ?? null,
          types,
          googleMapsUri: place.googleMapsUri ?? null,
          category: categoryFor(types),
        },
      ];
    });
    return { places: places.sort((a, b) => a.distanceMeters - b.distanceMeters) };
  });
