import axios from "axios";
import { authEvents } from "./authEvents";
import { storage } from "./storage";

const API_URL = process.env.EXPO_PUBLIC_API_URL;

if (!API_URL) {
  console.warn(
    "EXPO_PUBLIC_API_URL is not configured. Add it to your .env file."
  );
}

const api = axios.create({
  baseURL: API_URL,
  timeout: 12000,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

// ------------------------------------------------------------
// Request interceptor
// Automatically attaches the stored authentication token.
// ------------------------------------------------------------

api.interceptors.request.use(
  async (config) => {
    const token = await storage.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ------------------------------------------------------------
// Response interceptor
// Handles expired/invalid authentication and network errors.
// ------------------------------------------------------------

api.interceptors.response.use(
  (response) => response,

  async (error) => {
    // No response at all → network error
    if (!error.response) {
      const networkError = new Error(
        error.code === "ECONNABORTED"
          ? "Request timed out. Please check your connection and try again."
          : "Network error. Check your internet connection."
      );
      networkError.isNetworkError = true;
      networkError.originalError = error;
      return Promise.reject(networkError);
    }

    const { status, data } = error.response;

    // 401 — session expired
    if (status === 401) {
      await storage.clearAuth();
      authEvents.onSessionExpired();
    }

    // 422 — validation error (let callers handle field-level errors)
    // 429 — rate limit
    if (status === 429) {
      // Read the Retry-After header if present
      const retryAfter = error.response?.headers?.['retry-after'];
      const seconds = retryAfter ? parseInt(retryAfter, 10) : null;
      const message = seconds
        ? `Too many requests. Try again in ${seconds} second${seconds !== 1 ? "s" : ""}.`
        : "Too many requests. Please slow down.";
      const rateLimitError = new Error(message);
      rateLimitError.isRateLimited = true;
      rateLimitError.retryAfter = seconds;
      rateLimitError.response = error.response;
      return Promise.reject(rateLimitError);
    }

    // 500+ — server error
    if (status >= 500) {
      const serverError = new Error(
        data?.message || "Something went wrong on our end. Try again shortly."
      );
      serverError.isServerError = true;
      serverError.response = error.response;
      return Promise.reject(serverError);
    }

    return Promise.reject(error);
  }
);

export function getApiUrl() {
  return API_URL;
}

export default api;
