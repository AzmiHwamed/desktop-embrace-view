import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

import { transactions } from "@/lib/travel-data";

import type { HistoryState } from "./types";

const initialState: HistoryState = {
  query: "",
  category: "All",
  items: transactions,
};

const historySlice = createSlice({
  name: "history",
  initialState,
  reducers: {
    setQuery(state, action: PayloadAction<string>) {
      state.query = action.payload;
    },
    setCategory(state, action: PayloadAction<string>) {
      state.category = action.payload;
    },
  },
});

export const { setQuery, setCategory } = historySlice.actions;
export default historySlice.reducer;
