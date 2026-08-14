import { createFileRoute } from "@tanstack/react-router";
import { InterpreterPage } from "@/features/interpreter/InterpreterPage";

export const Route = createFileRoute("/interpreter")({
  head: () => ({ meta: [{ title: "Live Interpreter · SmartTravel" }, { name: "description", content: "Two-way spoken translation for travel conversations." }] }),
  component: InterpreterPage,
});
