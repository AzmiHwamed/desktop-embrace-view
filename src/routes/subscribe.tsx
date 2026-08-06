import { createFileRoute } from "@tanstack/react-router";

import { SubscriptionPage } from "@/features/subscription/subscriptionPage";

export const Route = createFileRoute("/subscribe")({
  head: () => ({
    meta: [
      { title: "Subscribe · SmartTravel" },
      {
        name: "description",
        content: "Subscribe to SmartTravel and get the most out of your travel experience.",
      },
      { property: "og:title", content: "Subscribe · SmartTravel" },
      {
        property: "og:description",
        content: "Subscribe to SmartTravel and get the most out of your travel experience.",
      },
    ],
  }),
  component: SubscriptionPage,
});
