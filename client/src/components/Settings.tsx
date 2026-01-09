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
      // Refetch to update status immediately
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
            padding: '16px 20px',
            borderRadius: 'var(--radius-lg)',
            backgroundColor: toast.type === 'success' ? 'var(--color-sage)' : 'var(--color-rose)',
            color: 'white',
            fontSize: 'var(--text-sm)',
            fontWeight: 500,
            boxShadow: 'var(--shadow-lg)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            zIndex: 1000,
            animation: 'slideIn 0.3s ease-out',
          }}
        >
          <span style={{ width: 18, height: 18, display: 'flex' }}>
            {toast.type === 'success' ? <Icons.Check /> : <Icons.AlertCircle />}
          </span>
          {toast.message}
          <button
            onClick={() => setToast(null)}
            style={{
              marginLeft: 8,
              padding: 4,
              opacity: 0.8,
              display: 'flex',
            }}
          >
            <span style={{ transform: 'rotate(45deg)', display: 'flex' }}><Icons.Plus /></span>
          </button>
        </div>
      )}

      <style>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>

      <div className={styles.page}>
        <header className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>Settings</h1>
          <p className={styles.pageSubtitle}>Configure your preferences</p>
        </header>

        <section className={styles.profileSection}>
          <h2 className={styles.profileSectionTitle}>AI Configuration</h2>
          
          {/* Status indicator - now more prominent */}
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Status</label>
            {isLoading ? (
              <div style={{ 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: '0.5rem',
                padding: '8px 16px',
                backgroundColor: 'var(--color-bg-subtle)',
                borderRadius: 'var(--radius-md)',
              }}>
                <span style={{ width: 16, height: 16, display: 'flex', animation: 'spin 1s linear infinite' }}>
                  <Icons.Loader />
                </span>
                <span style={{ fontSize: 'var(--text-sm)' }}>Checking configuration...</span>
              </div>
            ) : aiStatus?.configured ? (
              <div style={{ 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: '0.75rem',
                padding: '12px 16px',
                backgroundColor: 'var(--color-sage-light)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-sage)',
              }}>
                <span style={{ 
                  width: 10, 
                  height: 10, 
                  borderRadius: '50%', 
                  backgroundColor: 'var(--color-sage)',
                  display: 'inline-block',
                  boxShadow: '0 0 0 3px rgba(107, 142, 35, 0.2)',
                }} />
                <span style={{ color: 'var(--color-sage)', fontWeight: 600, fontSize: 'var(--text-sm)' }}>
                  Connected & Ready
                </span>
                {aiStatus.keyPreview && (
                  <span style={{ 
                    color: 'var(--color-ink-muted)', 
                    fontSize: 'var(--text-xs)',
                    backgroundColor: 'rgba(0,0,0,0.05)',
                    padding: '2px 8px',
                    borderRadius: 'var(--radius-sm)',
                  }}>
                    {aiStatus.keyPreview}
                  </span>
                )}
              </div>
            ) : (
              <div style={{ 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: '0.75rem',
                padding: '12px 16px',
                backgroundColor: 'var(--color-amber-light)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-amber)',
              }}>
                <span style={{ 
                  width: 10, 
                  height: 10, 
                  borderRadius: '50%', 
                  backgroundColor: 'var(--color-amber)',
                  display: 'inline-block'
                }} />
                <span style={{ color: 'var(--color-amber)', fontWeight: 600, fontSize: 'var(--text-sm)' }}>
                  Not Configured
                </span>
                <span style={{ color: 'var(--color-ink-muted)', fontSize: 'var(--text-xs)' }}>
                  Add your API key below
                </span>
              </div>
            )}
          </div>

          {/* API Key input */}
          <div className={styles.formGroup} style={{ marginTop: '1.5rem' }}>
            <label className={styles.formLabel}>Gemini API Key</label>
            <p className={styles.formHint}>
              Required for AI-powered content generation.{' '}
              <a 
                href="https://aistudio.google.com/app/apikey" 
                target="_blank" 
                rel="noopener noreferrer"
                style={{ color: 'var(--color-terracotta)' }}
              >
                Get your free API key →
              </a>
            </p>
            <div style={{ display: 'flex', gap: '0.5rem', maxWidth: '500px', marginTop: '0.75rem' }}>
              <input 
                type="password" 
                placeholder={aiStatus?.configured ? "Enter new API key to replace" : "Paste your API key here"}
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
                {saveApiKey.isPending ? 'Saving...' : 'Save Key'}
              </button>
            </div>
          </div>

          {/* Clear API Key */}
          {aiStatus?.configured && (
            <div className={styles.formGroup} style={{ marginTop: '1rem' }}>
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
