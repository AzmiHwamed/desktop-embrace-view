// lib/firebase-session.ts
import { signInWithCustomToken } from "firebase/auth";
import { firebaseAuth } from "./firebase";
import { apiFetch, type ApiResponse } from "./api-client";

// Single-flight, same pattern as the token-refresh logic in api-client —
// several components could call this around the same time (chat page,
// future notifications, etc.) and they should all await the same sign-in.
let signInPromise: Promise<void> | null = null;

export async function ensureFirebaseSession(): Promise<void> {
  if (firebaseAuth.currentUser) return;
  if (signInPromise) return signInPromise;

  signInPromise = (async () => {
    const res = await apiFetch<ApiResponse<{ customToken: string }>>(
      "/auth/firebase-token",
      { method: "POST" },
    );
    await signInWithCustomToken(firebaseAuth, res.data.customToken);
  })();

  try {
    await signInPromise;
  } finally {
    signInPromise = null;
  }
}