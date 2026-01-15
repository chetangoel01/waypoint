import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import {
  useEmailStatus,
  useGetAuthUrl,
  useDisconnectEmail,
} from '../hooks';
import { emailApi } from '../services/api';
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
  const getAuthUrl = useGetAuthUrl();
  const disconnectEmail = useDisconnectEmail();

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

  const handleSync = async () => {
    setIsSyncing(true);
    setSyncProgress({ stage: 'fetching', message: 'Starting sync...', current: 0, total: 0 });

    try {
      await emailApi.syncStream((data) => {
        if (data.type === 'progress') {
          setSyncProgress({
            stage: data.stage as SyncProgress['stage'],
            message: data.message as string,
            current: data.current as number,
            total: data.total as number,
            emailSubject: data.emailSubject as string | undefined,
          });
        } else if (data.type === 'result') {
          const result = data as unknown as SyncResult & { type: string };
          const message =
            result.newApplications > 0 || result.updatedApplications > 0
              ? `Created ${result.newApplications} new applications, updated ${result.updatedApplications}.`
              : `Processed ${result.processedCount} emails. No new job-related emails found.`;
          onToast({ type: 'success', message });
          // Invalidate queries to refresh data
          queryClient.invalidateQueries({ queryKey: ['email'] });
          queryClient.invalidateQueries({ queryKey: ['applications'] });
          refetch();
          setIsSyncing(false);
          setSyncProgress(null);
        } else if (data.type === 'error') {
          onToast({ type: 'error', message: data.message as string });
          setIsSyncing(false);
          setSyncProgress(null);
        }
      });
    } catch (err) {
      onToast({
        type: 'error',
        message: err instanceof Error ? err.message : 'Sync failed',
      });
      setIsSyncing(false);
      setSyncProgress(null);
    }
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
              Ready to connect - Click Connect to authorize
            </span>
          ) : (
            <span
              className={styles.statusBadge}
              style={{
                backgroundColor: 'var(--color-bg-subtle)',
                color: 'var(--color-ink-muted)',
              }}
            >
              Not configured - Admin must set GMAIL_CLIENT_ID and GMAIL_CLIENT_SECRET
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
              className={`${styles.buttonLink} ${styles.buttonLinkDanger}`}
              onClick={handleDisconnect}
              disabled={disconnectEmail.isPending || isSyncing}
            >
              {disconnectEmail.isPending ? 'Disconnecting...' : 'Disconnect Gmail'}
            </button>
          </div>
        </>
      )}

      {/* Has credentials (from env vars) but not connected */}
      {!emailStatus?.connected && emailStatus?.hasCredentials && (
        <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-4)' }}>
          <button
            className={`${styles.button} ${styles.buttonPrimary}`}
            onClick={handleConnect}
            disabled={getAuthUrl.isPending}
          >
            {getAuthUrl.isPending ? 'Connecting...' : 'Connect Gmail'}
          </button>
        </div>
      )}

      {/* No credentials configured */}
      {!emailStatus?.connected && !emailStatus?.hasCredentials && (
        <div
          style={{
            backgroundColor: 'var(--color-bg-subtle)',
            padding: 'var(--space-4)',
            borderRadius: 'var(--radius-lg)',
            marginTop: 'var(--space-4)',
          }}
        >
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-ink-muted)', margin: 0 }}>
            Gmail integration requires the server administrator to configure OAuth credentials.
            Contact your administrator to set up <code>GMAIL_CLIENT_ID</code> and <code>GMAIL_CLIENT_SECRET</code> environment variables.
          </p>
        </div>
      )}
    </section>
  );
}
