import { useState, useEffect } from 'react';
import { useProfile, useUpdateProfile } from '../hooks';
import { Icons } from './Icons';
import styles from '../App.module.css';

export function Profile() {
  const { data: profile, isLoading, error } = useProfile();
  const updateProfile = useUpdateProfile();
  const [hasResume, setHasResume] = useState(false);
  
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
    }
  }, [profile]);

  const handleChange = (field: keyof typeof formData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
  };

  const handleBlur = (field: keyof typeof formData) => () => {
    if (profile && formData[field] !== (profile[field] ?? '')) {
      updateProfile.mutate({ [field]: formData[field] || null });
    }
  };

  if (isLoading) {
    return (
      <div className={styles.mainInner}>
        <div className={styles.page}>
          <header className={styles.pageHeader}>
            <h1 className={styles.pageTitle}>Your Profile</h1>
            <p className={styles.pageSubtitle}>Loading your profile...</p>
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
            <h1 className={styles.pageTitle}>Your Profile</h1>
            <p className={styles.pageSubtitle}>Unable to load profile</p>
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
          <h1 className={styles.pageTitle}>Your Profile</h1>
          <p className={styles.pageSubtitle}>The foundation for all your AI-generated content</p>
        </header>

        {/* Resume Upload */}
        <section className={styles.profileSection}>
          <h2 className={styles.profileSectionTitle}>Resume</h2>
          {!hasResume ? (
            <div className={styles.uploadArea} onClick={() => setHasResume(true)}>
              <div className={styles.uploadIcon}><Icons.Upload /></div>
              <p className={styles.uploadText}>Drop your resume here or click to upload</p>
              <p className={styles.uploadHint}>PDF or DOCX, max 5MB</p>
            </div>
          ) : (
            <div className={styles.uploadedFile}>
              <div className={styles.fileIcon}><Icons.FileText /></div>
              <div className={styles.fileInfo}>
                <p className={styles.fileName}>resume_2026.pdf</p>
                <p className={styles.fileDate}>Uploaded Jan 5, 2026</p>
              </div>
              <button className={`${styles.button} ${styles.buttonSecondary}`}>Replace</button>
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

        {/* AI Learning Insights - Placeholder for future */}
        <section className={styles.profileSection}>
          <h2 className={styles.profileSectionTitle}>AI Learning Insights</h2>
          <p className={styles.formHint} style={{ marginBottom: '1rem' }}>
            Patterns learned from your edits to AI-generated content
          </p>
          <div className={styles.insightsList}>
            <div className={styles.insightCard}>
              <div className={styles.insightIcon}><Icons.Lightbulb /></div>
              <div className={styles.insightContent}>
                <p className={styles.insightTitle}>Prefers concise introductions</p>
                <p className={styles.insightText}>You often remove generic opening lines and get straight to the point.</p>
              </div>
            </div>
            <div className={styles.insightCard}>
              <div className={styles.insightIcon}><Icons.Lightbulb /></div>
              <div className={styles.insightContent}>
                <p className={styles.insightTitle}>Adds specific metrics</p>
                <p className={styles.insightText}>You frequently add quantified achievements like percentages and numbers.</p>
              </div>
            </div>
            <div className={styles.insightCard}>
              <div className={styles.insightIcon}><Icons.Lightbulb /></div>
              <div className={styles.insightContent}>
                <p className={styles.insightTitle}>Technical depth preferred</p>
                <p className={styles.insightText}>You tend to expand on technical details and specific technologies used.</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
