import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createComment, deleteComment, getComments } from "../services/commentService";

/**
 * Fetch paginated comments. Now infinite-scroll capable.
 */
export function useComments(slug) {
  return useInfiniteQuery({
    queryKey: ["comments", slug],
    queryFn: ({ pageParam }) =>
      getComments(slug, pageParam ? { page: pageParam } : {}),
    initialPageParam: undefined,
    getNextPageParam: (lastPage) =>
      lastPage?.current_page < lastPage?.last_page
        ? lastPage.current_page + 1
        : undefined,
    enabled: Boolean(slug),
  });
}

/**
 * Post a comment — optimistic update then real refetch.
 * Also busts the feed so comment counts update in the card.
 */
export function useCreateComment(slug) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ body, parentId }) => createComment(slug, body, parentId),

    // Optimistically prepend comment
    onMutate: async ({ body }) => {
      await queryClient.cancelQueries({ queryKey: ["comments", slug] });
      const previous = queryClient.getQueryData(["comments", slug]);

      queryClient.setQueryData(["comments", slug], (old) => {
        if (!old) return old;
        const optimistic = {
          id: `optimistic-${Date.now()}`,
          body,
          created_at: new Date().toISOString(),
          replies_count: 0,
          user: null,
        };
        const firstPage = old.pages?.[0];
        if (!firstPage) return old;
        return {
          ...old,
          pages: [
            { ...firstPage, data: [optimistic, ...(firstPage.data ?? [])] },
            ...old.pages.slice(1),
          ],
        };
      });

      return { previous };
    },

    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["comments", slug], context.previous);
      }
    },

    onSuccess: () => {
      // Refetch the real comment list
      queryClient.invalidateQueries({ queryKey: ["comments", slug] });
      // Also bust the post so comments_count refreshes on the card
      queryClient.invalidateQueries({ queryKey: ["posts", slug] });
      // Bust all feed pages (comment count badge on PostCard)
      queryClient.invalidateQueries({
        predicate: (query) =>
          query.queryKey[0] === "posts" && typeof query.queryKey[1] === "object",
      });
    },
  });
}

/**
 * Delete a comment.
 */
export function useDeleteComment(slug) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (commentId) => deleteComment(commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", slug] });
      queryClient.invalidateQueries({ queryKey: ["posts", slug] });
    },
  });
}
