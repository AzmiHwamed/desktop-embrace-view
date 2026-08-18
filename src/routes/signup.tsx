import { createFileRoute } from "@tanstack/react-router";

import { SignupPage } from "@/features/auth/SignupPage";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "Create account · SmartTravel" },
      {
        name: "description",
        content: "Create your SmartTravel account and start planning your trip.",
      },
      { property: "og:title", content: "Create account · SmartTravel" },
      {
        property: "og:description",
        content: "Create your SmartTravel account and start planning your trip.",
      },
    ],
  }),
  component: SignupPage,
});
