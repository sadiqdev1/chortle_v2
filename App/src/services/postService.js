import api from "../lib/api";

export async function getPosts(params = {}) {
  const response = await api.get("/memes", {
    params,
  });

  return response.data;
}

export async function getPost(slug) {
  const response = await api.get(`/memes/${slug}`);
  // Backend returns { data: meme }
  return response.data;
}

export async function createPost(data) {
  const response = await api.post("/memes", data);

  return response.data;
}

export async function updatePost(slug, data) {
  const response = await api.post(`/memes/${slug}`, data);

  return response.data;
}

export async function deletePost(slug) {
  const response = await api.delete(`/memes/${slug}`);

  return response.data;
}

// POST /memes/{slug}/bookmark — toggle (returns { bookmarked: bool })
export async function toggleBookmarkApi(slug) {
  const response = await api.post(`/memes/${slug}/bookmark`);
  return response.data;
}

// POST /memes/{meme}/like — toggle reaction (returns { reacted: bool, reactions_count: number })
export async function toggleLikeApi(memeId, reactionType = "like") {
  const response = await api.post(`/memes/${memeId}/like`, { type: reactionType });
  return response.data;
}

// POST /memes/{slug}/report
export async function reportPost(slug, reason, description = null) {
  const response = await api.post(`/memes/${slug}/report`, {
    reason,
    ...(description ? { description } : {}),
  });
  return response.data;
}
