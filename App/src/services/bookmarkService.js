import api from "../lib/api";

/**
 * GET /bookmarks — cursor-paginated list of saved memes.
 */
export async function getBookmarks(params = {}) {
  const response = await api.get("/bookmarks", { params });
  return response.data;
}

export async function bookmarkPost(slug) {
  const response = await api.post(`/memes/${slug}/bookmark`);
  return response.data;
}

export async function removeBookmark(slug) {
  const response = await api.delete(`/memes/${slug}/bookmark`);
  return response.data;
}
