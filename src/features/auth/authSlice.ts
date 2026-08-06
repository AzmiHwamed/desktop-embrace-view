// features/auth/authSlice.ts
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import { apiFetch, storeTokens, clearTokens, TOKEN_STORAGE_KEY } from "@/lib/api-client";

import type {
  AuthState,
  AuthUser,
  LoginCredentials,
  LoginResponse,
  RegisterCredentials,
  IdpProvider,
  ForgotPasswordPayload,
  ValidateOtpPayload,
  ResetPasswordPayload,
} from "./types";
import { getProviderToken } from "@/lib/oath-token";

const initialState: AuthState = {
  user: null,
  token: null,
  status: "idle",
  error: null,
  resetFlow: {
    step: "idle",
    email: null,
    resetPassToken: null,
    loading: false,
    error: null,
  },
};

export const login = createAsyncThunk<LoginResponse, LoginCredentials, { rejectValue: string }>(
  "auth/login",
  async (credentials, { rejectWithValue }) => {
    try {
      const data = await apiFetch<LoginResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify(credentials),
      });
      if (data && data.data && data.data.idToken) {
        storeTokens(data.data.idToken, data.data.refreshToken);
      }
      return data;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : "Unable to sign in");
    }
  }
);

export const register = createAsyncThunk<LoginResponse, RegisterCredentials, { rejectValue: string }>(
  "auth/register",
  async (credentials, { rejectWithValue }) => {
    try {
      const data = await apiFetch<LoginResponse>("/auth/register", {
        method: "POST",
        body: JSON.stringify(credentials),
      });
      if (data && data.data && data.data.idToken) {
        storeTokens(data.data.idToken, data.data.refreshToken);
      }
      return data;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : "Unable to create account");
    }
  }
);

export const loginWithProvider = createAsyncThunk<LoginResponse, IdpProvider, { rejectValue: string }>(
  "auth/loginWithProvider",
  async (provider, { rejectWithValue }) => {
    try {
      const token = await getProviderToken(provider);
      const data = await apiFetch<LoginResponse>("/auth/oauth", {
        method: "POST",
        body: JSON.stringify({ provider: provider, token: token }),
      });
      if (data && data.data && data.data.idToken) {
        storeTokens(data.data.idToken, data.data.refreshToken);
      }
      return data;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : "Unable to sign in");
    }
  }
);

export const fetchCurrentUser = createAsyncThunk<AuthUser, void, { rejectValue: string }>(
  "auth/me",
  async (_arg, { rejectWithValue }) => {
    try {
      return await apiFetch<AuthUser>("/auth/me");
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : "Session expired");
    }
  }
);

export const requestPasswordReset = createAsyncThunk<void, ForgotPasswordPayload, { rejectValue: string }>(
  "auth/requestPasswordReset",
  async (payload, { rejectWithValue }) => {
    try {
      await apiFetch("/auth/send-reset-mail", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : "Could not send reset email");
    }
  }
);

export const validateResetOtp = createAsyncThunk<{ resetPassToken: string }, ValidateOtpPayload, { rejectValue: string }>(
  "auth/validateResetOtp",
  async (payload, { rejectWithValue }) => {
    try {
      const res = await apiFetch<unknown>("/auth/validate-reset-mail", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      // Depending on whether the API response interceptor is enabled, this
      // endpoint can return the token directly, under `data`, or under a
      // second nested `data` property. Do not advance to the password form
      // unless a real token was received.
      const findResetPassToken = (value: unknown, depth = 0): string | null => {
        if (!value || typeof value !== "object" || depth > 2) return null;

        const record = value as Record<string, unknown>;
        if (typeof record.resetPassToken === "string" && record.resetPassToken.trim()) {
          return record.resetPassToken;
        }

        return findResetPassToken(record.data, depth + 1);
      };

      const resetPassToken = findResetPassToken(res);
      if (!resetPassToken) {
        throw new Error("The verification response did not include a reset token. Please request a new code.");
      }

      return { resetPassToken };
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : "Invalid code");
    }
  }
);

export const completePasswordReset = createAsyncThunk<void, ResetPasswordPayload, { rejectValue: string }>(
  "auth/completePasswordReset",
  async (payload, { rejectWithValue }) => {
    try {
      await apiFetch("/auth/reset-password", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : "Could not reset password");
    }
  }
);

function applyAuthSuccess(state: AuthState, payload: LoginResponse) {
  state.status = "authenticated";
  state.token = payload.data.idToken;
  state.user = payload.data.user;
}

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    restoreSession(state) {
      if (typeof window === "undefined") return;
      const token = window.localStorage.getItem(TOKEN_STORAGE_KEY);
      if (token) {
        state.token = token;
        state.status = "authenticated";
      }
    },
    logout(state) {
      clearTokens();
      state.user = null;
      state.token = null;
      state.status = "idle";
      state.error = null;
    },
    clearAuthError(state) {
      state.error = null;
    },
    resetPasswordFlowReset(state) {
      state.resetFlow = initialState.resetFlow;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        applyAuthSuccess(state, action.payload);
      })
      .addCase(login.rejected, (state, action) => {
        state.status = "error";
        state.error = action.payload || "Unable to sign in";
      })
      .addCase(register.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        applyAuthSuccess(state, action.payload);
      })
      .addCase(register.rejected, (state, action) => {
        state.status = "error";
        state.error = action.payload || "Unable to create account";
      })
      .addCase(loginWithProvider.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(loginWithProvider.fulfilled, (state, action) => {
        applyAuthSuccess(state, action.payload);
      })
      .addCase(loginWithProvider.rejected, (state, action) => {
        state.status = "error";
        state.error = action.payload || "Unable to sign in";
      })
      .addCase(fetchCurrentUser.fulfilled, (state, action) => {
        state.user = action.payload;
        state.status = "authenticated";
      })
      .addCase(fetchCurrentUser.rejected, (state) => {
        state.user = null;
        state.token = null;
        state.status = "idle";
      })
      .addCase(requestPasswordReset.pending, (state) => {
        state.resetFlow.loading = true;
        state.resetFlow.error = null;
      })
      .addCase(requestPasswordReset.fulfilled, (state, action) => {
        state.resetFlow.loading = false;
        state.resetFlow.step = "otp-sent";
        state.resetFlow.email = action.meta.arg.email;
      })
      .addCase(requestPasswordReset.rejected, (state, action) => {
        state.resetFlow.loading = false;
        state.resetFlow.error = action.payload || "Could not send reset email";
      })
      .addCase(validateResetOtp.pending, (state) => {
        state.resetFlow.loading = true;
        state.resetFlow.error = null;
      })
      .addCase(validateResetOtp.fulfilled, (state, action) => {
        state.resetFlow.loading = false;
        state.resetFlow.step = "otp-verified";
        state.resetFlow.resetPassToken = action.payload.resetPassToken;
      })
      .addCase(validateResetOtp.rejected, (state, action) => {
        state.resetFlow.loading = false;
        state.resetFlow.error = action.payload || "Invalid code";
      })
      .addCase(completePasswordReset.pending, (state) => {
        state.resetFlow.loading = true;
        state.resetFlow.error = null;
      })
      .addCase(completePasswordReset.fulfilled, (state) => {
        state.resetFlow.loading = false;
        state.resetFlow.step = "done";
      })
      .addCase(completePasswordReset.rejected, (state, action) => {
        state.resetFlow.loading = false;
        state.resetFlow.error = action.payload || "Could not reset password";
      });
  },
});

export const { restoreSession, logout, clearAuthError, resetPasswordFlowReset } = authSlice.actions;
export default authSlice.reducer;
