import { createFileRoute } from "@tanstack/react-router";
import { PaymentResultPage } from "@/features/tokens/PaymentResultPage";

export const Route = createFileRoute("/payment-result")({
  component: PaymentResultPage,
});
