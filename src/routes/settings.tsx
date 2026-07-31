import { createFileRoute } from "@tanstack/react-router";

import { SettingsPage } from "@/features/settings/SettingsPage";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings · SmartTravel" },
      {
        name: "description",
        content: "Notification, security and support settings for your SmartTravel workspace.",
      },
      { property: "og:title", content: "Settings · SmartTravel" },
      {
        property: "og:description",
        content: "Notification, security and support settings.",
      },
    ],
  }),
  component: SettingsPage,
});
