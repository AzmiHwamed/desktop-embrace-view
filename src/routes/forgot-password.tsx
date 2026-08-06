import { createFileRoute } from "@tanstack/react-router";

import { ForgotPasswordPage } from "@/features/auth/ForgotPasswordPage";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [
      { title: "Reset password · SmartTravel" },
      {
        name: "description",
        content: "Recover access to your SmartTravel account.",
      },
    ],
  }),
  component: ForgotPasswordPage,
});
