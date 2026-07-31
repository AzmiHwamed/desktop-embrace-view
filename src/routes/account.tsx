import { createFileRoute } from "@tanstack/react-router";

import { AccountPage } from "@/features/account/AccountPage";

export const Route = createFileRoute("/account")({
  head: () => ({
    meta: [
      { title: "Account · SmartTravel" },
      {
        name: "description",
        content: "Manage your SmartTravel profile, home currency and travel preferences.",
      },
      { property: "og:title", content: "Account · SmartTravel" },
      {
        property: "og:description",
        content: "Manage your profile, home currency and travel preferences.",
      },
    ],
  }),
  component: AccountPage,
});
