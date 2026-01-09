import { useState } from 'react';
import { useAiStatus } from '../hooks';
import { Icons } from './Icons';
import styles from '../App.module.css';

export function Documents() {
  const { data: aiStatus } = useAiStatus();
  const [showComingSoon, setShowComingSoon] = useState(false);

  const handleGenerate = () => {
    if (!aiStatus?.configured) {
      setShowComingSoon(true);
      return;
    }
    // TODO: Open generate modal for standalone documents
    setShowComingSoon(true);
  };

  return (
    <div className={styles.mainInner}>
      <div className={styles.page}>
        <header className={styles.pageHeader}>
          <div>
            <h1 className={styles.pageTitle}>Documents</h1>
            <p className={styles.pageSubtitle}>Cover letters and responses you've generated</p>
          </div>
          <button 
            className={`${styles.button} ${styles.buttonPrimary}`}
            onClick={handleGenerate}
          >
            <span className={styles.navIcon}><Icons.Lightbulb /></span>
            Generate New
          </button>
        </header>

        {showComingSoon && (
          <div 
            className={styles.profileSection}
            style={{ 
              backgroundColor: 'var(--color-terracotta-light)', 
              borderColor: 'var(--color-terracotta)',
              marginBottom: 'var(--space-6)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-3)' }}>
              <span className={styles.navIcon} style={{ color: 'var(--color-terracotta)', marginTop: 2 }}>
                <Icons.Lightbulb />
              </span>
              <div>
                <p style={{ fontWeight: 600, color: 'var(--color-terracotta-dark)', marginBottom: 'var(--space-1)' }}>
                  {aiStatus?.configured ? 'Coming Soon' : 'Setup Required'}
                </p>
                <p className={styles.formHint}>
                  {aiStatus?.configured 
                    ? 'Standalone document generation is coming soon. For now, you can generate cover letters and responses from each application\'s detail page.'
                    : 'To generate content with AI, please add your Gemini API key in Settings first.'}
                </p>
                <button 
                  onClick={() => setShowComingSoon(false)}
                  style={{ 
                    marginTop: 'var(--space-2)', 
                    fontSize: 'var(--text-sm)', 
                    color: 'var(--color-terracotta)',
                    textDecoration: 'underline',
                    textUnderlineOffset: '2px',
                  }}
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        )}

        <div className={styles.emptyState}>
          <div className={styles.emptyStateIcon}>
            <Icons.Documents />
          </div>
          <h3 className={styles.emptyStateTitle}>No documents yet</h3>
          <p className={styles.emptyStateText}>
            When you generate cover letters or custom responses from an application, they'll appear here.
          </p>
          <p className={styles.formHint} style={{ marginTop: 'var(--space-4)' }}>
            Tip: Go to an application and click "Generate Cover Letter" or "Generate Response to Question"
          </p>
        </div>
      </div>
    </div>
  );
}
