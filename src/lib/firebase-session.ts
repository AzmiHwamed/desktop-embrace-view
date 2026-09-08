import { signInWithCustomToken, signOut } from "firebase/auth";
import { goOffline, goOnline } from "firebase/database";
import { firebaseAuth, firebaseDb } from "./firebase";
import { apiFetch, type ApiResponse } from "./api-client";
import { assertSession, getSession } from "./session-lifecycle";

let queue: Promise<unknown> = Promise.resolve();
let verifiedSession: { generation: number; uid: string } | null = null;

// Serialize popup/custom-token operations and logout, including their cleanup.
export function withFirebaseAuth<T>(operation: () => Promise<T>): Promise<T> {
  const session = getSession();
  const request = queue
    .catch(() => undefined)
    .then(async () => {
      assertSession(session.generation);
      try {
        const result = await operation();
        assertSession(session.generation);
        return result;
      } finally {
        if (session.generation !== getSession().generation) await signOut(firebaseAuth);
      }
    });
  queue = request;
  return request;
}

export function resetFirebaseSession(): Promise<void> {
  verifiedSession = null;
  goOffline(firebaseDb);
  // Clear current credentials now, then again after any pending sign-in settles.
  const immediate = signOut(firebaseAuth);
  void immediate.catch(() => undefined);
  const reset = queue
    .catch(() => undefined)
    .then(async () => {
      await immediate.catch(() => undefined);
      await signOut(firebaseAuth);
    });
  queue = reset;
  return reset;
}

export function ensureFirebaseSession(): Promise<void> {
  return withFirebaseAuth(async () => {
    const session = getSession();
    if (
      verifiedSession?.generation === session.generation &&
      verifiedSession.uid === firebaseAuth.currentUser?.uid
    ) {
      goOnline(firebaseDb);
      return;
    }
    const response = await apiFetch<ApiResponse<{ customToken: string }>>("/auth/firebase-token", {
      method: "POST",
    });
    assertSession(session.generation);
    const credential = await signInWithCustomToken(firebaseAuth, response.data.customToken);
    assertSession(session.generation);
    verifiedSession = { generation: session.generation, uid: credential.user.uid };
    goOnline(firebaseDb);
  });
}
