
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  checkUsername,
  getProfile,
  getSuggestedCreators,
  getUserByUsername,
  getUserMemes,
  searchUsers,
  toggleFollow,
  updateProfile,
} from "../services/userService";

import { useAuth } from "./useAuth";

export function useProfile() {
  return useQuery({
    queryKey: ["profile"],
    queryFn: getProfile,
  });
}

/**
 * Update profile and synchronize the current user in AuthContext.
 */
export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const { restoreSession } = useAuth();

  return useMutation({
    mutationFn: updateProfile,

    onSuccess: async (data) => {
      queryClient.setQueryData(["profile"], data);

      await restoreSession();

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["posts"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["user-memes"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["suggested-creators"],
        }),
      ]);
    },
  });
}

export function useUserProfile(username) {
  return useQuery({
    queryKey: ["user", username],
    queryFn: () => getUserByUsername(username),
    enabled: Boolean(username),
  });
}

export function useUserMemes(username) {
  return useInfiniteQuery({
    queryKey: ["user-memes", username],

    queryFn: ({ pageParam }) =>
      getUserMemes(
        username,
        pageParam ? { cursor: pageParam } : {}
      ),

    initialPageParam: undefined,

    getNextPageParam: (lastPage) =>
      lastPage?.next_cursor ?? undefined,

    enabled: Boolean(username),
  });
}

/**
 * Toggle follow state and refresh cached data that may contain
 * is_following or follower counts.
 */
export function useToggleFollow(username) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => toggleFollow(username),

    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["user", username],
        }),

        queryClient.invalidateQueries({
          queryKey: ["user-memes", username],
        }),

        queryClient.invalidateQueries({
          queryKey: ["suggested-creators"],
        }),

        queryClient.invalidateQueries({
          queryKey: ["posts"],
        }),

        queryClient.invalidateQueries({
          queryKey: ["search-users"],
        }),
      ]);
    },
  });
}

export function useSearchUsers(query) {
  return useQuery({
    queryKey: ["search-users", query],
    queryFn: () => searchUsers(query),
    enabled: Boolean(query) && query.length >= 2,
    staleTime: 30_000,
  });
}

export function useSuggestedCreators() {
  return useQuery({
    queryKey: ["suggested-creators"],
    queryFn: getSuggestedCreators,
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Check username availability once the username has at least 3 chars.
 */
export function useCheckUsername(username) {
  return useQuery({
    queryKey: ["check-username", username],
    queryFn: () => checkUsername(username),
    enabled: Boolean(username) && username.length >= 3,
    staleTime: 15_000,
    retry: false,
  });
}
