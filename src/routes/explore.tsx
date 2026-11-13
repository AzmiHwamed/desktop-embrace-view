import { createFileRoute } from "@tanstack/react-router";
import { ExplorePage } from "@/features/explore/ExplorePage";

export const Route = createFileRoute("/explore")({
  head: () => ({
    meta: [
      { title: "Explore Nearby - SmartTravel" },
      { name: "description", content: "Discover attractions, restaurants and places near you." },
    ],
  }),
  component: ExplorePage,
});
