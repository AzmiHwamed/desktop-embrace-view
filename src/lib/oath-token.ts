// lib/oauth-token.ts
import {
  GoogleAuthProvider,
  FacebookAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
} from "firebase/auth";
import { firebaseAuth } from "./firebase";
import type { IdpProvider } from "@/features/auth/types";

// Uses a Firebase popup purely to obtain a Google/Facebook credential token
// to hand to the backend's /auth/oauth endpoint. Immediately signs back out
// of the Firebase client SDK afterward — the app's real Firebase session
// (with the `role` custom claim used by RTDB rules) is established later,
// separately, via /auth/firebase-token + signInWithCustomToken. Without this
// sign-out, `ensureFirebaseSession` would see a `currentUser` already set
// from the popup and skip re-authenticating with the proper custom claims.
export async function getProviderToken(provider: IdpProvider): Promise<string> {
  const authProvider = provider === "google.com" ? new GoogleAuthProvider() : new FacebookAuthProvider();

  const result = await signInWithPopup(firebaseAuth, authProvider);
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