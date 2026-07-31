import { configureStore } from "@reduxjs/toolkit";

import accountReducer from "@/features/account/accountSlice";
import authReducer from "@/features/auth/authSlice";
import convertReducer from "@/features/convert/convertSlice";
import dashboardReducer from "@/features/dashboard/dashboardSlice";
import expensesReducer from "@/features/expenses/expensesSlice";
import historyReducer from "@/features/history/historySlice";
import notificationsReducer from "@/features/notifications/notificationsSlice";
import scanReducer from "@/features/scan/scanSlice";
import settingsReducer from "@/features/settings/settingsSlice";

export const makeStore = () =>
  configureStore({
    reducer: {
      auth: authReducer,
      dashboard: dashboardReducer,
      scan: scanReducer,
      convert: convertReducer,
      history: historyReducer,
      expenses: expensesReducer,
      notifications: notificationsReducer,
      account: accountReducer,
      settings: settingsReducer,
    },
  });

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
