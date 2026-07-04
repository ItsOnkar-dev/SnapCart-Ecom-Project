// ── input types for what we SEND to the backend (form inputs) ──────────────────────
// these live here because they're tightly coupled to these specific API calls
// user.types.ts holds what comes BACK (the User shape)

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface ForgotPasswordInput {
  email: string;
}

export interface ResetPasswordInput {
  token: string;
  newPassword: string;
}

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
}
