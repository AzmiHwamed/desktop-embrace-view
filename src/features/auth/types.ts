export type AuthUser = {
  id: string;
  name: string;
  email: string;
  homeCurrency?: string;
  city?: string;
};

export type LoginCredentials = {
  email: string;
  password: string;
};

export type LoginResponse = {
  token: string;
  user: AuthUser;
};

export type AuthStatus = "idle" | "loading" | "authenticated" | "error";

export type AuthState = {
  user: AuthUser | null;
  token: string | null;
  status: AuthStatus;
  error: string | null;
};
