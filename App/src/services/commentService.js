import api from "../lib/api";

/**
 * GET /memes/{slug}/comments
 * Returns paginated top-level comments for a meme.
 */
export async function getComments(slug, params = {}) {
  const response = await api.get(`/memes/${slug}/comments`, { params });
  return response.data;
}

/**
 * GET /comments/{id}/replies
 */
export async function getReplies(commentId, params = {}) {
  const response = await api.get(`/comments/${commentId}/replies`, { params });
  return response.data;
}

/**
 * POST /memes/{slug}/comments
 * Creates a new top-level comment (or reply if parent_id is supplied).
 */
export async function createComment(slug, body, parentId = null) {
  const payload = { body };
  if (parentId) payload.parent_id = parentId;
  const response = await api.post(`/memes/${slug}/comments`, payload);
  return response.data;
}

/**
 * DELETE /comments/{id}
 */
export async function deleteComment(commentId) {
  const response = await api.delete(`/comments/${commentId}`);
  return response.data;
}
