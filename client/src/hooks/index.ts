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
  useAiContext,
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

// Profile data hooks (experience, education, skills, projects, stories)
export {
  // Experience
  useExperiences,
  useCreateExperience,
  useUpdateExperience,
  useDeleteExperience,
  experienceKeys,
  // Education
  useEducation,
  useCreateEducation,
  useUpdateEducation,
  useDeleteEducation,
  educationKeys,
  // Skills
  useSkills,
  useCreateSkill,
  useUpdateSkill,
  useDeleteSkill,
  skillsKeys,
  // Projects
  useProjects,
  useCreateProject,
  useUpdateProject,
  useDeleteProject,
  projectsKeys,
  // Stories
  useStories,
  useCreateStory,
  useUpdateStory,
  useDeleteStory,
  storiesKeys,
} from './useProfileData';

// Email integration hooks
export {
  useEmailStatus,
  useGetAuthUrl,
  useEmailSync,
  useDisconnectEmail,
  useEmailHistory,
  emailKeys,
} from './useEmail';
