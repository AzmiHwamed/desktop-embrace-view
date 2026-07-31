import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import { apiFetch, TOKEN_STORAGE_KEY } from "@/lib/api-client";

import type { AuthState, AuthUser, LoginCredentials, LoginResponse } from "./types";

const initialState: AuthState = {
  user: null,
  token: null,
  status: "idle",
  error: null,
};

export const login = createAsyncThunk<LoginResponse, LoginCredentials, { rejectValue: string }>(
  "auth/login",
  async (credentials, { rejectWithValue }) => {
    try {
      const data = await apiFetch<LoginResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify(credentials),
      });
      if (typeof window !== "undefined" && data?.token) {
        window.localStorage.setItem(TOKEN_STORAGE_KEY, data.token);
      }
      return data;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : "Unable to sign in");
    }
  },
);

export const fetchCurrentUser = createAsyncThunk<AuthUser, void, { rejectValue: string }>(
  "auth/me",
  async (_, { rejectWithValue }) => {
    try {
      return await apiFetch<AuthUser>("/auth/me");
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : "Session expired");
    }
  },
);

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
      if (typeof window !== "undefined") {
        window.localStorage.removeItem(TOKEN_STORAGE_KEY);
      }
      state.user = null;
      state.token = null;
      state.status = "idle";
      state.error = null;
    },
    clearAuthError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.status = "authenticated";
        state.token = action.payload.token;
        state.user = action.payload.user;
      })
      .addCase(login.rejected, (state, action) => {
        state.status = "error";
        state.error = action.payload ?? "Unable to sign in";
      })
      .addCase(fetchCurrentUser.fulfilled, (state, action) => {
        state.user = action.payload;
        state.status = "authenticated";
      })
      .addCase(fetchCurrentUser.rejected, (state) => {
        state.user = null;
        state.token = null;
        state.status = "idle";
      });
  },
});

export const { restoreSession, logout, clearAuthError } = authSlice.actions;
export default authSlice.reducer;
