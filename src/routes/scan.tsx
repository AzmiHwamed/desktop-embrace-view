import { createFileRoute } from "@tanstack/react-router";

import { ScanPage } from "@/features/scan/ScanPage";

export const Route = createFileRoute("/scan")({
  head: () => ({
    meta: [
      { title: "Scan & translate · SmartTravel" },
      {
        name: "description",
        content: "Scan a foreign receipt or menu and get an instant translation with converted prices.",
      },
      { property: "og:title", content: "Scan & translate · SmartTravel" },
      {
        property: "og:description",
        content: "Instant receipt and menu translation with converted prices.",
      },
    ],
  }),
  component: ScanPage,
});
