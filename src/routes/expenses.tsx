import { createFileRoute } from "@tanstack/react-router";

import { ExpensesPage } from "@/features/expenses/ExpensesPage";

export const Route = createFileRoute("/expenses")({
  head: () => ({
    meta: [
      { title: "Expenses · SmartTravel" },
      {
        name: "description",
        content: "Break down travel spending by category, city and budget with visual reports.",
      },
      { property: "og:title", content: "Expenses · SmartTravel" },
      {
        property: "og:description",
        content: "Travel spending broken down by category, city and budget.",
      },
    ],
  }),
  component: ExpensesPage,
});
