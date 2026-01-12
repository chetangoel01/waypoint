import React, { useState } from 'react';
import { profileApi } from '../services/api';
import type { Profile } from '../types';
import styles from './Onboarding.module.css';

interface OnboardingProps {
  userEmail: string | undefined;
  userName: string | undefined;
  onComplete: () => void;
}

type OnboardingData = {
  name: string;
  email: string;
  location: string;
  linkedin_url: string;
  github_url: string;
  portfolio_url: string;
  career_goals: string;
};

const TOTAL_STEPS = 3;

export const Onboarding: React.FC<OnboardingProps> = ({
  userEmail,
  userName,
  onComplete
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<OnboardingData>({
    name: userName || '',
    email: userEmail || '',
    location: '',
    linkedin_url: '',
    github_url: '',
    portfolio_url: '',
    career_goals: '',
  });

  const updateField = (field: keyof OnboardingData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNext = async () => {
    if (currentStep < TOTAL_STEPS) {
      setCurrentStep(prev => prev + 1);
    } else {
      // Final step - save and complete
      setSaving(true);
      try {
        await profileApi.update({
          name: formData.name || null,
          email: formData.email || null,
          location: formData.location || null,
          linkedin_url: formData.linkedin_url || null,
          github_url: formData.github_url || null,
          portfolio_url: formData.portfolio_url || null,
          career_goals: formData.career_goals || null,
        } as Partial<Profile>);
        onComplete();
      } catch (error) {
        console.error('Failed to save profile:', error);
        // Still complete onboarding even if save fails
        onComplete();
      } finally {
        setSaving(false);
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <>
            <div className={styles.stepHeader}>
              <div className={styles.stepIcon}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </div>
              <h2 className={styles.stepTitle}>Let's get to know you</h2>
              <p className={styles.stepSubtitle}>
                Just a few basics to personalize your experience and help with cover letter generation.
              </p>
            </div>

            <div className={styles.stepContent}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>
                  Full name
                  {userName && <span className={styles.prefilledBadge}>From Google</span>}
                </label>
                <input
                  type="text"
                  className={styles.formInput}
                  placeholder="Jane Doe"
                  value={formData.name}
                  onChange={(e) => updateField('name', e.target.value)}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>
                  Email
                  {userEmail && <span className={styles.prefilledBadge}>From Google</span>}
                </label>
                <div className={styles.inputWrapper}>
                  <div className={styles.inputIcon}>
                    <svg viewBox="0 0 20 20" fill="currentColor">
                      <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                      <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                    </svg>
                  </div>
                  <input
                    type="email"
                    className={`${styles.formInput} ${styles.inputWithIcon}`}
                    placeholder="jane@example.com"
                    value={formData.email}
                    onChange={(e) => updateField('email', e.target.value)}
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Location</label>
                <div className={styles.inputWrapper}>
                  <div className={styles.inputIcon}>
                    <svg viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    className={`${styles.formInput} ${styles.inputWithIcon}`}
                    placeholder="San Francisco, CA"
                    value={formData.location}
                    onChange={(e) => updateField('location', e.target.value)}
                  />
                </div>
                <p className={styles.formHint}>This helps match you with location-relevant opportunities</p>
              </div>
            </div>
          </>
        );

      case 2:
        return (
          <>
            <div className={styles.stepHeader}>
              <div className={styles.stepIcon}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                </svg>
              </div>
              <h2 className={styles.stepTitle}>Your professional presence</h2>
              <p className={styles.stepSubtitle}>
                Add your online profiles so we can help craft personalized applications.
              </p>
            </div>

            <div className={styles.stepContent}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>LinkedIn profile</label>
                <div className={styles.inputWrapper}>
                  <div className={styles.inputIcon}>
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                    </svg>
                  </div>
                  <input
                    type="url"
                    className={`${styles.formInput} ${styles.inputWithIcon}`}
                    placeholder="https://linkedin.com/in/janedoe"
                    value={formData.linkedin_url}
                    onChange={(e) => updateField('linkedin_url', e.target.value)}
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>GitHub profile</label>
                <div className={styles.inputWrapper}>
                  <div className={styles.inputIcon}>
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                    </svg>
                  </div>
                  <input
                    type="url"
                    className={`${styles.formInput} ${styles.inputWithIcon}`}
                    placeholder="https://github.com/janedoe"
                    value={formData.github_url}
                    onChange={(e) => updateField('github_url', e.target.value)}
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Portfolio or personal website</label>
                <div className={styles.inputWrapper}>
                  <div className={styles.inputIcon}>
                    <svg viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.083 9h1.946c.089-1.546.383-2.97.837-4.118A6.004 6.004 0 004.083 9zM10 2a8 8 0 100 16 8 8 0 000-16zm0 2c-.076 0-.232.032-.465.262-.238.234-.497.623-.737 1.182-.389.907-.673 2.142-.766 3.556h3.936c-.093-1.414-.377-2.649-.766-3.556-.24-.56-.5-.948-.737-1.182C10.232 4.032 10.076 4 10 4zm3.971 5c-.089-1.546-.383-2.97-.837-4.118A6.004 6.004 0 0115.917 9h-1.946zm-2.003 2H8.032c.093 1.414.377 2.649.766 3.556.24.56.5.948.737 1.182.233.23.389.262.465.262.076 0 .232-.032.465-.262.238-.234.498-.623.737-1.182.389-.907.673-2.142.766-3.556zm1.166 4.118c.454-1.147.748-2.572.837-4.118h1.946a6.004 6.004 0 01-2.783 4.118zm-6.268 0C6.412 13.97 6.118 12.546 6.03 11H4.083a6.004 6.004 0 002.783 4.118z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <input
                    type="url"
                    className={`${styles.formInput} ${styles.inputWithIcon}`}
                    placeholder="https://janedoe.dev"
                    value={formData.portfolio_url}
                    onChange={(e) => updateField('portfolio_url', e.target.value)}
                  />
                </div>
                <p className={styles.formHint}>All fields are optional — add what you're comfortable sharing</p>
              </div>
            </div>
          </>
        );

      case 3:
        return (
          <>
            <div className={styles.stepHeader}>
              <div className={styles.stepIcon}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M8 14s1.5 2 4 2 4-2 4-2" />
                  <line x1="9" y1="9" x2="9.01" y2="9" />
                  <line x1="15" y1="9" x2="15.01" y2="9" />
                </svg>
              </div>
              <h2 className={styles.stepTitle}>What are you looking for?</h2>
              <p className={styles.stepSubtitle}>
                Help us understand your career goals so we can tailor your experience.
              </p>
            </div>

            <div className={styles.stepContent}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Career goals & preferences</label>
                <textarea
                  className={`${styles.formInput} ${styles.formTextarea}`}
                  placeholder="Tell us about the type of roles you're targeting, company culture preferences, technologies you want to work with, or any other career aspirations..."
                  value={formData.career_goals}
                  onChange={(e) => updateField('career_goals', e.target.value)}
                />
                <p className={styles.formHint}>
                  This helps generate more relevant cover letters and track the right opportunities
                </p>
              </div>
            </div>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <div className={styles.onboardingPage}>
      <main className={styles.onboardingMain}>
        <div className={styles.onboardingCard}>
          {/* Progress indicator */}
          <div className={styles.progressBar}>
            {Array.from({ length: TOTAL_STEPS }, (_, i) => (
              <div
                key={i}
                className={`${styles.progressStep} ${
                  i + 1 < currentStep ? styles.completed : ''
                } ${i + 1 === currentStep ? styles.active : ''}`}
              />
            ))}
          </div>

          {/* Step content */}
          {renderStepContent()}

          {/* Action buttons */}
          <div className={styles.actionButtons}>
            {currentStep > 1 && (
              <button
                type="button"
                className={styles.buttonBack}
                onClick={handleBack}
              >
                <svg viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                </svg>
                Back
              </button>
            )}
            <button
              type="button"
              className={styles.buttonNext}
              onClick={handleNext}
              disabled={saving}
            >
              {saving ? (
                'Saving...'
              ) : currentStep === TOTAL_STEPS ? (
                <>
                  Get Started
                  <svg viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </>
              ) : (
                <>
                  Continue
                  <svg viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </>
              )}
            </button>
          </div>

          {/* Skip option */}
          <button
            type="button"
            className={styles.skipButton}
            onClick={handleSkip}
          >
            Skip for now — I'll fill this in later
          </button>
        </div>
      </main>
    </div>
  );
};
