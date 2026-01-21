import { useState } from 'react';
import { useAiStatus, useSaveApiKey, useClearApiKey, useStatusOptions, useUpdateStatuses, useResetStatuses } from '../hooks';
import { EmailSettings } from './EmailSettings';
import { Icons } from './Icons';
import { Toast } from './Toast';
import styles from '../App.module.css';
import type { StatusOption } from '../services/api';

const colorOptions: { value: StatusOption['color']; label: string }[] = [
  { value: 'gray', label: 'Gray' },
  { value: 'blue', label: 'Blue' },
  { value: 'amber', label: 'Amber' },
  { value: 'green', label: 'Green' },
  { value: 'red', label: 'Red' },
];

const getStatusColorClass = (color: StatusOption['color']): string => {
  const colorClasses: Record<StatusOption['color'], string> = {
    gray: styles.statusGray,
    blue: styles.statusBlue,
    amber: styles.statusAmber,
    green: styles.statusGreen,
    red: styles.statusRed,
  };
  return colorClasses[color] || styles.statusGray;
};

const getColorDot = (color: StatusOption['color']): string => {
  const colors: Record<StatusOption['color'], string> = {
    gray: 'var(--color-ink-muted)',
    blue: 'var(--color-sky)',
    amber: 'var(--color-honey)',
    green: 'var(--color-sage)',
    red: 'var(--color-rose)',
  };
  return colors[color] || 'var(--color-ink-muted)';
};

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

  const aiStatusLabel = isLoading
    ? 'Checking'
    : aiStatus?.configured
      ? 'Connected'
      : 'Not configured';
  const aiStatusHint = aiStatus?.configured
    ? aiStatus.keyPreview
      ? `Key ${aiStatus.keyPreview}`
      : 'Key saved'
    : 'Add an API key';
  const aiSourceLabel = aiStatus?.source === 'env'
    ? 'Environment'
    : aiStatus?.source === 'database'
      ? 'Database'
      : 'Unset';
  const aiIsDatabase = aiStatus?.source === 'database';
  const aiStorageHint = aiStatus?.source === 'env'
    ? 'Loaded from .env'
    : aiIsDatabase
      ? aiStatus?.encrypted
        ? 'Encrypted at rest'
        : 'Stored in database'
      : 'No stored key';
  const statusCountLabel = statusOptions ? `${statusOptions.length} statuses` : 'Loading...';

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
        <Toast
          type={toast.type}
          message={toast.message}
          onDismiss={() => setToast(null)}
        />
      )}

      <div className={`${styles.page} ${styles.settingsPage}`}>
        <header className={`${styles.pageHeader} ${styles.settingsHeader}`}>
          <div className={styles.pageHeaderInfo}>
            <h1 className={styles.pageTitle}>Settings</h1>
            <p className={styles.pageSubtitle}>
              Shape how Waypoint runs, connects, and categorizes your work.
            </p>
          </div>
          <div className={styles.settingsMetaGrid}>
            <div className={styles.settingsMetaCard}>
              <span className={styles.settingsMetaLabel}>AI</span>
              <span className={styles.settingsMetaValue}>{aiStatusLabel}</span>
              <span className={styles.settingsMetaHint}>{aiStatusHint}</span>
            </div>
            <div className={styles.settingsMetaCard}>
              <span className={styles.settingsMetaLabel}>Statuses</span>
              <span className={styles.settingsMetaValue}>{statusCountLabel}</span>
              <span className={styles.settingsMetaHint}>Editable labels</span>
            </div>
            <div className={styles.settingsMetaCard}>
              <span className={styles.settingsMetaLabel}>AI Source</span>
              <span className={styles.settingsMetaValue}>{aiSourceLabel}</span>
              <span className={styles.settingsMetaHint}>{aiStorageHint}</span>
            </div>
          </div>
        </header>

        {/* AI Configuration */}
        <section className={styles.profileSection}>
          <h2 className={styles.profileSectionTitle}>AI Configuration</h2>
          <p className={`${styles.formHint} ${styles.settingsSectionIntro}`}>
            Control access to GPT-assisted drafting and key storage.
          </p>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Status</label>
            <div>
              {isLoading ? (
                <span className={`${styles.statusBadge} ${styles.statusSaved}`}>Checking...</span>
              ) : aiStatus?.configured ? (
                <span className={`${styles.statusBadge} ${styles.statusOffer}`}>
                  Connected {aiStatus.keyPreview && `(${aiStatus.keyPreview})`}
                  {aiStatus.source === 'env' && ' · from .env'}
                  {aiStatus.source === 'database' && aiStatus.encrypted && ' · encrypted'}
                </span>
              ) : (
                <span className={`${styles.statusBadge} ${styles.statusInterview}`}>Not configured</span>
              )}
            </div>
          </div>

          {aiStatus?.source === 'env' ? (
            <div className={styles.formGroup}>
              <p className={styles.formHint}>
                API key loaded from <code className={styles.settingsCode}>OPENAI_API_KEY</code> environment variable.
                Update your <code className={styles.settingsCode}>.env</code> file to change it.
              </p>
            </div>
          ) : (
            <>
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
                    Get your API key
                  </a>
                </p>
                <div className={styles.settingsApiKeyRow}>
                  <input
                    type="password"
                    placeholder={aiStatus?.configured ? 'Enter new key to replace' : 'sk-...'}
                    value={apiKeyInput}
                    onChange={(e) => setApiKeyInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSaveApiKey()}
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

              {aiStatus?.configured && (
                <div className={styles.formGroup}>
                  <button
                    className={`${styles.buttonLink} ${styles.buttonLinkDanger}`}
                    onClick={handleClearApiKey}
                    disabled={clearApiKey.isPending}
                  >
                    {clearApiKey.isPending ? 'Removing...' : 'Remove API key'}
                  </button>
                </div>
              )}
            </>
          )}
        </section>

        {/* Application Statuses */}
        <section className={styles.profileSection}>
          <h2 className={styles.profileSectionTitle}>Application Statuses</h2>
          <p className={`${styles.formHint} ${styles.settingsSectionIntro}`}>
            Customize the status options for tracking applications.
          </p>
          {editingStatuses ? (
            <>
              <div className={styles.settingsStatusList}>
                {editingStatuses.map((status) => (
                  <div key={status.key} className={styles.settingsStatusRow}>
                    <span
                      className={styles.settingsColorDot}
                      style={{ backgroundColor: getColorDot(status.color) }}
                    />
                    <input
                      type="text"
                      value={status.label}
                      onChange={(e) => handleUpdateStatus(status.key, 'label', e.target.value)}
                      className={styles.settingsStatusInput}
                    />
                    <select
                      value={status.color}
                      onChange={(e) => handleUpdateStatus(status.key, 'color', e.target.value)}
                      className={styles.settingsStatusSelect}
                    >
                      {colorOptions.map((c) => (
                        <option key={c.value} value={c.value}>{c.label}</option>
                      ))}
                    </select>
                    <span className={styles.settingsStatusKey}>{status.key}</span>
                    <button
                      onClick={() => handleRemoveStatus(status.key)}
                      className={styles.settingsDeleteBtn}
                      title="Remove status"
                    >
                      <Icons.X />
                    </button>
                  </div>
                ))}
              </div>

              <div className={styles.settingsAddRow}>
                <span className={styles.settingsColorDot} style={{ backgroundColor: getColorDot(newStatus.color) }} />
                <input
                  type="text"
                  placeholder="New status label"
                  value={newStatus.label}
                  onChange={(e) => setNewStatus({ ...newStatus, label: e.target.value, key: e.target.value })}
                  className={styles.settingsStatusInput}
                />
                <select
                  value={newStatus.color}
                  onChange={(e) => setNewStatus({ ...newStatus, color: e.target.value as StatusOption['color'] })}
                  className={styles.settingsStatusSelect}
                >
                  {colorOptions.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
                <button
                  className={`${styles.button} ${styles.buttonSecondary} ${styles.buttonSmall}`}
                  onClick={handleAddStatus}
                  disabled={!newStatus.label.trim()}
                >
                  Add
                </button>
              </div>

              <div className={styles.settingsActions}>
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
                  className={`${styles.buttonLink} ${styles.settingsActionsRight}`}
                  onClick={handleResetStatuses}
                  disabled={resetStatuses.isPending}
                >
                  Reset to defaults
                </button>
              </div>
            </>
          ) : (
            <>
              <div className={styles.settingsStatusBadges}>
                {statusOptions?.map((status) => (
                  <span
                    key={status.key}
                    className={`${styles.statusBadge} ${getStatusColorClass(status.color)}`}
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

        {/* Email Integration */}
        <EmailSettings onToast={setToast} />

        {/* About */}
        <section className={styles.profileSection}>
          <h2 className={styles.profileSectionTitle}>About</h2>
          <p className={`${styles.formHint} ${styles.settingsSectionIntro}`}>
            App details and release context.
          </p>
          <p className={styles.formHint}>
            Waypoint v1.0.0 · A personal job application tracker with AI-powered content generation.
          </p>
        </section>
      </div>
    </div>
  );
}
