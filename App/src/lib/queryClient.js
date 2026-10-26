import { QueryClient } from "@tanstack/react-query";

/**
 * Smart retry — never retry on 4xx (client errors), retry up to 2x on 5xx/network.
 */
function shouldRetry(failureCount, error) {
  // Don't retry on network errors beyond first attempt
  if (error?.isNetworkError) return failureCount < 1;
  // Don't retry client errors (4xx)
  const status = error?.response?.status;
  if (status && status >= 400 && status < 500) return false;
  // Retry server / unknown errors up to 2 times
  return failureCount < 2;
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: shouldRetry,
      staleTime:           1000 * 60 * 5,   // 5 min
      gcTime:              1000 * 60 * 30,  // 30 min
      refetchOnWindowFocus: false,
      refetchOnReconnect:  true,
    },
    mutations: {
      retry: 0,
    },
  },
});
