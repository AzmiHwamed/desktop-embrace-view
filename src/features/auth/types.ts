// features/auth/types.ts
export type AuthUser = {
  id: string;
  role: string;
  email: string;
  displayName: string;
  photoURL?: string;
  provider?: string;
  isActive: boolean;
  currentCountryId?: string | null;
  currencyId?: string | null;
  languageId?: string | null;
  currency?: { id: string; code: string; name: string };
  language?: { id: string; code: string; name: string };
};

export type LoginResponse = {
  status_code: number;
  title: string;
  body: string;
  data: {
    user: AuthUser;
    idToken: string;
    refreshToken: string;
  };
};

export type LoginCredentials = { email: string; password: string };
export type RegisterCredentials = { email: string; password: string };

export type IdpProvider = "google.com" | "facebook.com";

export type ForgotPasswordPayload = { email: string };
export type ValidateOtpPayload = { email: string; otp: string };
export type ResetPasswordPayload = {
  email: string;
  newPassword: string;
  resetPassToken: string;
};

export type ResetFlowStep = "idle" | "otp-sent" | "otp-verified" | "done";

export type ResetFlowState = {
  step: ResetFlowStep;
  email: string | null;
  resetPassToken: string | null;
  loading: boolean;
  error: string | null;
};

export type AuthStatus = "idle" | "loading" | "authenticated" | "error";

export type AuthState = {
  user: AuthUser | null;
  token: string | null;
  status: AuthStatus;
  error: string | null;
  resetFlow: ResetFlowState;
};

// A user is considered "onboarded" once they've picked all three —
// used to decide login/signup/oauth → onboarding vs. dashboard.
export function isProfileComplete(user: AuthUser | null): boolean {
  if (!user) return false;
  return Boolean(user.currencyId && user.currentCountryId && user.languageId);
}