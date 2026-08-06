import { createFileRoute } from "@tanstack/react-router";

import { SupportChatPage } from "@/features/chat/SupportChatPage";

export const Route = createFileRoute("/chat")({
  head: () => ({
    meta: [
      { title: "Support Chat · SmartTravel" },
      {
        name: "description",
        content: "Chat with our support team for assistance with your SmartTravel account.",
      },
      { property: "og:title", content: "Support Chat · SmartTravel" },
      {
        property: "og:description",
        content: "Chat with our support team for assistance with your SmartTravel account.",
      },
    ],
  }),
  component: SupportChatPage,
});
