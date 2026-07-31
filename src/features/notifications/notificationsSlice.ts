import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

import { notifications } from "@/lib/travel-data";

import type { NotificationsState } from "./types";

const initialState: NotificationsState = {
  items: notifications,
};

const notificationsSlice = createSlice({
  name: "notifications",
  initialState,
  reducers: {
    markRead(state, action: PayloadAction<string>) {
      const item = state.items.find((n) => n.id === action.payload);
      if (item) item.unread = false;
    },
    markAllRead(state) {
      state.items.forEach((n) => {
        n.unread = false;
      });
    },
  },
});

export const { markRead, markAllRead } = notificationsSlice.actions;
export default notificationsSlice.reducer;
