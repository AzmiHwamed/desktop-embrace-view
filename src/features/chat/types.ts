// store/chat/types.ts
export type SenderRole = "user" | "admin";

export type Message = {
  id: string;
  conversationId: string;
  senderId: string;
  senderRole: SenderRole;
  body: string;
  isRead: boolean;
  createdAt: string;
};

export type Conversation = {
  id: string;
  userId: string;
  userDisplayName: string | null;
  lastMessagePreview: string | null;
  lastMessageAt: string | null;
  unreadByAdmin: number;
  unreadByUser: number;
};

export type ChatState = {
  conversation: Conversation | null;
  messages: Message[];
  loading: boolean;
  sending: boolean;
  realtimeConnected: boolean;
  error: string | null;

  // True once the initial conversation fetch has settled (fulfilled OR
  // rejected) at least once — gates the page skeleton. Doesn't reset on
  // resetChat() being a fresh initialState spread, since that's meant to be
  // a full teardown (e.g. on logout), not a normal loading state.
  conversationLoaded: boolean;
};