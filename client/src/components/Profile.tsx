import { useState, useEffect, useRef } from 'react';
import { useProfile, useUpdateProfile, useExperiences, useEducation, useSkills, useProjects, useStories, useAiContext, useParseResume, useCreateExperience, useCreateEducation, useCreateSkill, useCreateProject } from '../hooks';
import { Icons } from './Icons';
import { Toast } from './Toast';
import { Modal, ModalActions } from './Modal';
import { ResumeParseModal, type ResumeImportSelections } from './ResumeParseModal';
import type { ParsedResumeData } from '../services/api';
import {
  ExperienceSection,
  EducationSection,
  SkillsSection,
  ProjectsSection,
  StoriesSection,
} from './ProfileSections';
import * as pdfjs from 'pdfjs-dist';
import styles from '../App.module.css';
import sectionStyles from './ProfileSections.module.css';

// Set up pdf.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

export function Profile() {
  const { data: profile, isLoading, error } = useProfile();
  const updateProfile = useUpdateProfile();

  // Profile data for AI context display
  const { data: experiences } = useExperiences();
  const { data: educationList } = useEducation();
  const { data: skillsByCategory } = useSkills();
  const { data: projects } = useProjects();
  const { data: stories } = useStories();

  // Toast state
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Resume upload state
  const [resumeFile, setResumeFile] = useState<{ name: string; date: string } | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Modal states
  const [showResumePreview, setShowResumePreview] = useState(false);
  const [showAiContext, setShowAiContext] = useState(false);
  const [showParsedResumeModal, setShowParsedResumeModal] = useState(false);
  const [parsedResumeData, setParsedResumeData] = useState<ParsedResumeData | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  // Mutation hooks for importing data
  const parseResume = useParseResume();
  const createExperience = useCreateExperience();
  const createEducation = useCreateEducation();
  const createSkill = useCreateSkill();
  const createProject = useCreateProject();

  // Local form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    location: '',
    linkedin_url: '',
    github_url: '',
    career_goals: '',
  });

  // Sync form with loaded profile data
  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name ?? '',
        email: profile.email ?? '',
        phone: profile.phone ?? '',
        location: profile.location ?? '',
        linkedin_url: profile.linkedin_url ?? '',
        github_url: profile.github_url ?? '',
        career_goals: profile.career_goals ?? '',
      });
      // Check if resume text exists
      if (profile.resume_text && !resumeFile) {
        setResumeFile({ name: 'Resume', date: 'Previously uploaded' });
      }
    }
  }, [profile]);

  const handleChange = (field: keyof typeof formData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
  };

  const handleBlur = (field: keyof typeof formData) => () => {
    if (profile && formData[field] !== (profile[field] ?? '')) {
      updateProfile.mutate(
        { [field]: formData[field] || null },
        {
          onSuccess: () => setToast({ type: 'success', message: 'Saved' }),
          onError: () => setToast({ type: 'error', message: 'Failed to save' }),
        }
      );
    }
  };

  // Handle resume upload
  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setToast({ type: 'error', message: 'Please upload a PDF file' });
      return;
    }

    setIsUploading(true);
    try {
      // Parse PDF using pdf.js
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;

      let fullText = '';
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item) => ('str' in item ? item.str : ''))
          .join(' ');
        fullText += pageText + '\n';
      }

      // Save to profile
      await updateProfile.mutateAsync({ resume_text: fullText });

      setResumeFile({
        name: file.name,
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      });
      setToast({ type: 'success', message: 'Resume uploaded and parsed!' });
    } catch (err) {
      console.error('Resume parse error:', err);
      setToast({ type: 'error', message: 'Failed to parse resume' });
    } finally {
      setIsUploading(false);
      // Reset file input so same file can be re-uploaded
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Handle parsing resume with AI
  const handleParseWithAi = async () => {
    if (!profile?.resume_text) {
      setToast({ type: 'error', message: 'No resume text to parse' });
      return;
    }

    setIsParsing(true);
    try {
      const result = await parseResume.mutateAsync(profile.resume_text);
      setParsedResumeData(result);
      setShowParsedResumeModal(true);
    } catch (err) {
      console.error('Resume parse error:', err);
      setToast({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to parse resume with AI',
      });
    } finally {
      setIsParsing(false);
    }
  };

  // Helper to normalize date strings from AI (YYYY-MM or YYYY) to full date (YYYY-MM-DD)
  const normalizeDate = (dateStr: string | null): string | null => {
    if (!dateStr) return null;
    // If already full date format, return as-is
    if (/^\d{4}-\d{2}-\d{2}/.test(dateStr)) return dateStr;
    // If YYYY-MM format, add day
    if (/^\d{4}-\d{2}$/.test(dateStr)) return `${dateStr}-01`;
    // If just YYYY, add month and day
    if (/^\d{4}$/.test(dateStr)) return `${dateStr}-01-01`;
    return null;
  };

  // Handle importing parsed resume data
  const handleImportParsedData = async (selections: ResumeImportSelections) => {
    if (!parsedResumeData) return;

    setIsImporting(true);
    let importedCount = 0;

    try {
      // Import profile data
      if (selections.profile) {
        const profileUpdates: Record<string, string | null> = {};
        if (parsedResumeData.profile.name) profileUpdates.name = parsedResumeData.profile.name;
        if (parsedResumeData.profile.email) profileUpdates.email = parsedResumeData.profile.email;
        if (parsedResumeData.profile.phone) profileUpdates.phone = parsedResumeData.profile.phone;
        if (parsedResumeData.profile.location) profileUpdates.location = parsedResumeData.profile.location;
        if (parsedResumeData.profile.linkedin_url) profileUpdates.linkedin_url = parsedResumeData.profile.linkedin_url;
        if (parsedResumeData.profile.github_url) profileUpdates.github_url = parsedResumeData.profile.github_url;
        if (parsedResumeData.profile.portfolio_url) profileUpdates.portfolio_url = parsedResumeData.profile.portfolio_url;
        if (parsedResumeData.profile.career_goals) profileUpdates.career_goals = parsedResumeData.profile.career_goals;

        if (Object.keys(profileUpdates).length > 0) {
          await updateProfile.mutateAsync(profileUpdates);
          importedCount++;
        }
      }

      // Import experience
      if (selections.experience && parsedResumeData.experience.length > 0) {
        for (const exp of parsedResumeData.experience) {
          await createExperience.mutateAsync({
            company: exp.company,
            role: exp.role,
            start_date: normalizeDate(exp.start_date),
            end_date: normalizeDate(exp.end_date),
            description: exp.description,
            achievements: exp.achievements,
          });
        }
        importedCount += parsedResumeData.experience.length;
      }

      // Import education
      if (selections.education && parsedResumeData.education.length > 0) {
        for (const edu of parsedResumeData.education) {
          await createEducation.mutateAsync({
            institution: edu.institution,
            degree: edu.degree,
            field: edu.field,
            start_date: normalizeDate(edu.start_date),
            end_date: normalizeDate(edu.end_date),
            gpa: edu.gpa,
            coursework: null,
          });
        }
        importedCount += parsedResumeData.education.length;
      }

      // Import skills
      if (selections.skills && parsedResumeData.skills.length > 0) {
        for (const skill of parsedResumeData.skills) {
          await createSkill.mutateAsync({
            category: skill.category || 'Other',
            name: skill.name,
            proficiency: skill.proficiency,
          });
        }
        importedCount += parsedResumeData.skills.length;
      }

      // Import projects
      if (selections.projects && parsedResumeData.projects.length > 0) {
        for (const proj of parsedResumeData.projects) {
          await createProject.mutateAsync({
            name: proj.name,
            description: proj.description,
            technologies: proj.technologies,
            outcomes: proj.outcomes,
            url: proj.url,
          });
        }
        importedCount += parsedResumeData.projects.length;
      }

      setToast({ type: 'success', message: `Successfully imported ${importedCount} items from resume` });
      setShowParsedResumeModal(false);
      setParsedResumeData(null);
    } catch (err) {
      console.error('Import error:', err);
      setToast({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to import some data',
      });
    } finally {
      setIsImporting(false);
    }
  };

  if (isLoading) {
    return (
      <div className={styles.mainInner}>
        <div className={styles.page}>
          <header className={styles.pageHeader}>
            <div className={styles.pageHeaderInfo}>
              <h1 className={styles.pageTitle}>Your Profile</h1>
              <p className={styles.pageSubtitle}>Loading your profile...</p>
            </div>
          </header>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.mainInner}>
        <div className={styles.page}>
          <header className={styles.pageHeader}>
            <div className={styles.pageHeaderInfo}>
              <h1 className={styles.pageTitle}>Your Profile</h1>
              <p className={styles.pageSubtitle}>Unable to load profile</p>
            </div>
          </header>
          <div className={styles.emptyState}>
            <div className={styles.emptyStateIcon}>
              <Icons.AlertCircle />
            </div>
            <h3 className={styles.emptyStateTitle}>Error Loading Profile</h3>
            <p className={styles.emptyStateText}>
              {error instanceof Error ? error.message : 'Failed to load profile'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.mainInner}>
      <div className={styles.page}>
        <header className={styles.pageHeader}>
          <div className={styles.pageHeaderInfo}>
            <h1 className={styles.pageTitle}>Your Profile</h1>
            <p className={styles.pageSubtitle}>The foundation for all your AI-generated content</p>
          </div>
        </header>

        {/* Resume Upload */}
        <section className={styles.profileSection}>
          <h2 className={styles.profileSectionTitle}>Resume</h2>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            onChange={handleResumeUpload}
            style={{ display: 'none' }}
          />
          {!resumeFile ? (
            <div
              className={styles.uploadArea}
              onClick={() => fileInputRef.current?.click()}
              style={{ cursor: isUploading ? 'wait' : 'pointer' }}
            >
              <div className={styles.uploadIcon}>
                {isUploading ? <Icons.Loader /> : <Icons.Upload />}
              </div>
              <p className={styles.uploadText}>
                {isUploading ? 'Parsing resume...' : 'Drop your resume here or click to upload'}
              </p>
              <p className={styles.uploadHint}>PDF format</p>
            </div>
          ) : (
            <div className={styles.uploadedFile}>
              <div className={styles.fileIcon}><Icons.FileText /></div>
              <div className={styles.fileInfo}>
                <p className={styles.fileName}>{resumeFile.name}</p>
                <p className={styles.fileDate}>{resumeFile.date}</p>
              </div>
              <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                <button
                  className={`${styles.button} ${styles.buttonPrimary}`}
                  onClick={handleParseWithAi}
                  disabled={isParsing || !profile?.resume_text}
                  title="Use AI to extract structured data from your resume"
                >
                  {isParsing ? (
                    <>
                      <span className={styles.buttonIcon} style={{ animation: 'spin 1s linear infinite' }}>
                        <Icons.Loader />
                      </span>
                      Parsing...
                    </>
                  ) : (
                    <>
                      <span className={styles.buttonIcon}><Icons.Brain /></span>
                      Parse with AI
                    </>
                  )}
                </button>
                <button
                  className={`${styles.button} ${styles.buttonSecondary}`}
                  onClick={() => setShowResumePreview(true)}
                  title="Preview parsed resume text"
                >
                  <span className={styles.buttonIcon}><Icons.Eye /></span>
                  Preview
                </button>
                <button
                  className={`${styles.button} ${styles.buttonSecondary}`}
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                >
                  {isUploading ? 'Parsing...' : 'Replace'}
                </button>
              </div>
            </div>
          )}
        </section>

        {/* Personal Information */}
        <section className={styles.profileSection}>
          <h2 className={styles.profileSectionTitle}>Personal Information</h2>
          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Full Name</label>
              <input 
                type="text" 
                placeholder="Your name"
                value={formData.name}
                onChange={handleChange('name')}
                onBlur={handleBlur('name')}
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Email</label>
              <input 
                type="email" 
                placeholder="your@email.com"
                value={formData.email}
                onChange={handleChange('email')}
                onBlur={handleBlur('email')}
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Phone</label>
              <input 
                type="tel" 
                placeholder="+1 (555) 000-0000"
                value={formData.phone}
                onChange={handleChange('phone')}
                onBlur={handleBlur('phone')}
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Location</label>
              <input 
                type="text" 
                placeholder="City, State"
                value={formData.location}
                onChange={handleChange('location')}
                onBlur={handleBlur('location')}
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>LinkedIn</label>
              <input 
                type="url" 
                placeholder="linkedin.com/in/..."
                value={formData.linkedin_url}
                onChange={handleChange('linkedin_url')}
                onBlur={handleBlur('linkedin_url')}
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>GitHub</label>
              <input 
                type="url" 
                placeholder="github.com/..."
                value={formData.github_url}
                onChange={handleChange('github_url')}
                onBlur={handleBlur('github_url')}
              />
            </div>
          </div>
        </section>

        {/* Career Goals */}
        <section className={styles.profileSection}>
          <h2 className={styles.profileSectionTitle}>Career Goals</h2>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>What are you looking for?</label>
            <p className={styles.formHint}>Describe your ideal role, company culture, and what matters most to you</p>
            <textarea
              rows={4}
              placeholder="I'm seeking a senior engineering role at a product-focused company where I can..."
              style={{ width: '100%', resize: 'vertical' }}
              value={formData.career_goals}
              onChange={handleChange('career_goals')}
              onBlur={handleBlur('career_goals')}
            />
          </div>
        </section>

        {/* Profile Data Sections */}
        <ExperienceSection />
        <EducationSection />
        <SkillsSection />
        <ProjectsSection />
        <StoriesSection />

        {/* AI Context - What the model knows about you */}
        <section className={styles.profileSection}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
            <div>
              <h2 className={styles.profileSectionTitle} style={{ marginBottom: 'var(--space-1)' }}>AI Context</h2>
              <p className={styles.formHint}>
                Information available to the AI when generating content
              </p>
            </div>
            <button
              className={`${styles.button} ${styles.buttonSecondary}`}
              onClick={() => setShowAiContext(true)}
            >
              <span className={styles.buttonIcon}><Icons.Brain /></span>
              View Full Context
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 'var(--space-3)' }}>
            <div className={styles.insightCard}>
              <div className={styles.insightIcon} style={{ color: profile?.name ? 'var(--color-sage)' : 'var(--color-ink-muted)' }}>
                <Icons.Profile />
              </div>
              <div className={styles.insightContent}>
                <p className={styles.insightTitle}>Profile</p>
                <p className={styles.insightText}>
                  {profile?.name ? 'Complete' : 'Not set'}
                </p>
              </div>
            </div>
            <div className={styles.insightCard}>
              <div className={styles.insightIcon} style={{ color: profile?.resume_text ? 'var(--color-sage)' : 'var(--color-ink-muted)' }}>
                <Icons.FileText />
              </div>
              <div className={styles.insightContent}>
                <p className={styles.insightTitle}>Resume</p>
                <p className={styles.insightText}>
                  {profile?.resume_text ? 'Uploaded' : 'Not uploaded'}
                </p>
              </div>
            </div>
            <div className={styles.insightCard}>
              <div className={styles.insightIcon} style={{ color: (experiences?.length ?? 0) > 0 ? 'var(--color-sage)' : 'var(--color-ink-muted)' }}>
                <Icons.Applications />
              </div>
              <div className={styles.insightContent}>
                <p className={styles.insightTitle}>Experience</p>
                <p className={styles.insightText}>
                  {experiences?.length ?? 0} entries
                </p>
              </div>
            </div>
            <div className={styles.insightCard}>
              <div className={styles.insightIcon} style={{ color: (educationList?.length ?? 0) > 0 ? 'var(--color-sage)' : 'var(--color-ink-muted)' }}>
                <Icons.FileText />
              </div>
              <div className={styles.insightContent}>
                <p className={styles.insightTitle}>Education</p>
                <p className={styles.insightText}>
                  {educationList?.length ?? 0} entries
                </p>
              </div>
            </div>
            <div className={styles.insightCard}>
              <div className={styles.insightIcon} style={{ color: skillsByCategory && Object.keys(skillsByCategory).length > 0 ? 'var(--color-sage)' : 'var(--color-ink-muted)' }}>
                <Icons.Check />
              </div>
              <div className={styles.insightContent}>
                <p className={styles.insightTitle}>Skills</p>
                <p className={styles.insightText}>
                  {skillsByCategory ? Object.values(skillsByCategory).flat().length : 0} skills
                </p>
              </div>
            </div>
            <div className={styles.insightCard}>
              <div className={styles.insightIcon} style={{ color: (projects?.length ?? 0) > 0 ? 'var(--color-sage)' : 'var(--color-ink-muted)' }}>
                <Icons.Lightbulb />
              </div>
              <div className={styles.insightContent}>
                <p className={styles.insightTitle}>Projects</p>
                <p className={styles.insightText}>
                  {projects?.length ?? 0} projects
                </p>
              </div>
            </div>
            <div className={styles.insightCard}>
              <div className={styles.insightIcon} style={{ color: (stories?.length ?? 0) > 0 ? 'var(--color-sage)' : 'var(--color-ink-muted)' }}>
                <Icons.FileText />
              </div>
              <div className={styles.insightContent}>
                <p className={styles.insightTitle}>Stories</p>
                <p className={styles.insightText}>
                  {stories?.length ?? 0} stories
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Toast notification */}
      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onDismiss={() => setToast(null)}
        />
      )}

      {/* Resume Preview Modal */}
      <Modal
        isOpen={showResumePreview}
        onClose={() => setShowResumePreview(false)}
        title="Resume Content"
        size="lg"
      >
        <div style={{ maxHeight: '60vh', overflow: 'auto' }}>
          {profile?.resume_text ? (
            <pre style={{
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              fontFamily: 'var(--font-mono, monospace)',
              fontSize: 'var(--text-sm)',
              lineHeight: 1.6,
              padding: 'var(--space-4)',
              backgroundColor: 'var(--color-bg-subtle)',
              borderRadius: 'var(--radius-md)',
              margin: 0,
            }}>
              {profile.resume_text}
            </pre>
          ) : (
            <p className={styles.formHint}>No resume content available.</p>
          )}
        </div>
      </Modal>

      {/* AI Context Modal */}
      <AiContextModal
        isOpen={showAiContext}
        onClose={() => setShowAiContext(false)}
        profile={profile}
        experiences={experiences}
        educationList={educationList}
        skillsByCategory={skillsByCategory}
        projects={projects}
        stories={stories}
      />

      {/* Resume Parse Modal */}
      <ResumeParseModal
        isOpen={showParsedResumeModal}
        onClose={() => {
          setShowParsedResumeModal(false);
          setParsedResumeData(null);
        }}
        parsedData={parsedResumeData}
        onConfirm={handleImportParsedData}
        isImporting={isImporting}
      />
    </div>
  );
}

