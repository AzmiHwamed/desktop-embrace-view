import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

import type { SettingsState } from "./types";

const initialState: SettingsState = {
  language: "English",
  currency: "EUR",
  rateAlerts: true,
  weeklyDigest: true,
  autoTranslate: true,
};

const settingsSlice = createSlice({
  name: "settings",
  initialState,
  reducers: {
    setLanguage(state, action: PayloadAction<string>) {
      state.language = action.payload;
    },
    setCurrency(state, action: PayloadAction<string>) {
      state.currency = action.payload;
    },
    toggleSetting(
      state,
      action: PayloadAction<"rateAlerts" | "weeklyDigest" | "autoTranslate">,
    ) {
      state[action.payload] = !state[action.payload];
    },
  },
});

export const { setLanguage, setCurrency, toggleSetting } = settingsSlice.actions;
export default settingsSlice.reducer;
