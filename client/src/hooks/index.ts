// Application hooks
export {
  useApplications,
  useApplication,
  useCreateApplication,
  useUpdateApplication,
  useUpdateApplicationStatus,
  useDeleteApplication,
  computeApplicationStats,
  applicationKeys,
} from './useApplications';

// Profile hooks
export {
  useProfile,
  useUpdateProfile,
  profileKeys,
} from './useProfile';

// AI hooks
export {
  useAiStatus,
  useGenerateCoverLetter,
  useGenerateCustomResponse,
  useRefineContent,
  useSaveApiKey,
  useClearApiKey,
  useStatusOptions,
  useUpdateStatuses,
  useResetStatuses,
  aiKeys,
  settingsKeys,
} from './useAi';

// Document hooks
export {
  useDocuments,
  useDocument,
  useDocumentVersions,
  useCreateDocument,
  useUpdateDocument,
  useDeleteDocument,
  useAddDocumentVersion,
  documentKeys,
} from './useDocuments';
