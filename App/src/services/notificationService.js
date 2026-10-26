import api from "../lib/api";

/**
 * GET /notifications — paginated list for the authenticated user.
 */
export async function getNotifications(params = {}) {
  const response = await api.get("/notifications", { params });
  return response.data;
}

/**
 * POST /notifications/{id}/read — mark a single notification read.
 */
export async function markNotificationRead(id) {
  const response = await api.post(`/notifications/${id}/read`);
  return response.data;
}

/**
 * POST /notifications/read-all — mark every notification read.
 */
export async function markAllNotificationsRead() {
  const response = await api.post("/notifications/read-all");
  return response.data;
}
