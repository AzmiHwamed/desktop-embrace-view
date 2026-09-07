# SmartTravel support chat — mobile developer handoff

Implement the existing customer-to-support chat in Android with Kotlin Multiplatform. Reuse the current backend and Firebase project. The customer has **one conversation**, with text messages exchanged with an admin.

**Verified against:** the web chat and the local `translate-app` backend on September 7, 2026. Deployment behavior has not been tested.

Read this page for the contract and flow. Use [the Kotlin examples](support-chat-kotlin-examples.md) for the REST client, Firebase adapter, and message store.

## 1. The architecture

```text
Compose screen
      |
Shared Kotlin: screen state + chat repository + Ktor
      |                                      ^
      v                                      |
REST API -> SQL -> best-effort Firebase mirror -> Android Firebase listener
```

SQL is the source of truth. Send messages and mark read through REST. Subscribe to Firebase Realtime Database for incoming messages. The backend saves a message even if its Firebase mirror fails, so REST refresh must remain available.

The backend contains an old Socket.IO gateway file, but it is not registered in the chat module. Follow the REST + RTDB flow used by the web app.

## 2. Configuration your mobile developer needs

| Setting | Where it comes from |
| --- | --- |
| API base URL | Same environment as web `VITE_API_BASE_URL` |
| Firebase project | Same project as web `VITE_FIREBASE_PROJECT_ID` |
| RTDB URL | Same value as web `VITE_FIREBASE_DATABASE_URL` |
| Android Firebase config | Register the Android application ID in that project and obtain `google-services.json` |
| API token | Existing app login response: `data.idToken` |
| Refresh token | Existing app login response: `data.refreshToken` |

Use a reachable API URL for the device. The web's localhost fallback is only a development default.

**Two authentication steps:**

1. Use the app's access/ID token as the REST bearer token.
2. Request a Firebase custom token from the backend and exchange it with the Firebase SDK before listening.

