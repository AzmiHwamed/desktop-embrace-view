export type MerchantLocation = {
  latitude: number;
  longitude: number;
  accuracy?: number;
};

export type MerchantCandidate = {
  placeId: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  distanceMeters: number;
  confidence: number;
  googleMapsUri: string | null;
  primaryType: string | null;
};

export type MerchantMatchResult = {
  candidates: MerchantCandidate[];
};
