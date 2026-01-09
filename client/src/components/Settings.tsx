import { useState } from 'react';
import { useAiStatus, useSaveApiKey, useClearApiKey } from '../hooks';
import { Icons } from './Icons';
import styles from '../App.module.css';

export function Settings() {
  const { data: aiStatus, isLoading } = useAiStatus();
  const saveApiKey = useSaveApiKey();
  const clearApiKey = useClearApiKey();

  const [apiKeyInput, setApiKeyInput] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSaveApiKey = async () => {
    if (!apiKeyInput.trim()) return;
    
    try {
      await saveApiKey.mutateAsync(apiKeyInput.trim());
      setApiKeyInput('');
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch {
      // Error handled by mutation
    }
  };

  const handleClearApiKey = async () => {
    try {
      await clearApiKey.mutateAsync();
    } catch {
      // Error handled by mutation
    }
  };

  return (
    <div className={styles.mainInner}>
      <div className={styles.page}>
        <header className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>Settings</h1>
          <p className={styles.pageSubtitle}>Configure your preferences</p>
        </header>

        <section className={styles.profileSection}>
          <h2 className={styles.profileSectionTitle}>AI Configuration</h2>
          
          {/* Status indicator */}
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Status</label>
            {isLoading ? (
              <p className={styles.formHint}>Checking configuration...</p>
            ) : aiStatus?.configured ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ 
                  width: 8, 
                  height: 8, 
                  borderRadius: '50%', 
                  backgroundColor: 'var(--color-sage)',
                  display: 'inline-block'
                }} />
                <span style={{ color: 'var(--color-sage)', fontWeight: 500, fontSize: 'var(--text-sm)' }}>
                  Connected
                </span>
                {aiStatus.keyPreview && (
                  <span style={{ color: 'var(--color-ink-muted)', fontSize: 'var(--text-sm)' }}>
                    ({aiStatus.keyPreview})
                  </span>
                )}
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ 
                  width: 8, 
                  height: 8, 
                  borderRadius: '50%', 
                  backgroundColor: 'var(--color-amber)',
                  display: 'inline-block'
                }} />
                <span style={{ color: 'var(--color-amber)', fontWeight: 500, fontSize: 'var(--text-sm)' }}>
                  Not configured
                </span>
              </div>
            )}
          </div>

          {/* API Key input */}
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Gemini API Key</label>
            <p className={styles.formHint}>
              Required for AI-powered content generation.{' '}
              <a 
                href="https://makersuite.google.com/app/apikey" 
                target="_blank" 
                rel="noopener noreferrer"
                style={{ color: 'var(--color-terracotta)' }}
              >
                Get your API key →
              </a>
            </p>
            <div style={{ display: 'flex', gap: '0.5rem', maxWidth: '500px', marginTop: '0.5rem' }}>
              <input 
                type="password" 
                placeholder={aiStatus?.configured ? "Enter new API key to replace" : "Enter your API key"}
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
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
            
            {/* Error message */}
            {saveApiKey.error && (
              <p style={{ 
                color: 'var(--color-rose)', 
                fontSize: 'var(--text-sm)', 
                marginTop: '0.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem'
              }}>
                <span style={{ width: 14, height: 14, display: 'inline-flex' }}><Icons.AlertCircle /></span>
                {saveApiKey.error instanceof Error ? saveApiKey.error.message : 'Failed to save API key'}
              </p>
            )}

            {/* Success message */}
            {showSuccess && (
              <p style={{ 
                color: 'var(--color-sage)', 
                fontSize: 'var(--text-sm)', 
                marginTop: '0.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem'
              }}>
                <span style={{ width: 14, height: 14, display: 'inline-flex' }}><Icons.Check /></span>
                API key saved successfully
              </p>
            )}
          </div>

          {/* Clear API Key */}
          {aiStatus?.configured && (
            <div className={styles.formGroup}>
              <button 
                className={`${styles.button} ${styles.buttonSecondary}`}
                onClick={handleClearApiKey}
                disabled={clearApiKey.isPending}
                style={{ color: 'var(--color-rose)' }}
              >
                {clearApiKey.isPending ? 'Removing...' : 'Remove API Key'}
              </button>
            </div>
          )}
        </section>

        <section className={styles.profileSection}>
          <h2 className={styles.profileSectionTitle}>Data Management</h2>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Export Your Data</label>
            <p className={styles.formHint}>Download all your data as a JSON file</p>
            <button className={`${styles.button} ${styles.buttonSecondary}`} style={{ marginTop: '0.5rem' }}>
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