The custom token is only for `signInWithCustomToken`. It is not the bearer token to send to chat REST endpoints. The SDK maintains its own authenticated session. [Firebase custom authentication](https://firebase.google.com/docs/auth/android/custom-auth)

## 3. Exact REST contract

Every endpoint below requires:

```http
Authorization: Bearer <app ID token>
Content-Type: application/json
```

Paths are relative to the API base URL.

| Action | Request | Successful `data` |
| --- | --- | --- |
| Open chat | `GET /chat/conversations/me` | Conversation; creates one if absent |
| Latest history | `GET /chat/conversations/{id}/messages?limit=50` | Latest 50 messages, ordered oldest → newest |
| Older history | `GET /chat/conversations/{id}/messages?limit=50&before={ISO timestamp}` | Messages strictly older than `before`, ordered oldest → newest |
| Send | `POST /chat/conversations/{id}/messages` with `{"body":"Hello, I need help"}` | Saved message; HTTP 201 |
| Mark read | `PATCH /chat/conversations/{id}/read`, no body | `null`; no useful response data |
| Firebase login token | `POST /auth/firebase-token`, no body | `{"customToken":"..."}` |

The backend wraps successful responses in `status_code`, `title`, `body`, and `data`. The title/body are display text and may be translated. Check HTTP status and parse `data`; do not branch on English response text.

**Example: opening a conversation** — illustrative IDs and text:

```json
{
  "status_code": 200,
  "title": "Loaded successfully",
  "body": "Loaded successfully",
  "data": {
    "id": "b3f1c2a0-1234-4a5b-8c9d-abcdef123456",
    "userId": "8f165df4-79ea-46f4-87da-90c08f0e5663",
    "userDisplayName": "Alex",
    "lastMessagePreview": null,
    "lastMessageAt": null,
    "unreadByAdmin": 0,
    "unreadByUser": 0,
    "createdAt": "2026-09-07T10:00:00.000Z",
    "updatedAt": "2026-09-07T10:00:00.000Z"
  }
}
```

**Example: a saved message** — this object appears inside `data` after sending, or inside the history `data` array:

```json
{
  "id": "d4e5f6a7-1234-4a5b-8c9d-abcdef123456",
  "conversationId": "b3f1c2a0-1234-4a5b-8c9d-abcdef123456",
  "senderId": "8f165df4-79ea-46f4-87da-90c08f0e5663",
  "senderRole": "user",
  "body": "Hello, I need help",
  "isRead": false,
  "createdAt": "2026-09-07T10:01:00.000Z"
}
```

Send only `body`. The backend supplies the ID, sender, role, and timestamp. The DTO declares a string length of **1–4,000**; trim and validate on mobile. No chat/global validation pipe was found in the inspected backend, so server enforcement also needs verification.

## 4. Firebase data contract

Subscribe to:

```text
chats/messages/{conversationId}
```

Its value is a map keyed by message ID:

```json
{
  "d4e5f6a7-1234-4a5b-8c9d-abcdef123456": {
    "senderId": "8f165df4-79ea-46f4-87da-90c08f0e5663",
    "senderRole": "user",
    "body": "Hello, I need help",
    "isRead": false,
    "createdAt": 1788775260000
  }
}
```

Build `id` from the child key and `conversationId` from the subscribed path. **REST timestamps are ISO strings; Firebase timestamps are epoch milliseconds.** Normalize before sorting.

For a support badge outside the chat screen, subscribe to `chats/conversations/{conversationId}/unreadByUser`. This counts admin messages unread by the customer. `unreadByAdmin` counts customer messages unread by support.

A Firebase value listener sends an initial snapshot and another snapshot when data changes. Repeated messages are normal. Remove the listener when its coroutine is cancelled. [Android database listeners](https://firebase.google.com/docs/database/android/read-and-write)

## 5. Implement in this order

| Step | Implementation | Done when |
| --- | --- | --- |
| 1 | Shared models and Ktor methods | Mobile loads the same conversation/history as web |
| 2 | Send action | Message appears in mobile and the support dashboard |
| 3 | Android Firebase adapter | An admin reply appears without refreshing |
| 4 | Merge store and older-history loading | Replies never duplicate or disappear during loading |
| 5 | Read calls and screen lifecycle | Read count resets; leaving/reopening does not add listeners |
| 6 | Failure/reconnect states | Draft survives a failed send and REST history can recover |

Keep models, REST, merging, and screen state in `commonMain`. Put the native Firebase implementation in `androidMain` behind the shared interface. A future iOS adapter can implement that interface without changing the REST contract.

### Opening and reading

1. Call `GET /chat/conversations/me`.
2. Once its ID is available, load latest REST history and authenticate/attach Firebase independently.
3. Merge every REST page, send response, and Firebase snapshot by server message ID.
4. Display messages in chronological order.
5. Once the chat is visible with messages displayed, call `PATCH .../read`.
6. While visible, call read again when newly received admin messages are displayed. Coalesce calls; do not trigger repeatedly from old Firebase snapshots.

Use separate errors for history, sending, and live delivery. Firebase failure must not erase loaded messages or disable REST sending.

### Sending

Read and trim the draft → reject empty/over-limit text → set sending → POST → merge saved message → clear draft → clear sending.

Disable editing/sending during the request, or clear only the exact draft that was submitted. On failure retain the draft. After a timeout, refresh history before offering resend: the server may already have stored it, and this endpoint has no idempotency key.

### Older messages

Keep an older-history cursor from the oldest message in the last **REST page**, independent of Firebase snapshots. Pass that timestamp as the next `before`; let Ktor URL-encode it. Merge older results and preserve scroll position. A short page means no more older history at that moment.

The current cursor is timestamp-only with a strict `<` comparison. If a page boundary splits messages with exactly the same timestamp, older requests can skip the remaining messages at that timestamp. A guaranteed complete cursor requires a backend change to use timestamp plus ID.

### Leaving, returning, and logout

Tie live collection to the visible screen; cancel it on exit and recreate it on return. Retain state in the ViewModel across rotation. Refresh REST on foreground/reconnect to recover messages whose Firebase mirror failed. A bounded foreground refresh can also recover mirror failures while the Firebase connection stays healthy.

On logout, cancel chat jobs, discard late results, clear chat state, and sign out of the chat Firebase session. If other features share that Firebase instance, coordinate logout through the app's session manager.

## 6. Screen behavior

Use a header, connection label, scrollable bubbles, and a text composer with Send. Customer messages (`senderRole == "user"`) align to the reading end; support messages align to the reading start. Use logical alignment for RTL.

| State | What the customer sees |
| --- | --- |
| Opening conversation | Loading indicator |
| Empty history | “Send a message to our support team.” |
| Sending | Send disabled and progress indication |
| Send failed | Draft preserved and inline retry |
| Firebase unavailable | “Live updates unavailable” with refresh/retry; REST remains usable |
| Reading older messages | Preserve position; show a new-message affordance for incoming replies |
| Expired session | Existing app login/refresh flow |

Observe Firebase `/.info/connected` for transport state. Show “Live” only when connected and the messages listener has successfully delivered a snapshot without a subsequent error. It means live delivery is available, not that an agent is online. [Firebase connection state](https://firebase.google.com/docs/database/android/offline-capabilities)

## 7. Backend findings your developer must know

**Customer Firebase authorization has an ID mismatch in the local code.** Chat creation stores SQL `user.id` in `conversation.userId`. The Firebase custom token uses `user.firebaseUid`. The checked-in rules compare `conversation.userId` with Firebase `auth.uid`. These are different identity fields; with these rules deployed, ordinary customers can be denied live reads even though REST works. Admins may pass through their role claim.

Backend follow-up: preserve the SQL owner ID for REST, mirror a separately resolved owner Firebase UID, and have the rules compare that field to `auth.uid`. Backfill existing conversation mirrors and verify customer isolation before releasing. Deployed rules/data were not inspected; no backend changes were made for this documentation.

**Per-message read state in Firebase becomes stale.** Mark-read updates SQL message `isRead` and the mirrored conversation unread counter, but does not update the mirrored message nodes. Do not build live “seen by support” ticks from Firebase message `isRead`. A REST refetch can provide newer read state; merging must not let a stale Firebase `false` overwrite a known `true`.

**Read is conversation-wide.** A customer read call marks all currently unread admin messages as read, including older pages that were not loaded. It does not accept a last-visible-message ID.

**Feature scope:** current web UI is text chat. Attachments, push notifications, edit/delete, and agent-presence UI are not implemented in this flow. An optional typing node exists in backend rules, but the web chat does not use it.

## 8. Acceptance test

Use a normal customer account and a separate support admin account.

- Open the same customer's chat on web and Android; history matches.
- Send from Android; one bubble appears and admin receives it.
- Reply as admin while mobile history loads; the reply stays visible once loading finishes.
- Load more than 50 historical messages and preserve scroll position.
- Fail a send; the draft remains.
- Reconnect or return from background; missed messages are recovered.
- Read an admin reply; `unreadByUser` resets.
- Leave/reopen and rotate; there is only one active messages listener.
- Switch accounts; no previous user's messages appear.
- Verify a customer cannot read another customer's Firebase conversation.

## Source map

| Contract | Local source |
| --- | --- |
| Current web UX | `desktop-embrace-view/src/features/chat/SupportChatPage.tsx` |
| Web requests and merging | `desktop-embrace-view/src/features/chat/chatSlice.ts` |
| REST routes and pagination | `translate-app/src/chat/chat.controller.ts`, `chat.service.ts` |
| Message length | `translate-app/src/chat/dto/send-message.dto.ts` |
| Firebase payload/read updates | `translate-app/src/chat/chat-realtime.service.ts` |
| Firebase access rules | `translate-app/firebase-database.rules.json` |
| Custom-token identity | `translate-app/src/auth/auth.controller.ts` |
| SQL and Firebase user IDs | `translate-app/src/user/entities/user.entity.ts` |

The companion examples are reference code to integrate with the mobile app's authentication and lifecycle. They have not been compiled in a mobile project.

