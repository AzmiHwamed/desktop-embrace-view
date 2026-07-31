export type CategorySlice = { name: string; value: number; color: string };
export type ExpenseRange = "week" | "month" | "trip";

export type ExpensesState = {
  range: ExpenseRange;
  budget: number;
  byCategory: CategorySlice[];
};
