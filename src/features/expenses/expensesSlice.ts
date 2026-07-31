import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

import { spendByCategory } from "@/lib/travel-data";

import type { ExpenseRange, ExpensesState } from "./types";

const initialState: ExpensesState = {
  range: "week",
  budget: 1200,
  byCategory: spendByCategory,
};

const expensesSlice = createSlice({
  name: "expenses",
  initialState,
  reducers: {
    setExpenseRange(state, action: PayloadAction<ExpenseRange>) {
      state.range = action.payload;
    },
    setBudget(state, action: PayloadAction<number>) {
      state.budget = action.payload;
    },
  },
});

export const { setExpenseRange, setBudget } = expensesSlice.actions;
export default expensesSlice.reducer;
