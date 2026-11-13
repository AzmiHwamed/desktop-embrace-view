import { createFileRoute } from "@tanstack/react-router";
import { TextTranslatePage } from "@/features/translate/TextTranslatePage";

export const Route = createFileRoute("/translate")({
  head: () => ({
    meta: [
      { title: "Text translate · SmartTravel" },
      { name: "description", content: "Translate travel text in seconds." },
    ],
  }),
  component: TextTranslatePage,
});
