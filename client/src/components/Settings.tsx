import { useState, useEffect } from 'react';
import { useAiStatus, useSaveApiKey, useClearApiKey, useStatusOptions, useUpdateStatuses, useResetStatuses } from '../hooks';
import { Icons } from './Icons';
import styles from '../App.module.css';
import type { StatusOption } from '../services/api';

const colorOptions: StatusOption['color'][] = ['gray', 'blue', 'amber', 'green', 'red'];

export function Settings() {
  const { data: aiStatus, isLoading, refetch } = useAiStatus();
  const saveApiKey = useSaveApiKey();
  const clearApiKey = useClearApiKey();
  
  const { data: statusOptions } = useStatusOptions();
  const updateStatuses = useUpdateStatuses();
  const resetStatuses = useResetStatuses();

  const [apiKeyInput, setApiKeyInput] = useState('');
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [editingStatuses, setEditingStatuses] = useState<StatusOption[] | null>(null);
  const [newStatus, setNewStatus] = useState({ key: '', label: '', color: 'gray' as StatusOption['color'] });

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

  const handleStartEditStatuses = () => {
    setEditingStatuses(statusOptions ? [...statusOptions] : []);
  };

  const handleSaveStatuses = async () => {
    if (!editingStatuses) return;
    try {
      await updateStatuses.mutateAsync(editingStatuses);
      setEditingStatuses(null);
      setToast({ type: 'success', message: 'Status options saved!' });
    } catch (err) {
      setToast({ type: 'error', message: err instanceof Error ? err.message : 'Failed to save' });
    }
  };

  const handleResetStatuses = async () => {
    try {
      await resetStatuses.mutateAsync();
      setEditingStatuses(null);
      setToast({ type: 'success', message: 'Status options reset to defaults.' });
    } catch (err) {
      setToast({ type: 'error', message: err instanceof Error ? err.message : 'Failed to reset' });
    }
  };

  const handleAddStatus = () => {
    if (!editingStatuses || !newStatus.key.trim() || !newStatus.label.trim()) return;
    const key = newStatus.key.trim().toLowerCase().replace(/\s+/g, '_');
    if (editingStatuses.some(s => s.key === key)) {
      setToast({ type: 'error', message: 'A status with this key already exists' });
      return;
    }
    setEditingStatuses([...editingStatuses, { key, label: newStatus.label.trim(), color: newStatus.color }]);
    setNewStatus({ key: '', label: '', color: 'gray' });
  };

  const handleRemoveStatus = (key: string) => {
    if (!editingStatuses) return;
    setEditingStatuses(editingStatuses.filter(s => s.key !== key));
  };

  const handleUpdateStatus = (key: string, field: 'label' | 'color', value: string) => {
    if (!editingStatuses) return;
    setEditingStatuses(editingStatuses.map(s => 
      s.key === key ? { ...s, [field]: value } : s
    ));
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
          <div className={styles.pageHeaderInfo}>
            <h1 className={styles.pageTitle}>Settings</h1>
            <p className={styles.pageSubtitle}>Configure your preferences</p>
          </div>
        </header>

        <section className={styles.profileSection}>
          <h2 className={styles.profileSectionTitle}>AI Configuration</h2>
          
          {/* Status indicator - using existing badge styles */}
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Status</label>
            <div>
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
                  {aiStatus.source === 'env' && ' • from .env'}
                </span>
              ) : (
                <span className={`${styles.statusBadge} ${styles.statusInterview}`}>
                  Not configured
                </span>
              )}
            </div>
          </div>

          {/* Show different UI based on whether key is from env */}
          {aiStatus?.source === 'env' ? (
            <div className={styles.formGroup}>
              <p className={styles.formHint}>
                API key loaded from <code style={{ 
                  backgroundColor: 'var(--color-bg-subtle)', 
                  padding: '2px 6px', 
                  borderRadius: 'var(--radius-sm)',
                  fontSize: 'var(--text-xs)'
                }}>OPENAI_API_KEY</code> environment variable.
                <br />
                To change it, update your <code style={{ 
                  backgroundColor: 'var(--color-bg-subtle)', 
                  padding: '2px 6px', 
                  borderRadius: 'var(--radius-sm)',
                  fontSize: 'var(--text-xs)'
                }}>.env</code> file and restart the server.
              </p>
            </div>
          ) : (
            <>
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
            </>
          )}
        </section>

        <section className={styles.profileSection}>
          <h2 className={styles.profileSectionTitle}>Application Statuses</h2>
          <p className={styles.formHint} style={{ marginBottom: 'var(--space-4)' }}>
            Customize the status options for tracking applications
          </p>
          
          {editingStatuses ? (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
                {editingStatuses.map((status) => (
                  <div key={status.key} style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
                    <input
                      type="text"
                      value={status.label}
                      onChange={(e) => handleUpdateStatus(status.key, 'label', e.target.value)}
                      style={{ flex: 1, maxWidth: 200 }}
                    />
                    <select
                      value={status.color}
                      onChange={(e) => handleUpdateStatus(status.key, 'color', e.target.value)}
                      style={{ width: 100 }}
                    >
                      {colorOptions.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-ink-muted)', width: 100 }}>
                      {status.key}
                    </span>
                    <button
                      onClick={() => handleRemoveStatus(status.key)}
                      style={{ color: 'var(--color-rose)', padding: 'var(--space-1)' }}
                      title="Remove"
                    >
                      <span style={{ width: 16, height: 16, display: 'flex', transform: 'rotate(45deg)' }}>
                        <Icons.Plus />
                      </span>
                    </button>
                  </div>
                ))}
              </div>
              
              {/* Add new status */}
              <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center', marginBottom: 'var(--space-4)', paddingTop: 'var(--space-3)', borderTop: '1px solid var(--border-subtle)' }}>
                <input
                  type="text"
                  placeholder="Label"
                  value={newStatus.label}
                  onChange={(e) => setNewStatus({ ...newStatus, label: e.target.value, key: e.target.value })}
                  style={{ flex: 1, maxWidth: 200 }}
                />
                <select
                  value={newStatus.color}
                  onChange={(e) => setNewStatus({ ...newStatus, color: e.target.value as StatusOption['color'] })}
                  style={{ width: 100 }}
                >
                  {colorOptions.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <button
                  className={`${styles.button} ${styles.buttonSecondary}`}
                  onClick={handleAddStatus}
                  disabled={!newStatus.label.trim()}
                  style={{ padding: 'var(--space-1) var(--space-3)' }}
                >
                  Add
                </button>
              </div>
              
              <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                <button
                  className={`${styles.button} ${styles.buttonPrimary}`}
                  onClick={handleSaveStatuses}
                  disabled={updateStatuses.isPending}
                >
                  {updateStatuses.isPending ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  className={`${styles.button} ${styles.buttonSecondary}`}
                  onClick={() => setEditingStatuses(null)}
                >
                  Cancel
                </button>
                <button
                  onClick={handleResetStatuses}
                  disabled={resetStatuses.isPending}
                  style={{ 
                    fontSize: 'var(--text-sm)',
                    color: 'var(--color-ink-muted)',
                    marginLeft: 'auto',
                  }}
                >
                  Reset to defaults
                </button>
              </div>
            </>
          ) : (
            <>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
                {statusOptions?.map((status) => (
                  <span
                    key={status.key}
                    className={styles.statusBadge}
                    style={{
                      backgroundColor: status.color === 'gray' ? 'var(--color-bg-subtle)' :
                                       status.color === 'blue' ? 'var(--color-sky-light)' :
                                       status.color === 'amber' ? 'var(--color-honey-light)' :
                                       status.color === 'green' ? 'var(--color-sage-light)' :
                                       'var(--color-rose-light)',
                      color: status.color === 'gray' ? 'var(--color-ink-muted)' :
                             status.color === 'blue' ? 'var(--color-sky)' :
                             status.color === 'amber' ? 'var(--color-honey)' :
                             status.color === 'green' ? 'var(--color-sage)' :
                             'var(--color-rose)',
                    }}
                  >
                    {status.label}
                  </span>
                ))}
              </div>
              <button
                className={`${styles.button} ${styles.buttonSecondary}`}
                onClick={handleStartEditStatuses}
              >
                Edit Statuses
              </button>
            </>
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
