/**
 * Minimal event emitter for auth lifecycle events.
 *
 * This exists because the axios interceptor runs outside React,
 * so it cannot call router.replace() or setUser() directly.
 * Instead it fires an event here, and AuthContext listens for it
 * to clear state — which then causes the root layout to redirect.
 */

const listeners = new Set();

export const authEvents = {
  /** Notify all listeners that the session has been invalidated. */
  onSessionExpired() {
    listeners.forEach((fn) => fn());
  },

  /** Subscribe to session-expired events. Returns an unsubscribe function. */
  subscribe(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },
};
