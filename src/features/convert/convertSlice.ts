import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

import type { ConvertState } from "./types";

const initialState: ConvertState = {
  amount: 100,
  from: "EUR",
  to: "JPY",
  rate: 169.24,
};

const convertSlice = createSlice({
  name: "convert",
  initialState,
  reducers: {
    setAmount(state, action: PayloadAction<number>) {
      state.amount = action.payload;
    },
    setFrom(state, action: PayloadAction<string>) {
      state.from = action.payload;
    },
    setTo(state, action: PayloadAction<string>) {
      state.to = action.payload;
    },
    swapCurrencies(state) {
      const from = state.from;
      state.from = state.to;
      state.to = from;
      state.rate = Number((1 / state.rate).toFixed(4));
    },
  },
});

export const { setAmount, setFrom, setTo, swapCurrencies } = convertSlice.actions;
export default convertSlice.reducer;
