import api from "../lib/api";

export async function getProfile() {
  const response = await api.get("/profile");
  return response.data;
}

export async function updateProfile(data) {
  const response = await api.patch("/profile", data);
  return response.data;
}

export async function getUserByUsername(username) {
  const response = await api.get(`/users/${username}`);
  return response.data;
}

export async function getUserMemes(username, params = {}) {
  const response = await api.get(`/users/${username}/memes`, { params });
  return response.data;
}

export async function toggleFollow(username) {
  const response = await api.post(`/users/${username}/follow`);
  return response.data;
}

/**
 * GET /users?q=query  — search users by name or username
 */
export async function searchUsers(query, params = {}) {
  const response = await api.get("/users", { params: { q: query, ...params } });
  return response.data;
}

/**
 * GET /users/suggested  — trending creators to follow
 */
export async function getSuggestedCreators(params = {}) {
  const response = await api.get("/users/suggested", { params });
  return response.data;
}

/**
 * GET /users/check-username?username=sadiqdev
 * Returns { available: bool }
 */
export async function checkUsername(username) {
  const response = await api.get("/users/check-username", { params: { username } });
  return response.data;
}
