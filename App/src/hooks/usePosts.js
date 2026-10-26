
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  getPosts,
  getPost,
  createPost,
  updatePost,
  deletePost,
} from "../services/postService";

export function usePosts(params = {}) {
  return useInfiniteQuery({
    queryKey: ["posts", params],
    queryFn: ({ pageParam }) =>
      getPosts({
        ...params,
        ...(pageParam ? { cursor: pageParam } : {}),
      }),
    initialPageParam: undefined,
    getNextPageParam: (lastPage) =>
      lastPage?.meta?.next_cursor ?? undefined,
  });
}

export function usePost(slug) {
  return useQuery({
    queryKey: ["post", slug],
    queryFn: () => getPost(slug),
    enabled: Boolean(slug),
  });
}

export function useCreatePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createPost,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["posts"] }),
  });
}

export function useUpdatePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ slug, data }) => updatePost(slug, data),
    onSuccess: async (_, { slug }) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["posts"] }),
        queryClient.invalidateQueries({ queryKey: ["post", slug] }),
      ]);
    },
  });
}

export function useDeletePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deletePost,
    onSuccess: async (_, slug) => {
      queryClient.removeQueries({ queryKey: ["post", slug] });
      await queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
  });
}
