// lib/oauth-token.ts
import {
  GoogleAuthProvider,
  FacebookAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
} from "firebase/auth";
import { firebaseAuth } from "./firebase";
import type { IdpProvider } from "@/features/auth/types";

export class ProviderLoginCancelledError extends Error {
  constructor() {
    super("Provider login cancelled");
    this.name = "ProviderLoginCancelledError";
  }
}

function isPopupCancellation(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;

  const code = "code" in error ? String(error.code) : "";
  return (
    code === "auth/popup-closed-by-user" ||
    code === "auth/cancelled-popup-request" ||
    code === "auth/user-cancelled"
  );
}

function waitForPopupCancellation(): {
  promise: Promise<never>;
  cleanup: () => void;
} {
  let checkTimer: ReturnType<typeof setTimeout> | undefined;
  let settled = false;
  let cleanup = () => {};

  const promise = new Promise<never>((_resolve, reject) => {
    const checkAfterFocusReturns = () => {
      if (settled) return;
      if (document.visibilityState !== "visible") return;
      if (checkTimer) clearTimeout(checkTimer);

      // Firebase normally settles first. Some browsers leave its popup
      // promise pending after the user closes the window, so give Firebase a
      // short grace period and then treat the returned focus as cancellation.
      checkTimer = setTimeout(() => {
        if (!firebaseAuth.currentUser) {
          settled = true;
          reject(new ProviderLoginCancelledError());
        }
      }, 800);
    };

    window.addEventListener("focus", checkAfterFocusReturns);
    document.addEventListener("visibilitychange", checkAfterFocusReturns);

    cleanup = () => {
      settled = true;
      if (checkTimer) clearTimeout(checkTimer);
      window.removeEventListener("focus", checkAfterFocusReturns);
      document.removeEventListener("visibilitychange", checkAfterFocusReturns);
    };
  });

  return { promise, cleanup: () => cleanup() };
}

// Uses a Firebase popup purely to obtain a Google/Facebook credential token
// to hand to the backend's /auth/oauth endpoint. Immediately signs back out
// of the Firebase client SDK afterward — the app's real Firebase session
// (with the `role` custom claim used by RTDB rules) is established later,
// separately, via /auth/firebase-token + signInWithCustomToken. Without this
// sign-out, `ensureFirebaseSession` would see a `currentUser` already set
// from the popup and skip re-authenticating with the proper custom claims.
export async function getProviderToken(provider: IdpProvider): Promise<string> {
  const authProvider = provider === "google.com" ? new GoogleAuthProvider() : new FacebookAuthProvider();

  const cancellation = waitForPopupCancellation();
  let result;
  try {
    result = await Promise.race([
      signInWithPopup(firebaseAuth, authProvider),
      cancellation.promise,
    ]);
  } catch (error) {
    if (isPopupCancellation(error)) throw new ProviderLoginCancelledError();
    throw error;
  } finally {
    cancellation.cleanup();
  }
  const credential =
    provider === "google.com"
      ? GoogleAuthProvider.credentialFromResult(result)
      : FacebookAuthProvider.credentialFromResult(result);

  const token = provider === "google.com" ? credential?.idToken : credential?.accessToken;

  await firebaseSignOut(firebaseAuth);

  if (!token) {
    throw new Error(`Could not get a ${provider === "google.com" ? "Google" : "Facebook"} token`);
  }
  return token;
}
