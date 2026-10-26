import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createComment, deleteComment, getReplies } from "../services/commentService";

export function useReplies(commentId, enabled = false) {
  return useQuery({
    queryKey: ["replies", commentId],
    queryFn: () => getReplies(commentId),
    enabled: Boolean(commentId) && enabled,
  });
}

export function useCreateReply(slug) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ body, parentId }) => createComment(slug, body, parentId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["replies", variables.parentId] });
      queryClient.invalidateQueries({ queryKey: ["comments", slug] });
      queryClient.invalidateQueries({ queryKey: ["posts", slug] });
    },
  });
}

export function useDeleteReply(commentId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteComment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["replies", commentId] });
    },
  });
}
