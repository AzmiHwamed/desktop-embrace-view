import { createFileRoute } from "@tanstack/react-router";
import { BudgetsPage } from "@/features/budgets/BudgetsPage";

export const Route = createFileRoute("/budgets")({
  head: () => ({ meta: [{ title: "Trip Budgets - SmartTravel" }, { name: "description", content: "Plan and monitor travel budgets." }] }),
  component: BudgetsPage,
});
