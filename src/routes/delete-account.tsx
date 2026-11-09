import { createFileRoute } from "@tanstack/react-router";

import { DeleteAccountPage } from "@/features/account/DeleteAccountPage";

export const Route = createFileRoute("/delete-account")({
  head: () => ({
    meta: [
      { title: "Delete your account · SmartTravel" },
      {
        name: "description",
        content: "Request permanent deletion of your SmartTravel account and associated data.",
      },
    ],
  }),
  component: DeleteAccountPage,
});
