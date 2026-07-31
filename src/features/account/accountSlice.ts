import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

import type { AccountState, Profile } from "./types";

const initialState: AccountState = {
  profile: {
    name: "Alex Lang",
    email: "alex@smarttravel.app",
    city: "Lisbon",
    homeCurrency: "EUR",
  },
  saving: false,
};

const accountSlice = createSlice({
  name: "account",
  initialState,
  reducers: {
    updateProfile(state, action: PayloadAction<Partial<Profile>>) {
      state.profile = { ...state.profile, ...action.payload };
    },
    setSaving(state, action: PayloadAction<boolean>) {
      state.saving = action.payload;
    },
  },
});

export const { updateProfile, setSaving } = accountSlice.actions;
export default accountSlice.reducer;
