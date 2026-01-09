import { useState, useEffect } from 'react';
import { useAiStatus, useSaveApiKey, useClearApiKey } from '../hooks';
import { Icons } from './Icons';
import styles from '../App.module.css';

export function Settings() {
  const { data: aiStatus, isLoading, refetch } = useAiStatus();
  const saveApiKey = useSaveApiKey();
  const clearApiKey = useClearApiKey();

  const [apiKeyInput, setApiKeyInput] = useState('');
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Auto-dismiss toast
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const handleSaveApiKey = async () => {
    if (!apiKeyInput.trim()) return;
    
    try {
      await saveApiKey.mutateAsync(apiKeyInput.trim());
      setApiKeyInput('');
      setToast({ type: 'success', message: 'API key saved! AI generation is now enabled.' });
      refetch();
    } catch (err) {
      setToast({ 
        type: 'error', 
        message: err instanceof Error ? err.message : 'Failed to save API key' 
      });
    }
  };

  const handleClearApiKey = async () => {
    try {
      await clearApiKey.mutateAsync();
      setToast({ type: 'success', message: 'API key removed.' });
      refetch();
    } catch (err) {
      setToast({ 
        type: 'error', 
        message: err instanceof Error ? err.message : 'Failed to remove API key' 
      });
    }
  };

  return (
    <div className={styles.mainInner}>
      {/* Toast notification */}
      {toast && (
        <div
          style={{
            position: 'fixed',
            top: 24,
            right: 24,
            padding: '12px 16px',
            borderRadius: 'var(--radius-lg)',
            backgroundColor: toast.type === 'success' ? 'var(--color-sage)' : 'var(--color-rose)',
            color: 'white',
            fontSize: 'var(--text-sm)',
            fontWeight: 500,
            boxShadow: 'var(--shadow-lg)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            zIndex: 1000,
            animation: 'slideIn 0.3s var(--ease-out)',
          }}
        >
          <span style={{ width: 16, height: 16, display: 'flex', flexShrink: 0 }}>
            {toast.type === 'success' ? <Icons.Check /> : <Icons.AlertCircle />}
          </span>
          {toast.message}
        </div>
      )}

      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>

      <div className={styles.page}>
        <header className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>Settings</h1>
          <p className={styles.pageSubtitle}>Configure your preferences</p>
        </header>

        <section className={styles.profileSection}>
          <h2 className={styles.profileSectionTitle}>AI Configuration</h2>
          
          {/* Status indicator - using existing badge styles */}
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Status</label>
            <div style={{ marginTop: 'var(--space-2)' }}>
              {isLoading ? (
                <span className={styles.statusBadge} style={{ 
                  backgroundColor: 'var(--color-bg-subtle)', 
                  color: 'var(--color-ink-muted)' 
                }}>
                  Checking...
                </span>
              ) : aiStatus?.configured ? (
                <span className={`${styles.statusBadge} ${styles.statusOffer}`}>
                  Connected {aiStatus.keyPreview && `(${aiStatus.keyPreview})`}
                </span>
              ) : (
                <span className={`${styles.statusBadge} ${styles.statusInterview}`}>
                  Not configured
                </span>
              )}
            </div>
          </div>

          {/* API Key input */}
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>OpenAI API Key</label>
            <p className={styles.formHint}>
              Required for AI-powered content generation.{' '}
              <a 
                href="https://platform.openai.com/api-keys" 
                target="_blank" 
                rel="noopener noreferrer"
                className={styles.sectionLink}
              >
                Get your API key <Icons.ExternalLink />
              </a>
            </p>
            <div style={{ display: 'flex', gap: 'var(--space-2)', maxWidth: '500px', marginTop: 'var(--space-3)' }}>
              <input 
                type="password" 
                placeholder={aiStatus?.configured ? "Enter new key to replace" : "Paste your API key"}
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSaveApiKey()}
                style={{ flex: 1 }}
              />
              <button 
                className={`${styles.button} ${styles.buttonPrimary}`}
                onClick={handleSaveApiKey}
                disabled={!apiKeyInput.trim() || saveApiKey.isPending}
              >
                {saveApiKey.isPending ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>

          {/* Clear API Key */}
          {aiStatus?.configured && (
            <div className={styles.formGroup}>
              <button 
                onClick={handleClearApiKey}
                disabled={clearApiKey.isPending}
                style={{ 
                  fontSize: 'var(--text-sm)',
                  color: 'var(--color-rose)',
                  textDecoration: 'underline',
                  textUnderlineOffset: '2px',
                }}
              >
                {clearApiKey.isPending ? 'Removing...' : 'Remove API key'}
              </button>
            </div>
          )}
        </section>

        <section className={styles.profileSection}>
          <h2 className={styles.profileSectionTitle}>Data Management</h2>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Export Your Data</label>
            <p className={styles.formHint}>Download all your data as a JSON file</p>
            <button className={`${styles.button} ${styles.buttonSecondary}`} style={{ marginTop: 'var(--space-2)' }}>
              Export to JSON
            </button>
          </div>
        </section>

        <section className={styles.profileSection}>
          <h2 className={styles.profileSectionTitle}>About</h2>
          <div className={styles.formGroup}>
            <p className={styles.formHint}>
              Waypoint Job Tracker v1.0.0
              <br />
              A personal job application tracker with AI-powered content generation.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
