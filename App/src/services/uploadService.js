import api from "../lib/api";

const MIME_MAP = {
  jpg:  "image/jpeg",
  jpeg: "image/jpeg",
  png:  "image/png",
  gif:  "image/gif",
  webp: "image/webp",
  heic: "image/heic",
};

/**
 * Upload a local file URI and return the hosted URL.
 *
 * @param {string} uri     - local file URI from ImagePicker
 * @param {'avatar'|'cover'|'meme'} context
 * @returns {Promise<string>} the hosted URL
 * @throws if network fails, server rejects, or no URL is returned
 */
export async function uploadFile(uri, context = "meme") {
  if (!uri) throw new Error("No file selected.");

  const filename = uri.split("/").pop() ?? `upload.jpg`;
  const ext = filename.split(".").pop()?.toLowerCase() ?? "jpg";
  const type = MIME_MAP[ext] ?? "image/jpeg";

  const form = new FormData();
  form.append("file", { uri, name: filename, type });
  form.append("context", context);

  const response = await api.post("/upload", form, {
    headers: { "Content-Type": "multipart/form-data" },
    timeout: 30_000, // uploads can be slow — 30s
  });

  const url = response.data?.url;
  if (!url) throw new Error("Upload succeeded but no URL was returned.");
  return url;
}

/**
 * Delete a previously uploaded file by its path.
 */
export async function deleteFile(path) {
  if (!path) return;
  await api.delete("/upload", { data: { path } });
}
