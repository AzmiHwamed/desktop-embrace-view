import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/features/legal/LegalPage";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy · SmartTravel" },
      {
        name: "description",
        content:
          "How SmartTravel handles account information, receipts, location, recordings, and support messages.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => <LegalPage document="privacy" />,
});
