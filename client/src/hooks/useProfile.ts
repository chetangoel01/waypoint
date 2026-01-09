import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { profileApi } from '../services/api';
import type { Profile } from '../types';

export const profileKeys = {
  all: ['profile'] as const,
  detail: () => [...profileKeys.all, 'detail'] as const,
};

// Fetch profile
export function useProfile() {
  return useQuery({
    queryKey: profileKeys.detail(),
    queryFn: profileApi.get,
  });
}

// Update profile
export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<Profile>) => profileApi.update(data),
    onSuccess: (updatedProfile) => {
      queryClient.setQueryData(profileKeys.detail(), updatedProfile);
    },
  });
}
