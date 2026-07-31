import { createFileRoute } from "@tanstack/react-router";

import { ConvertPage } from "@/features/convert/ConvertPage";

export const Route = createFileRoute("/convert")({
  head: () => ({
    meta: [
      { title: "Convert currency · SmartTravel" },
      {
        name: "description",
        content: "Convert between 42 currencies with live mid-market rates and saved pairs.",
      },
      { property: "og:title", content: "Convert currency · SmartTravel" },
      {
        property: "og:description",
        content: "Live mid-market currency conversion with saved pairs.",
      },
    ],
  }),
  component: ConvertPage,
});
