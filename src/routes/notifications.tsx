import { createFileRoute } from "@tanstack/react-router";

import { NotificationsPage } from "@/features/notifications/NotificationsPage";

export const Route = createFileRoute("/notifications")({
  head: () => ({
    meta: [
      { title: "Notifications · SmartTravel" },
      {
        name: "description",
        content: "Rate alerts, budget warnings and security updates for your travel wallet.",
      },
      { property: "og:title", content: "Notifications · SmartTravel" },
      {
        property: "og:description",
        content: "Rate alerts, budget warnings and security updates.",
      },
    ],
  }),
  component: NotificationsPage,
});
