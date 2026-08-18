export type ExploreCategory =
  "all" | "sights" | "food" | "cafes" | "culture" | "parks" | "shopping";

export type ExplorePlace = {
  placeId: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  distanceMeters: number;
  primaryType: string | null;
  types: string[];
  googleMapsUri: string | null;
  photoUri: string | null;
  photoAttributions: Array<{
    displayName?: string;
    uri?: string;
    photoUri?: string;
  }>;
  category: Exclude<ExploreCategory, "all">;
};
