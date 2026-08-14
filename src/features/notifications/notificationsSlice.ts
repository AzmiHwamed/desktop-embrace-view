// features/notifications/notificationsSlice.ts
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import { apiFetch } from "@/lib/api-client";

import type {
  ApiNotification,
  AppNotification,
  NotificationsState,
  NotificationTone,
} from "./types";

type ApiResponse<T> = {
  status_code: number;
  title: string;
  body: string;
  data: T;
};

const initialState: NotificationsState = {
  items: [],

  loading: false,
  error: null,

  notificationsLoaded: false,

  markAllPending: false,
};

// Set `data.type` when emitting NotificationDispatchEvent on the backend
// (e.g. { type: 'expense' }) to control this deterministically. Falls back
// to a title keyword guess for notifications that don't set it.
function resolveTone(n: ApiNotification): NotificationTone {
  const type = n.data?.type;

  if (type === "expense" || type === "rate-alert") return "brand";
  if (type === "nearby-place") return "brand";
  if (type === "warning" || type === "budget") return "warning";
  if (type === "security") return "muted";
  if (type === "success") return "success";

  const title = n.title.toLowerCase();

  if (title.includes("security") || title.includes("sign-in")) return "muted";
  if (title.includes("alert") || title.includes("budget")) return "warning";
  if (title.includes("expense") || title.includes("rate")) return "brand";

  return "success";
}

function toRelativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.round(diffMs / 60000);

  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

function mapApiNotification(n: ApiNotification): AppNotification {
  return {
    id: n.id,
    title: n.title,
    body: n.body,
    time: toRelativeTime(n.createdAt),
    tone: resolveTone(n),
    unread: !n.read,
    data: n.data,
  };
}

// =====================
// FETCH MY NOTIFICATIONS
// =====================

export const fetchNotifications = createAsyncThunk<
  AppNotification[],
  void,
  { rejectValue: string }
>(
  "notifications/fetchAll",

  async (_, { rejectWithValue }) => {
    try {
      const response = await apiFetch<ApiResponse<ApiNotification[]>>(
        "/notifications/me",
      );

      return response.data.map(mapApiNotification);
    } catch (error) {
      return rejectWithValue(
        error instanceof Error
          ? error.message
          : "Unable to load notifications",
      );
    }
  },
);

// =====================
// MARK ONE READ
// =====================

export const markRead = createAsyncThunk<
  string,
  string,
  { rejectValue: string }
>(
  "notifications/markRead",

  async (id, { rejectWithValue }) => {
    try {
      await apiFetch<ApiResponse<ApiNotification>>(
        `/notifications/${id}/read`,
        { method: "PATCH" },
      );

      return id;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error
          ? error.message
          : "Unable to mark notification as read",
      );
    }
  },
);

// =====================
// MARK ALL READ
// =====================

export const markAllRead = createAsyncThunk<
  void,
  void,
  { rejectValue: string }
>(
  "notifications/markAllRead",

  async (_, { rejectWithValue }) => {
    try {
      await apiFetch<ApiResponse<{ updated: boolean }>>(
        "/notifications/me/read-all",
        { method: "PATCH" },
      );
    } catch (error) {
      return rejectWithValue(
        error instanceof Error
          ? error.message
          : "Unable to mark all as read",
      );
    }
  },
);

// =====================
// REGISTER DEVICE TOKEN (push)
// =====================

export const registerDevice = createAsyncThunk<
  void,
  { userId: string; deviceToken: string; platform: "web" | "ios" | "android" },
  { rejectValue: string }
>(
  "notifications/registerDevice",

  async (params, { rejectWithValue }) => {
    try {
      await apiFetch("/notifications/devices", {
        method: "POST",
        body: JSON.stringify({
          userId: params.userId,
          token: params.deviceToken,
          platform: params.platform,
        }),
      });
    } catch (error) {
      return rejectWithValue(
        error instanceof Error
          ? error.message
          : "Unable to register device for push notifications",
      );
    }
  },
);

const notificationsSlice = createSlice({
  name: "notifications",

  initialState,

  reducers: {
    // For inserting a notification the moment it arrives via onMessage
    // (foreground push) without waiting on a refetch.
    notificationReceived(state, action: { payload: AppNotification }) {
      state.items.unshift(action.payload);
    },
  },

  extraReducers(builder) {
    builder

      // =====================
      // FETCH
      // =====================

      .addCase(fetchNotifications.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.loading = false;
        state.notificationsLoaded = true;

        state.items = action.payload;
      })

      .addCase(fetchNotifications.rejected, (state, action) => {
        state.loading = false;
        state.notificationsLoaded = true;

        state.error = action.payload ?? "Unable to load notifications";
      })

      // =====================
      // MARK READ
      // =====================

      .addCase(markRead.fulfilled, (state, action) => {
        const item = state.items.find((n) => n.id === action.payload);
        if (item) item.unread = false;
      })

      .addCase(markRead.rejected, (state, action) => {
        state.error = action.payload ?? "Unable to mark notification as read";
      })

      // =====================
      // MARK ALL READ
      // =====================

      .addCase(markAllRead.pending, (state) => {
        state.markAllPending = true;
        state.error = null;
      })

      .addCase(markAllRead.fulfilled, (state) => {
        state.markAllPending = false;

        state.items.forEach((n) => {
          n.unread = false;
        });
      })

      .addCase(markAllRead.rejected, (state, action) => {
        state.markAllPending = false;

        state.error = action.payload ?? "Unable to mark all as read";
      });
  },
});

export const { notificationReceived } = notificationsSlice.actions;

export default notificationsSlice.reducer;
