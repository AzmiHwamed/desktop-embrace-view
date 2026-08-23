import { createFileRoute } from "@tanstack/react-router";
import { PlaceDetailsPage } from "@/features/explore/PlaceDetailsPage";

// The trailing underscore on `explore_` keeps the /explore/place/:placeId
// URL while escaping the /explore route's component nesting. The explore
// list is a complete page and intentionally has no child <Outlet />.
export const Route = createFileRoute("/explore_/place/$placeId")({
  component: PlaceRoute,
});

function PlaceRoute() {
  const { placeId } = Route.useParams();
  return <PlaceDetailsPage placeId={placeId} />;
}
