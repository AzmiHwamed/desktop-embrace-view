import { createFileRoute } from "@tanstack/react-router";

import { Dashboard } from "@/features/dashboard/Dashboard";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard · SmartTravel" },
      {
        name: "description",
        content:
          "Your travel wallet at a glance: balance, live FX rates, weekly spend and recent scanned receipts.",
      },
      { property: "og:title", content: "Dashboard · SmartTravel" },
      {
        property: "og:description",
        content: "Balance, live FX rates, weekly spend and recent scanned receipts.",
      },
    ],
  }),
  component: Dashboard,
});
