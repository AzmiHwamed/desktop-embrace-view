import { createFileRoute } from "@tanstack/react-router";

import { TokenPackagesPage } from "@/features/tokens/TokenPackagesPage";

export const Route = createFileRoute("/tokens")({
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
  component: TokenPackagesPage,
});
