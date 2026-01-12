import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  experienceApi,
  educationApi,
  skillsApi,
  projectsApi,
  storiesApi,
} from '../services/api';
import type { WorkExperience, Education, Skill, Project, Story } from '../types';

// Query keys
export const experienceKeys = {
  all: ['experience'] as const,
  list: () => [...experienceKeys.all, 'list'] as const,
  detail: (id: number) => [...experienceKeys.all, 'detail', id] as const,
};

export const educationKeys = {
  all: ['education'] as const,
  list: () => [...educationKeys.all, 'list'] as const,
  detail: (id: number) => [...educationKeys.all, 'detail', id] as const,
};

export const skillsKeys = {
  all: ['skills'] as const,
  list: () => [...skillsKeys.all, 'list'] as const,
};

export const projectsKeys = {
  all: ['projects'] as const,
  list: () => [...projectsKeys.all, 'list'] as const,
  detail: (id: number) => [...projectsKeys.all, 'detail', id] as const,
};

export const storiesKeys = {
  all: ['stories'] as const,
  list: () => [...storiesKeys.all, 'list'] as const,
  detail: (id: number) => [...storiesKeys.all, 'detail', id] as const,
};

// ==================== WORK EXPERIENCE ====================

export function useExperiences() {
  return useQuery({
    queryKey: experienceKeys.list(),
    queryFn: experienceApi.list,
  });
}

export function useCreateExperience() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Omit<WorkExperience, 'id' | 'created_at' | 'updated_at'>) =>
      experienceApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: experienceKeys.list() });
    },
  });
}

export function useUpdateExperience() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<WorkExperience> }) =>
      experienceApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: experienceKeys.list() });
    },
  });
}

export function useDeleteExperience() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => experienceApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: experienceKeys.list() });
    },
  });
}

// ==================== EDUCATION ====================

export function useEducation() {
  return useQuery({
    queryKey: educationKeys.list(),
    queryFn: educationApi.list,
  });
}

export function useCreateEducation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Omit<Education, 'id' | 'created_at' | 'updated_at'>) =>
      educationApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: educationKeys.list() });
    },
  });
}

export function useUpdateEducation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Education> }) =>
      educationApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: educationKeys.list() });
    },
  });
}

export function useDeleteEducation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => educationApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: educationKeys.list() });
    },
  });
}

// ==================== SKILLS ====================

export function useSkills() {
  return useQuery({
    queryKey: skillsKeys.list(),
    queryFn: skillsApi.list,
  });
}

export function useCreateSkill() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Omit<Skill, 'id' | 'created_at'>) => skillsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: skillsKeys.list() });
    },
  });
}

export function useUpdateSkill() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Skill> }) =>
      skillsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: skillsKeys.list() });
    },
  });
}

export function useDeleteSkill() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => skillsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: skillsKeys.list() });
    },
  });
}

// ==================== PROJECTS ====================

export function useProjects() {
  return useQuery({
    queryKey: projectsKeys.list(),
    queryFn: projectsApi.list,
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Omit<Project, 'id' | 'created_at' | 'updated_at'>) =>
      projectsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectsKeys.list() });
    },
  });
}

export function useUpdateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Project> }) =>
      projectsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectsKeys.list() });
    },
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => projectsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectsKeys.list() });
    },
  });
}

// ==================== STORIES ====================

export function useStories() {
  return useQuery({
    queryKey: storiesKeys.list(),
    queryFn: storiesApi.list,
  });
}

export function useCreateStory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Omit<Story, 'id' | 'created_at' | 'updated_at'>) =>
      storiesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: storiesKeys.list() });
    },
  });
}

export function useUpdateStory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Story> }) =>
      storiesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: storiesKeys.list() });
    },
  });
}

export function useDeleteStory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => storiesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: storiesKeys.list() });
    },
  });
}