// Separate component for AI Context Modal
interface AiContextModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: any;
  experiences: any;
  educationList: any;
  skillsByCategory: any;
  projects: any;
  stories: any;
}

function AiContextModal({
  isOpen,
  onClose,
  profile,
  experiences,
  educationList,
  skillsByCategory,
  projects,
  stories,
}: AiContextModalProps) {
  const [showRawPrompt, setShowRawPrompt] = useState(false);
  const { data: aiContext, isLoading: isLoadingContext } = useAiContext();

  const skillCount = skillsByCategory ? Object.values(skillsByCategory).flat().length : 0;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="AI Context" size="xl">
      <p className={styles.formHint} style={{ marginBottom: 'var(--space-4)' }}>
        This is the information the AI uses when generating cover letters and responses.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        {/* Summary Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 'var(--space-3)' }}>
          <div className={styles.insightCard}>
            <div className={styles.insightIcon} style={{ color: profile?.name ? 'var(--color-sage)' : 'var(--color-ink-muted)' }}>
              <Icons.Profile />
            </div>
            <div className={styles.insightContent}>
              <p className={styles.insightTitle}>Profile</p>
              <p className={styles.insightText}>{profile?.name ? 'Complete' : 'Not set'}</p>
            </div>
          </div>
          <div className={styles.insightCard}>
            <div className={styles.insightIcon} style={{ color: profile?.resume_text ? 'var(--color-sage)' : 'var(--color-ink-muted)' }}>
              <Icons.FileText />
            </div>
            <div className={styles.insightContent}>
              <p className={styles.insightTitle}>Resume</p>
              <p className={styles.insightText}>{profile?.resume_text ? `${Math.round(profile.resume_text.length / 1000)}k chars` : 'None'}</p>
            </div>
          </div>
          <div className={styles.insightCard}>
            <div className={styles.insightIcon} style={{ color: (experiences?.length ?? 0) > 0 ? 'var(--color-sage)' : 'var(--color-ink-muted)' }}>
              <Icons.Applications />
            </div>
            <div className={styles.insightContent}>
              <p className={styles.insightTitle}>Experience</p>
              <p className={styles.insightText}>{experiences?.length ?? 0} entries</p>
            </div>
          </div>
          <div className={styles.insightCard}>
            <div className={styles.insightIcon} style={{ color: (educationList?.length ?? 0) > 0 ? 'var(--color-sage)' : 'var(--color-ink-muted)' }}>
              <Icons.FileText />
            </div>
            <div className={styles.insightContent}>
              <p className={styles.insightTitle}>Education</p>
              <p className={styles.insightText}>{educationList?.length ?? 0} entries</p>
            </div>
          </div>
          <div className={styles.insightCard}>
            <div className={styles.insightIcon} style={{ color: skillCount > 0 ? 'var(--color-sage)' : 'var(--color-ink-muted)' }}>
              <Icons.Check />
            </div>
            <div className={styles.insightContent}>
              <p className={styles.insightTitle}>Skills</p>
              <p className={styles.insightText}>{skillCount} skills</p>
            </div>
          </div>
          <div className={styles.insightCard}>
            <div className={styles.insightIcon} style={{ color: (projects?.length ?? 0) > 0 ? 'var(--color-sage)' : 'var(--color-ink-muted)' }}>
              <Icons.Lightbulb />
            </div>
            <div className={styles.insightContent}>
              <p className={styles.insightTitle}>Projects</p>
              <p className={styles.insightText}>{projects?.length ?? 0} projects</p>
            </div>
          </div>
          <div className={styles.insightCard}>
            <div className={styles.insightIcon} style={{ color: (stories?.length ?? 0) > 0 ? 'var(--color-sage)' : 'var(--color-ink-muted)' }}>
              <Icons.FileText />
            </div>
            <div className={styles.insightContent}>
              <p className={styles.insightTitle}>Stories</p>
              <p className={styles.insightText}>{stories?.length ?? 0} stories</p>
            </div>
          </div>
        </div>

        {/* Detailed Breakdown */}
        <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 'var(--space-4)' }}>
          <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 600, marginBottom: 'var(--space-3)' }}>
            Data Summary
          </h3>

          {/* Profile Info */}
          {profile?.name && (
            <div className={sectionStyles.previewSection}>
              <p className={sectionStyles.previewLabel}>Profile</p>
              <p className={sectionStyles.previewValue}>
                {profile.name}
                {profile.location && ` - ${profile.location}`}
                {profile.email && ` (${profile.email})`}
              </p>
              {profile.career_goals && (
                <p className={sectionStyles.previewValue} style={{ marginTop: 'var(--space-1)', color: 'var(--color-ink-muted)' }}>
                  Goals: {profile.career_goals.slice(0, 150)}{profile.career_goals.length > 150 ? '...' : ''}
                </p>
              )}
            </div>
          )}

          {/* Experience */}
          {experiences && experiences.length > 0 && (
            <div className={sectionStyles.previewSection}>
              <p className={sectionStyles.previewLabel}>Work Experience</p>
              <ul className={sectionStyles.previewList}>
                {experiences.slice(0, 3).map((exp: any) => (
                  <li key={exp.id}>{exp.role} at {exp.company}</li>
                ))}
                {experiences.length > 3 && <li style={{ color: 'var(--color-ink-muted)' }}>+{experiences.length - 3} more</li>}
              </ul>
            </div>
          )}

          {/* Education */}
          {educationList && educationList.length > 0 && (
            <div className={sectionStyles.previewSection}>
              <p className={sectionStyles.previewLabel}>Education</p>
              <ul className={sectionStyles.previewList}>
                {educationList.map((edu: any) => (
                  <li key={edu.id}>{edu.degree} from {edu.institution}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Skills */}
          {skillsByCategory && Object.keys(skillsByCategory).length > 0 && (
            <div className={sectionStyles.previewSection}>
              <p className={sectionStyles.previewLabel}>Skills</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
                {Object.entries(skillsByCategory).map(([category, skills]: [string, any]) => (
                  <span key={category} className={sectionStyles.entryTag}>
                    {category}: {skills.length}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Projects */}
          {projects && projects.length > 0 && (
            <div className={sectionStyles.previewSection}>
              <p className={sectionStyles.previewLabel}>Projects</p>
              <ul className={sectionStyles.previewList}>
                {projects.slice(0, 3).map((proj: any) => (
                  <li key={proj.id}>{proj.name}</li>
                ))}
                {projects.length > 3 && <li style={{ color: 'var(--color-ink-muted)' }}>+{projects.length - 3} more</li>}
              </ul>
            </div>
          )}

          {/* Stories */}
          {stories && stories.length > 0 && (
            <div className={sectionStyles.previewSection}>
              <p className={sectionStyles.previewLabel}>STAR Stories</p>
              <ul className={sectionStyles.previewList}>
                {stories.slice(0, 3).map((story: any) => (
                  <li key={story.id}>{story.title}</li>
                ))}
                {stories.length > 3 && <li style={{ color: 'var(--color-ink-muted)' }}>+{stories.length - 3} more</li>}
              </ul>
            </div>
          )}
        </div>

        {/* Raw Prompt Toggle */}
        <div className={sectionStyles.rawPromptContainer}>
          <button
            className={sectionStyles.rawPromptToggle}
            onClick={() => setShowRawPrompt(!showRawPrompt)}
          >
            <Icons.FileText />
            {showRawPrompt ? 'Hide Raw Prompt' : 'View Raw Prompt (what the AI sees)'}
          </button>

          {showRawPrompt && (
            <div className={sectionStyles.rawPrompt}>
              {isLoadingContext ? (
                'Loading context...'
              ) : aiContext ? (
                aiContext
              ) : (
                'No context available. Add profile data to see what the AI will use.'
              )}
            </div>
          )}
        </div>
      </div>

      <ModalActions>
        <button className={`${styles.button} ${styles.buttonSecondary}`} onClick={onClose}>
          Close
        </button>
      </ModalActions>
    </Modal>
  );
}
