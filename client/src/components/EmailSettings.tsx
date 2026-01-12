import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import {
  useEmailStatus,
  useSaveEmailCredentials,
  useGetAuthUrl,
  useDisconnectEmail,
} from '../hooks';
import { Icons } from './Icons';
import styles from '../App.module.css';
import type { SyncProgress, SyncResult } from '../types';

interface EmailSettingsProps {
  onToast: (toast: { type: 'success' | 'error'; message: string }) => void;
}

export function EmailSettings({ onToast }: EmailSettingsProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const { data: emailStatus, isLoading, refetch } = useEmailStatus();
  const saveCredentials = useSaveEmailCredentials();
  const getAuthUrl = useGetAuthUrl();
  const disconnectEmail = useDisconnectEmail();

  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [showCredentialsForm, setShowCredentialsForm] = useState(false);

  // Sync progress state
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState<SyncProgress | null>(null);

  // Handle OAuth callback URL params
  useEffect(() => {
    const emailConnected = searchParams.get('email_connected');
    const emailError = searchParams.get('email_error');

    if (emailConnected === 'true') {
      onToast({ type: 'success', message: 'Gmail connected successfully!' });
      refetch();
      // Clean up URL params
      searchParams.delete('email_connected');
      setSearchParams(searchParams, { replace: true });
    }

    if (emailError) {
      onToast({ type: 'error', message: `Gmail connection failed: ${emailError}` });
      // Clean up URL params
      searchParams.delete('email_error');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams, onToast, refetch]);

  const handleSaveCredentials = async () => {
    if (!clientId.trim() || !clientSecret.trim()) return;

    try {
      await saveCredentials.mutateAsync({
        clientId: clientId.trim(),
        clientSecret: clientSecret.trim(),
      });
      setClientId('');
      setClientSecret('');
      setShowCredentialsForm(false);
      onToast({ type: 'success', message: 'Gmail credentials saved!' });
      refetch();
    } catch (err) {
      onToast({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to save credentials',
      });
    }
  };

  const handleConnect = async () => {
    try {
      const { url } = await getAuthUrl.mutateAsync();
      // Redirect to Google OAuth
      window.location.href = url;
    } catch (err) {
      onToast({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to start OAuth flow',
      });
    }
  };

  const handleSync = () => {
    setIsSyncing(true);
    setSyncProgress({ stage: 'fetching', message: 'Starting sync...', current: 0, total: 0 });

    const eventSource = new EventSource('/api/email/sync-stream');

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === 'progress') {
          setSyncProgress({
            stage: data.stage,
            message: data.message,
            current: data.current,
            total: data.total,
            emailSubject: data.emailSubject,
          });
        } else if (data.type === 'result') {
          const result = data as SyncResult & { type: string };
          const message =
            result.newApplications > 0 || result.updatedApplications > 0
              ? `Created ${result.newApplications} new applications, updated ${result.updatedApplications}.`
              : `Processed ${result.processedCount} emails. No new job-related emails found.`;
          onToast({ type: 'success', message });
          // Invalidate queries to refresh data
          queryClient.invalidateQueries({ queryKey: ['email'] });
          queryClient.invalidateQueries({ queryKey: ['applications'] });
          refetch();
          eventSource.close();
          setIsSyncing(false);
          setSyncProgress(null);
        } else if (data.type === 'error') {
          onToast({ type: 'error', message: data.message });
          eventSource.close();
          setIsSyncing(false);
          setSyncProgress(null);
        }
      } catch {
        // Ignore parse errors
      }
    };

    eventSource.onerror = () => {
      onToast({ type: 'error', message: 'Connection lost during sync' });
      eventSource.close();
      setIsSyncing(false);
      setSyncProgress(null);
    };
  };

  const handleDisconnect = async () => {
    try {
      await disconnectEmail.mutateAsync();
      onToast({ type: 'success', message: 'Gmail disconnected' });
      refetch();
    } catch (err) {
      onToast({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to disconnect',
      });
    }
  };

  const formatLastSync = (dateString: string | undefined) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  return (
    <section className={styles.profileSection}>
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
      <h2 className={styles.profileSectionTitle}>Email Integration</h2>
      <p className={styles.formHint} style={{ marginBottom: 'var(--space-4)' }}>
        Connect your Gmail to automatically detect and track job application emails
      </p>

      {/* Status indicator */}
      <div className={styles.formGroup}>
        <label className={styles.formLabel}>Status</label>
        <div>
          {isLoading ? (
            <span
              className={styles.statusBadge}
              style={{
                backgroundColor: 'var(--color-bg-subtle)',
                color: 'var(--color-ink-muted)',
              }}
            >
              Checking...
            </span>
          ) : emailStatus?.connected ? (
            <span className={`${styles.statusBadge} ${styles.statusOffer}`}>
              Connected {emailStatus.email && `(${emailStatus.email})`}
            </span>
          ) : emailStatus?.hasCredentials ? (
            <span className={`${styles.statusBadge} ${styles.statusInterview}`}>
              Credentials saved - Click Connect to authorize
            </span>
          ) : (
            <span
              className={styles.statusBadge}
              style={{
                backgroundColor: 'var(--color-bg-subtle)',
                color: 'var(--color-ink-muted)',
              }}
            >
              Not configured
            </span>
          )}
        </div>
      </div>

      {/* Connected state */}
      {emailStatus?.connected && (
        <>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Last Sync</label>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-ink-muted)' }}>
              {formatLastSync(emailStatus.lastSync)}
            </p>
          </div>

          {/* Sync Progress */}
          {isSyncing && syncProgress && (
            <div
              style={{
                backgroundColor: 'var(--color-bg-subtle)',
                borderRadius: 'var(--radius-lg)',
                padding: 'var(--space-4)',
                marginTop: 'var(--space-4)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
                <span
                  style={{
                    width: 16,
                    height: 16,
                    display: 'flex',
                    animation: 'spin 1s linear infinite',
                  }}
                >
                  <Icons.Loader />
                </span>
                <span style={{ fontSize: 'var(--text-sm)', fontWeight: 500 }}>
                  {syncProgress.stage === 'fetching' && 'Fetching emails...'}
                  {syncProgress.stage === 'processing' && 'Analyzing emails...'}
                  {syncProgress.stage === 'saving' && 'Saving application...'}
                  {syncProgress.stage === 'complete' && 'Complete!'}
                  {syncProgress.stage === 'error' && 'Error'}
                </span>
              </div>

              {/* Progress bar */}
              {syncProgress.total > 0 && (
                <div
                  style={{
                    height: 6,
                    backgroundColor: 'var(--color-border)',
                    borderRadius: 3,
                    overflow: 'hidden',
                    marginBottom: 'var(--space-2)',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${(syncProgress.current / syncProgress.total) * 100}%`,
                      backgroundColor: 'var(--color-accent)',
                      borderRadius: 3,
                      transition: 'width 0.3s ease',
                    }}
                  />
                </div>
              )}

              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-ink-muted)', margin: 0 }}>
                {syncProgress.message}
              </p>
              {syncProgress.emailSubject && (
                <p
                  style={{
                    fontSize: 'var(--text-xs)',
                    color: 'var(--color-ink-muted)',
                    margin: 'var(--space-1) 0 0 0',
                    fontStyle: 'italic',
                  }}
                >
                  {syncProgress.emailSubject}
                </p>
              )}
            </div>
          )}

          <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-4)' }}>
            <button
              className={`${styles.button} ${styles.buttonPrimary}`}
              onClick={handleSync}
              disabled={isSyncing}
            >
              {isSyncing ? 'Syncing...' : 'Sync Now'}
            </button>
            <button
              onClick={handleDisconnect}
              disabled={disconnectEmail.isPending || isSyncing}
              style={{
                fontSize: 'var(--text-sm)',
                color: 'var(--color-rose)',
                textDecoration: 'underline',
                textUnderlineOffset: '2px',
              }}
            >
              {disconnectEmail.isPending ? 'Disconnecting...' : 'Disconnect Gmail'}
            </button>
          </div>
        </>
      )}

      {/* Has credentials but not connected */}
      {!emailStatus?.connected && emailStatus?.hasCredentials && (
        <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-4)' }}>
          <button
            className={`${styles.button} ${styles.buttonPrimary}`}
            onClick={handleConnect}
            disabled={getAuthUrl.isPending}
          >
            {getAuthUrl.isPending ? 'Connecting...' : 'Connect Gmail'}
          </button>
          <button
            className={`${styles.button} ${styles.buttonSecondary}`}
            onClick={() => setShowCredentialsForm(true)}
          >
            Update Credentials
          </button>
        </div>
      )}

      {/* No credentials - show setup instructions or form */}
      {!emailStatus?.connected && !emailStatus?.hasCredentials && !showCredentialsForm && (
        <div className={styles.formGroup}>
          <button
            className={`${styles.button} ${styles.buttonPrimary}`}
            onClick={() => setShowCredentialsForm(true)}
          >
            Set Up Gmail Integration
          </button>
        </div>
      )}

      {/* Credentials form */}
      {showCredentialsForm && !emailStatus?.connected && (
        <div style={{ marginTop: 'var(--space-4)' }}>
          <div
            style={{
              backgroundColor: 'var(--color-bg-subtle)',
              padding: 'var(--space-4)',
              borderRadius: 'var(--radius-lg)',
              marginBottom: 'var(--space-4)',
            }}
          >
            <h3
              style={{
                fontSize: 'var(--text-sm)',
                fontWeight: 600,
                marginBottom: 'var(--space-2)',
              }}
            >
              Setup Instructions
            </h3>
            <ol
              style={{
                fontSize: 'var(--text-sm)',
                color: 'var(--color-ink-muted)',
                paddingLeft: 'var(--space-4)',
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--space-1)',
              }}
            >
              <li>
                Go to{' '}
                <a
                  href="https://console.cloud.google.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.sectionLink}
                >
                  Google Cloud Console <Icons.ExternalLink />
                </a>
              </li>
              <li>Create a new project or select an existing one</li>
              <li>Enable the Gmail API (APIs & Services → Library → Gmail API)</li>
              <li>Configure OAuth consent screen (External, add gmail.readonly scope)</li>
              <li>Create OAuth credentials (Web application)</li>
              <li>
                Add redirect URI:{' '}
                <code
                  style={{
                    backgroundColor: 'var(--color-bg)',
                    padding: '2px 6px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: 'var(--text-xs)',
                  }}
                >
                  http://localhost:3001/api/email/callback
                </code>
              </li>
              <li>Copy your Client ID and Client Secret below</li>
            </ol>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Client ID</label>
            <input
              type="text"
              placeholder="Your Google OAuth Client ID"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              style={{ maxWidth: '500px' }}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Client Secret</label>
            <input
              type="password"
              placeholder="Your Google OAuth Client Secret"
              value={clientSecret}
              onChange={(e) => setClientSecret(e.target.value)}
              style={{ maxWidth: '500px' }}
            />
          </div>

          <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-4)' }}>
            <button
              className={`${styles.button} ${styles.buttonPrimary}`}
              onClick={handleSaveCredentials}
              disabled={!clientId.trim() || !clientSecret.trim() || saveCredentials.isPending}
            >
              {saveCredentials.isPending ? 'Saving...' : 'Save Credentials'}
            </button>
            <button
              className={`${styles.button} ${styles.buttonSecondary}`}
              onClick={() => {
                setShowCredentialsForm(false);
                setClientId('');
                setClientSecret('');
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
