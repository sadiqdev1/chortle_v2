/**
 * Deep link intent handler for Expo Router.
 *
 * Handles incoming URLs like:
 *   chortle://post/my-meme-slug     → /PostView?slug=my-meme-slug
 *   chortle://user/sadiqdev        → /UserProfile?username=sadiqdev
 *
 * https://docs.expo.dev/router/reference/native-intent/
 */
export function redirectSystemPath({ path, initial }) {
  // chortle://post/:slug  → /PostView with slug param
  const postMatch = path.match(/^\/post\/(.+)$/);
  if (postMatch) {
    return `/PostView?slug=${encodeURIComponent(postMatch[1])}`;
  }

  // chortle://user/:username → /UserProfile with username param
  const userMatch = path.match(/^\/user\/(.+)$/);
  if (userMatch) {
    return `/UserProfile?username=${encodeURIComponent(userMatch[1])}`;
  }

  // Legacy: chortle://PostView?slug=... passes through unchanged
  return path;
}
