import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { generateApi, settingsApi, type CoverLetterTone, type StatusOption } from '../services/api';

// Query keys
export const aiKeys = {
  all: ['ai'] as const,
  status: () => [...aiKeys.all, 'status'] as const,
  context: () => [...aiKeys.all, 'context'] as const,
};

export const settingsKeys = {
  all: ['settings'] as const,
  aiStatus: () => [...settingsKeys.all, 'ai-status'] as const,
};

// Check if AI is configured
export function useAiStatus() {
  return useQuery({
    queryKey: settingsKeys.aiStatus(),
    queryFn: settingsApi.getAiStatus,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// Get the AI context (the prompt/context that gets sent to the AI)
export function useAiContext() {
  return useQuery({
    queryKey: aiKeys.context(),
    queryFn: async () => {
      const result = await generateApi.context();
      return result.context;
    },
    staleTime: 1000 * 60, // 1 minute
  });
}

// Generate cover letter mutation
export function useGenerateCoverLetter() {
  return useMutation({
    mutationFn: ({ 
      applicationId, 
      additionalContext, 
      tone 
    }: { 
      applicationId: number; 
      additionalContext?: string; 
      tone?: CoverLetterTone;
    }) => generateApi.coverLetter(applicationId, { additionalContext, tone }),
  });
}

// Generate custom response mutation
export function useGenerateCustomResponse() {
  return useMutation({
    mutationFn: ({ 
      applicationId, 
      question, 
      additionalContext,
      maxLength 
    }: { 
      applicationId: number; 
      question: string; 
      additionalContext?: string;
      maxLength?: number;
    }) => generateApi.customResponse(applicationId, question, { additionalContext, maxLength }),
  });
}

// Refine content mutation
export function useRefineContent() {
  return useMutation({
    mutationFn: ({ content, instruction }: { content: string; instruction: string }) =>
      generateApi.refine(content, instruction),
  });
}

// Save OpenAI API key
export function useSaveApiKey() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (apiKey: string) => settingsApi.setApiKey(apiKey),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.aiStatus() });
    },
  });
}

// Clear OpenAI API key
export function useClearApiKey() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => settingsApi.clearApiKey(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.aiStatus() });
    },
  });
}

// Status options
export function useStatusOptions() {
  return useQuery({
    queryKey: [...settingsKeys.all, 'statuses'] as const,
    queryFn: settingsApi.getStatuses,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useUpdateStatuses() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (statuses: StatusOption[]) => settingsApi.setStatuses(statuses),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...settingsKeys.all, 'statuses'] });
    },
  });
}

export function useResetStatuses() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => settingsApi.resetStatuses(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...settingsKeys.all, 'statuses'] });
    },
  });
}
