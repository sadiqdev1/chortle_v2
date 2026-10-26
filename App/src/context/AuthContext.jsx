import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  getUser,
  login as loginRequest,
  logout as logoutRequest,
  register as registerRequest,
} from "../services/authService";

import { authEvents } from "../lib/authEvents";
import { storage } from "../lib/storage";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  const isAuthenticated = Boolean(user);

  // ── Restore session ────────────────────────────────────
  const restoreSession = useCallback(async () => {
    try {
      const token = await storage.getToken();

      if (!token) {
        setLoading(false);
        return;
      }

      // Restore from local cache immediately so the UI unblocks
      const storedUser = await storage.getUser();
      if (storedUser) setUser(storedUser);

      setLoading(false);

      // Background refresh from API
      try {
        const response  = await getUser();
        const freshUser = response?.data ?? response;

        if (freshUser?.id) {
          setUser(freshUser);
          await storage.setUser(freshUser);
        }
      } catch {
        // 401 handled by axios interceptor; other failures are silent
      }
    } catch {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  // ── 401 event bus ──────────────────────────────────────
  useEffect(() => {
    const unsubscribe = authEvents.subscribe(() => setUser(null));
    return unsubscribe;
  }, []);

  // ── Login ──────────────────────────────────────────────
  const login = useCallback(async (credentials) => {
    const response      = await loginRequest(credentials);
    const token         = response?.data?.token;
    const loggedInUser  = response?.data?.user;

    if (!token) throw new Error("Login succeeded but no token was returned.");

    await storage.setToken(token);

    if (loggedInUser) {
      await storage.setUser(loggedInUser);
      setUser(loggedInUser);
    } else {
      const fresh = await getUser();
      const u     = fresh?.data ?? fresh;
      if (u?.id) {
        await storage.setUser(u);
        setUser(u);
      }
    }

    // Register push token after login
    try {
      const { registerForPushNotifications } = await import("../lib/pushNotifications");
      await registerForPushNotifications();
    } catch {}

    return response;
  }, []);

  // ── Register ───────────────────────────────────────────
  // IMPORTANT: We store the token but do NOT set user state here.
  // Setting user would trigger AuthGuard to redirect to /(tabs),
  // bypassing OtpVerification and CompleteProfile.
  // User state is set only after verifyAndActivate() is called.
  const register = useCallback(async (data) => {
    const response        = await registerRequest(data);
    const token           = response?.data?.token;

    if (token) {
      // Store token so OTP resend endpoint (auth:sanctum) works
      await storage.setToken(token);
    }

    // ⚠️  Do NOT call setUser here — stays null until email verified
    return response;
  }, []);

  // ── Activate account after OTP verified ───────────────
  // Called by OtpVerification after a successful email verify.
  const activateSession = useCallback(async () => {
    try {
      const response  = await getUser();
      const freshUser = response?.data ?? response;
      if (freshUser?.id) {
        await storage.setUser(freshUser);
        setUser(freshUser);

        // Register for push notifications after account activation
        try {
          const { registerForPushNotifications } = await import("../lib/pushNotifications");
          await registerForPushNotifications();
        } catch {}
      }
    } catch {
      // If this fails the user will hit the AuthGuard and land on /welcome
    }
  }, []);

  // ── Logout ─────────────────────────────────────────────
  const logout = useCallback(async () => {
    // Unregister push token before clearing session
    try {
      const { unregisterPushToken } = await import("../lib/pushNotifications");
      await unregisterPushToken();
    } catch {}

    try {
      await logoutRequest();
    } finally {
      await storage.clearAuth();
      setUser(null);
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated,
      login,
      register,
      activateSession,
      logout,
      restoreSession,
    }),
    [user, loading, isAuthenticated, login, register, activateSession, logout, restoreSession]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
