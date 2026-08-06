// store/chat/chatSlice.ts
import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit";

import type { ChatState, Conversation, Message } from "./types";
import { apiFetch, type ApiResponse } from "@/lib/api-client";

const initialState: ChatState = {
  conversation: null,
  messages: [],
  loading: false,
  sending: false,
  realtimeConnected: false,
  error: null,
  conversationLoaded: false,
};

export const fetchMyConversation = createAsyncThunk(
  "chat/fetchMyConversation",
  async () => {
    const res = await apiFetch<ApiResponse<Conversation>>("/chat/conversations/me");
    return res.data;
  },
);

export const fetchMessages = createAsyncThunk(
  "chat/fetchMessages",
  async (conversationId: string) => {
    const res = await apiFetch<ApiResponse<Message[]>>(
      `/chat/conversations/${conversationId}/messages`,
    );
    return res.data;
  },
);

export const sendMessage = createAsyncThunk(
  "chat/sendMessage",
  async (payload: { conversationId: string; body: string }) => {
    const res = await apiFetch<ApiResponse<Message>>(
      `/chat/conversations/${payload.conversationId}/messages`,
      { method: "POST", body: JSON.stringify({ body: payload.body }) },
    );
    return res.data;
  },
);

export const markConversationRead = createAsyncThunk(
  "chat/markRead",
  async (conversationId: string) => {
    await apiFetch<ApiResponse<void>>(`/chat/conversations/${conversationId}/read`, {
      method: "PATCH",
    });
  },
);

function upsertMessage(state: ChatState, message: Message) {
  const existingIndex = state.messages.findIndex((m) => m.id === message.id);
  if (existingIndex !== -1) {
    state.messages[existingIndex] = message;
    return;
  }
  state.messages.push(message);
  state.messages.sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );
}

const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    // Fed by the Firebase Realtime Database listener — same shape as the
    // REST message, just arriving over RTDB instead.
    realtimeMessageReceived(state, action: PayloadAction<Message>) {
      upsertMessage(state, action.payload);
    },
    realtimeConnectionChanged(state, action: PayloadAction<boolean>) {
      state.realtimeConnected = action.payload;
    },
    resetChat() {
      return initialState;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMyConversation.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMyConversation.fulfilled, (state, action) => {
        state.loading = false;
        state.conversationLoaded = true;
        state.conversation = action.payload;
      })
      .addCase(fetchMyConversation.rejected, (state, action) => {
        state.loading = false;
        state.conversationLoaded = true;
        state.error = action.error.message ?? "Failed to start conversation";
      })
      .addCase(fetchMessages.fulfilled, (state, action) => {
        state.messages = action.payload;
      })
      .addCase(sendMessage.pending, (state) => {
        state.sending = true;
        state.error = null;
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        state.sending = false;
        upsertMessage(state, action.payload);
      })
      .addCase(sendMessage.rejected, (state, action) => {
        state.sending = false;
        state.error = action.error.message ?? "Message failed to send";
      });
  },
});

export const { realtimeMessageReceived, realtimeConnectionChanged, resetChat } =
  chatSlice.actions;
export default chatSlice.reducer;