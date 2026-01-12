import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { emailApi } from '../services/api';

// Query keys
export const emailKeys = {
  all: ['email'] as const,
  status: () => [...emailKeys.all, 'status'] as const,
  history: () => [...emailKeys.all, 'history'] as const,
};

// Application query key for invalidation after sync
const applicationKeys = {
  all: ['applications'] as const,
};

// Get Gmail connection status
export function useEmailStatus() {
  return useQuery({
    queryKey: emailKeys.status(),
    queryFn: emailApi.getStatus,
    staleTime: 1000 * 60, // 1 minute
  });
}



// Get OAuth authorization URL
export function useGetAuthUrl() {
  return useMutation({
    mutationFn: () => emailApi.getAuthUrl(),
  });
}

// Trigger email sync
export function useEmailSync() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => emailApi.sync(),
    onSuccess: () => {
      // Invalidate email status to update last sync time
      queryClient.invalidateQueries({ queryKey: emailKeys.status() });
      // Invalidate email history
      queryClient.invalidateQueries({ queryKey: emailKeys.history() });
      // Invalidate applications as new ones may have been created
      queryClient.invalidateQueries({ queryKey: applicationKeys.all });
    },
  });
}

// Disconnect Gmail
export function useDisconnectEmail() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => emailApi.disconnect(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: emailKeys.status() });
    },
  });
}

// Get processed email history
export function useEmailHistory(limit?: number) {
  return useQuery({
    queryKey: [...emailKeys.history(), limit] as const,
    queryFn: () => emailApi.getHistory(limit),
    staleTime: 1000 * 60, // 1 minute
  });
}
