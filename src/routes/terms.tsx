import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/features/legal/LegalPage";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Service · SmartTravel" },
      {
        name: "description",
        content: "Terms for using SmartTravel's travel, expense, and translation tools.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => <LegalPage document="terms" />,
});
