import { createFileRoute } from "@tanstack/react-router";

import { SupportChatPage } from "@/features/chat/SupportChatPage";
import { OnboardingPage } from "@/features/auth/OnboardingPage";

export const Route = createFileRoute("/onboarding")({
  head: () => ({
    meta: [
      { title: "Onboarding · SmartTravel" },
      {
        name: "description",
        content: "Complete your profile to get started with SmartTravel.",
      },
      { property: "og:title", content: "Onboarding  · SmartTravel" },
      {
        property: "og:description",
        content: "Complete your profile to get started with SmartTravel.",
      },
    ],
  }),
  component: OnboardingPage,
});
