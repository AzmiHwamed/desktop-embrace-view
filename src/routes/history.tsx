import { createFileRoute } from "@tanstack/react-router";

import { HistoryPage } from "@/features/history/HistoryPage";

export const Route = createFileRoute("/history")({
  head: () => ({
    meta: [
      { title: "History · SmartTravel" },
      {
        name: "description",
        content: "Search, filter and export every scanned receipt and currency conversion.",
      },
      { property: "og:title", content: "History · SmartTravel" },
      {
        property: "og:description",
        content: "Search, filter and export every scanned receipt and conversion.",
      },
    ],
  }),
  component: HistoryPage,
});
