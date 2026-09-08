import { combineReducers, configureStore, isAction, type Middleware } from "@reduxjs/toolkit";

import accountReducer from "@/features/account/accountSlice";
import authReducer, {
  logout,
  continueAsGuest,
  login,
  register,
  loginWithProvider,
} from "@/features/auth/authSlice";
import { clearTokens } from "@/lib/api-client";
import { getSession } from "@/lib/session-lifecycle";
import { resetFirebaseSession } from "@/lib/firebase-session";
import convertReducer from "@/features/convert/convertSlice";
import dashboardReducer from "@/features/dashboard/dashboardSlice";
import expensesReducer from "@/features/expenses/expensesSlice";
import historyReducer from "@/features/history/historySlice";
import notificationsReducer from "@/features/notifications/notificationsSlice";
import scanReducer from "@/features/scan/scanSlice";
import settingsReducer from "@/features/settings/settingsSlice";
import faqReducer from "@/features/settings/faqSlice";
import chatReducer from "@/features/chat/chatSlice";
import i18nReducer from "@/features/i18n/i18nSlice";
import subscriptionReducer from "@/features/subscription/subscriptionSlice";
import budgetsReducer from "@/features/budgets/budgetSlice";

const reducers = combineReducers({
  auth: authReducer,
  dashboard: dashboardReducer,
  scan: scanReducer,
  convert: convertReducer,
  history: historyReducer,
  expenses: expensesReducer,
  notifications: notificationsReducer,
  account: accountReducer,
  settings: settingsReducer,
  faq: faqReducer,
  chat: chatReducer,
  i18n: i18nReducer,
  subscription: subscriptionReducer,
  budgets: budgetsReducer,
});

const isBoundary = (action: unknown) =>
  logout.match(action) ||
  continueAsGuest.match(action) ||
  login.pending.match(action) ||
  register.pending.match(action) ||
  loginWithProvider.pending.match(action);

export const makeStore = () => {
  // Track thunk requests per store so late results cannot refill cleared slices.
  const requests = new Map<string, number>();
  const sessionMiddleware: Middleware = () => (next) => (action) => {
    if (!isAction(action)) return next(action);
    if (isBoundary(action)) {
      clearTokens();
      requests.clear();
      void resetFirebaseSession().catch((error) =>
        console.error("Firebase sign-out failed", error),
      );
    }
    const meta = (action as { meta?: { requestId?: string; requestStatus?: string } }).meta;
    if (meta?.requestId) {
      if (meta.requestStatus === "pending") {
        requests.set(meta.requestId, getSession().generation);
      } else if (meta.requestStatus === "fulfilled" || meta.requestStatus === "rejected") {
        const generation = requests.get(meta.requestId);
        requests.delete(meta.requestId);
        if (generation !== getSession().generation) return action;
      }
    }
    return next(action);
  };
  return configureStore({
    reducer: (state: ReturnType<typeof reducers> | undefined, action) =>
      reducers(isBoundary(action) ? undefined : state, action),
    middleware: (getDefaultMiddleware) => getDefaultMiddleware().prepend(sessionMiddleware),
  });
};

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
