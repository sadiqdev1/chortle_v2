
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useQueryClient } from "@tanstack/react-query";

import { getBookmarks } from "../services/bookmarkService";
import {
  toggleBookmarkApi,
  toggleLikeApi,
} from "../services/postService";

const BookmarksContext = createContext(null);

function normalizeReactionCounts(reactions) {
  if (Array.isArray(reactions)) {
    return reactions.reduce((counts, reaction) => {
      if (typeof reaction === "string") {
        counts[reaction] = (counts[reaction] ?? 0) + 1;
      } else if (reaction?.type) {
        counts[reaction.type] =
          Number(reaction.count ?? reaction.counts ?? 1);
      }

      return counts;
    }, {});
  }

  if (reactions && typeof reactions === "object") {
    return Object.fromEntries(
      Object.entries(reactions).map(([type, count]) => [
        type,
        Number(count) || 0,
      ])
    );
  }

  return {};
}

export function BookmarksProvider({ children }) {
  const queryClient = useQueryClient();

  const [bookmarkMap, setBookmarkMap] = useState({});
  const [reactionMap, setReactionMap] = useState({});

  const bookmarkInFlight = useRef({});
  const reactionInFlight = useRef({});

  // Load saved posts using Laravel's page-based pagination.
  useEffect(() => {
    let active = true;

    async function fetchBookmarks() {
      try {
        for (let page = 1; page <= 3; page += 1) {
          const response = await getBookmarks({ page });

          if (!active) return;

          const memes = response?.data ?? [];

          if (!Array.isArray(memes) || memes.length === 0) {
            break;
          }

          setBookmarkMap((previous) => {
            const next = { ...previous };

            memes.forEach((meme) => {
              if (meme?.id != null) {
                const id = String(meme.id);

                // Do not overwrite a newer local bookmark action.
                if (!bookmarkInFlight.current[id]) {
                  next[id] = meme;
                }
              }
            });

            return next;
          });

          const currentPage = Number(response?.current_page ?? page);
          const lastPage = Number(response?.last_page ?? currentPage);

          if (currentPage >= lastPage) break;
        }
      } catch {
        // Keep the app usable if bookmarks cannot be loaded.
      }
    }

    fetchBookmarks();

    return () => {
      active = false;
    };
  }, []);

  // ── Bookmarks ──────────────────────────────────────────

  const toggleBookmark = useCallback(
    async (post) => {
      const rawId = typeof post === "object" ? post?.id : post;

      if (rawId == null) return;

      const id = String(rawId);
      const slug =
        typeof post === "object" ? (post.slug ?? rawId) : rawId;
      const postObject = typeof post === "object" ? post : null;

      if (bookmarkInFlight.current[id]) return;

      bookmarkInFlight.current[id] = true;

      let previousValue;
      let wasBookmarked;

      setBookmarkMap((previous) => {
        previousValue = previous[id];
        wasBookmarked = Boolean(previousValue);

        const next = { ...previous };

        if (wasBookmarked) {
          delete next[id];
        } else {
          next[id] = postObject ?? true;
        }

        return next;
      });

      try {
        const result = await toggleBookmarkApi(slug);

        // Trust the server's confirmed bookmark state.
        if (typeof result?.bookmarked === "boolean") {
          setBookmarkMap((previous) => {
            const next = { ...previous };

            if (result.bookmarked) {
              next[id] = postObject ?? previousValue ?? true;
            } else {
              delete next[id];
            }

            return next;
          });
        }

        await queryClient.invalidateQueries({
          queryKey: ["posts"],
        });
      } catch {
        // Roll back this post only.
        setBookmarkMap((previous) => {
          const next = { ...previous };

          if (wasBookmarked) {
            next[id] = previousValue;
          } else {
            delete next[id];
          }

          return next;
        });
      } finally {
        delete bookmarkInFlight.current[id];
      }
    },
    [queryClient]
  );

  const isBookmarked = useCallback(
    (id) => id != null && Boolean(bookmarkMap[String(id)]),
    [bookmarkMap]
  );

  const savedPosts = useMemo(
    () =>
      Object.values(bookmarkMap).filter(
        (post) => post && typeof post === "object"
      ),
    [bookmarkMap]
  );

  const bookmarks = useMemo(
    () =>
      Object.fromEntries(
        Object.keys(bookmarkMap).map((id) => [id, true])
      ),
    [bookmarkMap]
  );

  // ── Reactions ──────────────────────────────────────────

  const getReactionState = useCallback(
    (post) => {
      const id = post?.id;

      if (id == null) {
        return { active: null, counts: {} };
      }

      const key = String(id);
      const local = reactionMap[key];

      if (local) {
        return {
          active: local.active,
          counts: { ...local.counts },
        };
      }

      return {
        active: post?.my_reaction ?? null,
        counts: normalizeReactionCounts(post?.reactions),
      };
    },
    [reactionMap]
  );

  const toggleReaction = useCallback(
    async (post, reactionId) => {
      if (post?.id == null || !reactionId) return;

      const id = String(post.id);

      if (reactionInFlight.current[id]) return;

      reactionInFlight.current[id] = true;

      const previousLocal = reactionMap[id];
      const current = getReactionState(post);

      const newActive =
        current.active === reactionId ? null : reactionId;

      const nextCounts = { ...current.counts };

      if (current.active) {
        nextCounts[current.active] = Math.max(
          0,
          (nextCounts[current.active] ?? 0) - 1
        );
      }

      if (newActive) {
        nextCounts[newActive] = (nextCounts[newActive] ?? 0) + 1;
      }

      // Optimistic update for immediate feedback.
      setReactionMap((previous) => ({
        ...previous,
        [id]: {
          active: newActive,
          counts: nextCounts,
        },
      }));

      try {
        await toggleLikeApi(post.id, reactionId);
      } catch {
        // Roll back only this post's reaction.
        setReactionMap((previous) => {
          const next = { ...previous };

          if (previousLocal) {
            next[id] = previousLocal;
          } else {
            delete next[id];
          }

          return next;
        });

        return;
      } finally {
        delete reactionInFlight.current[id];
      }

      // The API returns total reaction count, not per-type counts.
      // Refetch the feed to get authoritative counts and my_reaction.
      try {
        await queryClient.invalidateQueries({
          queryKey: ["posts"],
        });

        setReactionMap((previous) => {
          const next = { ...previous };
          delete next[id];
          return next;
        });
      } catch {
        // Keep the optimistic state if refreshing the feed fails.
      }
    },
    [getReactionState, queryClient, reactionMap]
  );

  const value = useMemo(
    () => ({
      bookmarks,
      bookmarkMap,
      toggleBookmark,
      isBookmarked,
      savedPosts,
      getReactionState,
      toggleReaction,
    }),
    [
      bookmarks,
      bookmarkMap,
      toggleBookmark,
      isBookmarked,
      savedPosts,
      getReactionState,
      toggleReaction,
    ]
  );

  return (
    <BookmarksContext.Provider value={value}>
      {children}
    </BookmarksContext.Provider>
  );
}

export function useBookmarks() {
  const context = useContext(BookmarksContext);

  if (!context) {
    throw new Error(
      "useBookmarks must be used within a BookmarksProvider"
    );
  }

  return context;
}
