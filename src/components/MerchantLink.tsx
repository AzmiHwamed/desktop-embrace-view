import { ExternalLink, MapPin } from "lucide-react";

export type MappableMerchant = {
  shop: string | null;
  googlePlaceId?: string | null;
  merchantAddress?: string | null;
  merchantLatitude?: string | number | null;
  merchantLongitude?: string | number | null;
  googleMapsUri?: string | null;
};

export function MerchantLink({ expense, fallback }: { expense: MappableMerchant; fallback: string }) {
  const name = expense.shop ?? fallback;
  const latitude = Number(expense.merchantLatitude);
  const longitude = Number(expense.merchantLongitude);
  const coordinateUrl = Number.isFinite(latitude) && Number.isFinite(longitude)
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${latitude},${longitude}`)}${expense.googlePlaceId ? `&query_place_id=${encodeURIComponent(expense.googlePlaceId)}` : ""}`
    : null;
  const mapsUrl = expense.googleMapsUri ?? coordinateUrl;

  if (!mapsUrl || !expense.googlePlaceId) return <>{name}</>;

  return (
    <a href={mapsUrl} target="_blank" rel="noreferrer" title={expense.merchantAddress ?? name} className="inline-flex max-w-full items-center gap-1 text-primary underline-offset-4 hover:underline" onClick={(event) => event.stopPropagation()}>
      <MapPin className="h-3.5 w-3.5 shrink-0" />
      <span className="truncate">{name}</span>
      <ExternalLink className="h-3 w-3 shrink-0 opacity-60" />
    </a>
  );
}
