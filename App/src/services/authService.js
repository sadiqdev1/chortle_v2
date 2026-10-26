import api from "../lib/api";

export async function login(credentials) {
  const response = await api.post("/auth/login", credentials);
  return response.data;
}

export async function register(data) {
  const response = await api.post("/auth/register", data);
  return response.data;
}

export async function logout() {
  const response = await api.post("/auth/logout");
  return response.data;
}

export async function getUser() {
  const response = await api.get("/profile");
  return response.data;
}

/**
 * Request a password reset code — sends OTP via Sendlib.
 */
export async function forgotPassword(email) {
  const response = await api.post("/auth/forgot-password", { email });
  return response.data;
}

/**
 * Verify OTP code + set new password.
 */
export async function resetPassword(data) {
  // data: { email, code, password, password_confirmation }
  const response = await api.post("/auth/reset-password", data);
  return response.data;
}

export async function resendPasswordReset(email) {
  const response = await api.post("/auth/forgot-password", { email });
  return response.data;
}

/**
 * Verify email with 6-digit OTP.
 * data: { email, code }
 */
export async function verifyEmail(data) {
  const response = await api.post("/auth/verify-email", data);
  return response.data;
}

/**
 * Resend email verification code (requires auth token).
 */
export async function resendVerification() {
  const response = await api.post("/auth/resend-verification");
  return response.data;
}
