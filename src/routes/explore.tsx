import { createFileRoute } from "@tanstack/react-router";
import { ExplorePage } from "@/features/explore/ExplorePage";
import { GuestDemoPage } from "@/components/GuestDemoPage";
import { useAppSelector } from "@/app/hooks";

function ExploreRoute() {
  return useAppSelector((state) => state.auth.isGuest) ? <GuestDemoPage kind="explore" /> : <ExplorePage />;
}

export const Route = createFileRoute("/explore")({
  head: () => ({
    meta: [
      { title: "Explore Nearby - SmartTravel" },
      { name: "description", content: "Discover attractions, restaurants and places near you." },
    ],
  }),
  component: ExploreRoute,
});
