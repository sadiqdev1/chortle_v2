import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  getBookmarks,
  bookmarkPost,
  removeBookmark,
} from "../services/bookmarkService";

export function useBookmarks(params = {}) {
  return useQuery({
    queryKey: ["bookmarks", params],
    queryFn: () => getBookmarks(params),
  });
}

export function useBookmarkPost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: bookmarkPost,

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["bookmarks"],
      });

      queryClient.invalidateQueries({
        queryKey: ["posts"],
      });
    },
  });
}

export function useRemoveBookmark() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: removeBookmark,

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["bookmarks"],
      });

      queryClient.invalidateQueries({
        queryKey: ["posts"],
      });
    },
  });
}
