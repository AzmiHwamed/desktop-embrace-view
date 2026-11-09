import { createFileRoute } from "@tanstack/react-router";

import { SubscriptionPage } from "@/features/subscription/SubscriptionPage";

export const Route = createFileRoute("/subscribe")({
  head: () => ({
    meta: [
      { title: "AI Tokens · SmartTravel" },
      {
        name: "description",
        content: "Buy tokens for SmartTravel AI services.",
      },
      { property: "og:title", content: "AI Tokens · SmartTravel" },
      {
        property: "og:description",
        content: "Buy tokens for SmartTravel AI services.",
      },
    ],
  }),
  component: SubscriptionPage,
});
