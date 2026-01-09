import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { documentsApi } from '../services/api';
import type { Document, DocumentVersion } from '../types';

// Query keys for cache management
export const documentKeys = {
  all: ['documents'] as const,
  lists: () => [...documentKeys.all, 'list'] as const,
  list: (applicationId?: number) => [...documentKeys.lists(), { applicationId }] as const,
  details: () => [...documentKeys.all, 'detail'] as const,
  detail: (id: number) => [...documentKeys.details(), id] as const,
  versions: (documentId: number) => [...documentKeys.all, 'versions', documentId] as const,
};

// Fetch all documents, optionally filtered by application
export function useDocuments(applicationId?: number) {
  return useQuery({
    queryKey: documentKeys.list(applicationId),
    queryFn: () => documentsApi.list(applicationId),
  });
}

// Fetch a single document with its versions
export function useDocument(id: number) {
  return useQuery({
    queryKey: documentKeys.detail(id),
    queryFn: () => documentsApi.get(id),
    enabled: !!id,
  });
}

// Fetch versions for a document
export function useDocumentVersions(documentId: number) {
  return useQuery({
    queryKey: documentKeys.versions(documentId),
    queryFn: () => documentsApi.getVersions(documentId),
    enabled: !!documentId,
  });
}

// Create a new document
export function useCreateDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: documentsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: documentKeys.lists() });
    },
  });
}

// Update a document
export function useUpdateDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Document> }) =>
      documentsApi.update(id, data),
    onSuccess: (updatedDoc) => {
      queryClient.invalidateQueries({ queryKey: documentKeys.lists() });
      queryClient.setQueryData(documentKeys.detail(updatedDoc.id), updatedDoc);
    },
  });
}

// Delete a document
export function useDeleteDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: documentsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: documentKeys.lists() });
    },
  });
}

// Add a new version to a document
export function useAddDocumentVersion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ documentId, data }: {
      documentId: number;
      data: { content: string; prompt_used?: string; is_ai_generated?: boolean }
    }) => documentsApi.addVersion(documentId, data),
    onSuccess: (_, variables) => {
      // Invalidate both the document detail and versions list
      queryClient.invalidateQueries({ queryKey: documentKeys.detail(variables.documentId) });
      queryClient.invalidateQueries({ queryKey: documentKeys.versions(variables.documentId) });
    },
  });
}
