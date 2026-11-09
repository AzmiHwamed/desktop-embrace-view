// features/auth/usePostAuthRedirect.ts
import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAppSelector } from "@/app/hooks";
import { isProfileComplete } from "./types";

// Shared by login, signup, and OAuth flows — routes to onboarding if the
// user hasn't picked a currency/country/language yet, otherwise straight
// to the dashboard.
export function usePostAuthRedirect() {
  const navigate = useNavigate();
  const { status, user } = useAppSelector((s) => s.auth);

  useEffect(() => {
    if (status !== "authenticated" || !user) return;
    const redirect = new URLSearchParams(window.location.search).get("redirect");
    // Permit only internal, absolute paths. This preserves the return trip
    // from the public deletion page without introducing an open redirect.
    if (redirect?.startsWith("/") && !redirect.startsWith("//")) {
      window.location.replace(redirect);
      return;
    }
    if (isProfileComplete(user)) {
      navigate({ to: "/", replace: true });
    } else {
      navigate({ to: "/onboarding", replace: true });
    }
  }, [status, user, navigate]);
}
