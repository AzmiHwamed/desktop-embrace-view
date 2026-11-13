import { createFileRoute } from "@tanstack/react-router";
import { FaqPage } from "@/features/settings/FaqPage";

export const Route = createFileRoute("/faq")({
  head: () => ({
    meta: [
      { title: "FAQs · SmartTravel" },
      { name: "description", content: "Answers to common SmartTravel questions." },
    ],
  }),
  component: FaqPage,
});
