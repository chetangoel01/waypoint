import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { applicationsApi } from '../services/api';
import type { Application } from '../types';

// Query keys for cache management
export const applicationKeys = {
  all: ['applications'] as const,
  lists: () => [...applicationKeys.all, 'list'] as const,
  list: () => [...applicationKeys.lists()] as const,
  details: () => [...applicationKeys.all, 'detail'] as const,
  detail: (id: number) => [...applicationKeys.details(), id] as const,
};

// Fetch all applications
export function useApplications() {
  return useQuery({
    queryKey: applicationKeys.list(),
    queryFn: applicationsApi.list,
  });
}

// Fetch a single application by ID
export function useApplication(id: number) {
  return useQuery({
    queryKey: applicationKeys.detail(id),
    queryFn: () => applicationsApi.get(id),
    enabled: !!id,
  });
}

// Create a new application
export function useCreateApplication() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: applicationsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: applicationKeys.lists() });
    },
  });
}

// Update an application
export function useUpdateApplication() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Application> }) =>
      applicationsApi.update(id, data),
    onSuccess: (updatedApp) => {
      // Update the cache for both list and detail
      queryClient.invalidateQueries({ queryKey: applicationKeys.lists() });
      queryClient.setQueryData(applicationKeys.detail(updatedApp.id), updatedApp);
    },
  });
}

// Update application status
export function useUpdateApplicationStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: Application['status'] }) =>
      applicationsApi.updateStatus(id, status),
    onSuccess: (updatedApp) => {
      queryClient.invalidateQueries({ queryKey: applicationKeys.lists() });
      queryClient.setQueryData(applicationKeys.detail(updatedApp.id), updatedApp);
    },
  });
}

// Delete an application
export function useDeleteApplication() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: applicationsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: applicationKeys.lists() });
    },
  });
}

// Helper to compute stats from applications
export function computeApplicationStats(applications: Application[]) {
  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const stats = {
    total: applications.length,
    active: 0,
    interviews: 0,
    interviewsThisWeek: 0,
    awaitingResponse: 0,
    offers: 0,
    rejected: 0,
    saved: 0,
    applied: 0,
    phoneScreen: 0,
    withdrawn: 0,
  };

  applications.forEach((app) => {
    if (['applied', 'phone_screen', 'interview'].includes(app.status)) {
      stats.active++;
    }
    if (app.status === 'interview') {
      stats.interviews++;
      // Check if interview was scheduled this week (using updated_at as proxy)
      if (new Date(app.updated_at) >= oneWeekAgo) {
        stats.interviewsThisWeek++;
      }
    }
    if (app.status === 'applied') {
      stats.awaitingResponse++;
      stats.applied++;
    }
    if (app.status === 'offer') {
      stats.offers++;
    }
    if (app.status === 'rejected') {
      stats.rejected++;
    }
    if (app.status === 'saved') {
      stats.saved++;
    }
    if (app.status === 'phone_screen') {
      stats.phoneScreen++;
    }
    if (app.status === 'withdrawn') {
      stats.withdrawn++;
    }
  });

  return stats;
}
