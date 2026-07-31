import { createFileRoute } from "@tanstack/react-router";

import { LoginPage } from "@/features/auth/LoginPage";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in · SmartTravel" },
      {
        name: "description",
        content: "Sign in to your SmartTravel travel money workspace.",
      },
      { property: "og:title", content: "Sign in · SmartTravel" },
      {
        property: "og:description",
        content: "Sign in to your SmartTravel travel money workspace.",
      },
    ],
  }),
  component: LoginPage,
});
