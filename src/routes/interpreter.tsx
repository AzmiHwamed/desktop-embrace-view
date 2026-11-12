import { createFileRoute } from "@tanstack/react-router";
import { InterpreterPage } from "@/features/interpreter/InterpreterPage";
import { GuestDemoPage } from "@/components/GuestDemoPage";
import { useAppSelector } from "@/app/hooks";

function InterpreterRoute() {
  return useAppSelector((state) => state.auth.isGuest) ? <GuestDemoPage kind="interpreter" /> : <InterpreterPage />;
}

export const Route = createFileRoute("/interpreter")({
  head: () => ({ meta: [{ title: "Live Interpreter · SmartTravel" }, { name: "description", content: "Two-way spoken translation for travel conversations." }] }),
  component: InterpreterRoute,
});
