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
      <h2 className={styles.profileSectionTitle}>Email Integration</h2>
      <p className={`${styles.formHint} ${styles.settingsSectionIntro}`}>
        Connect Gmail to detect and track job application emails.
      </p>

      <div className={styles.formGroup}>
        <label className={styles.formLabel}>Status</label>
        <div>
          {isLoading ? (
            <span className={`${styles.statusBadge} ${styles.statusSaved}`}>Checking...</span>
          ) : emailStatus?.connected ? (
            <span className={`${styles.statusBadge} ${styles.statusOffer}`}>
              Connected {emailStatus.email && `(${emailStatus.email})`}
            </span>
          ) : emailStatus?.hasCredentials ? (
            <span className={`${styles.statusBadge} ${styles.statusInterview}`}>Ready to connect</span>
          ) : (
            <span className={`${styles.statusBadge} ${styles.statusSaved}`}>Not configured</span>
          )}
        </div>
      </div>

      {/* Connected state */}
      {emailStatus?.connected && (
        <>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Last Sync</label>
            <p className={styles.settingsMetaText}>
              {formatLastSync(emailStatus.lastSync)}
            </p>
          </div>

          {/* Sync Progress */}
          {isSyncing && syncProgress && (
            <div className={styles.settingsProgressCard}>
              <div className={styles.settingsProgressRow}>
                <span className={styles.settingsSpinner}>
                  <Icons.Loader />
                </span>
                <span className={styles.settingsProgressTitle}>
                  {syncProgress.stage === 'fetching' && 'Fetching emails...'}
                  {syncProgress.stage === 'processing' && 'Analyzing emails...'}
                  {syncProgress.stage === 'saving' && 'Saving application...'}
                  {syncProgress.stage === 'complete' && 'Complete!'}
                  {syncProgress.stage === 'error' && 'Error'}
                </span>
              </div>

              {syncProgress.total > 0 && (
                <div className={styles.settingsProgressBar}>
                  <div
                    className={styles.settingsProgressFill}
                    style={{ width: `${(syncProgress.current / syncProgress.total) * 100}%` }}
                  />
                </div>
              )}

              <p className={styles.settingsProgressHint}>
                {syncProgress.message}
              </p>
              {syncProgress.emailSubject && (
                <p className={styles.settingsProgressEmail}>
                  {syncProgress.emailSubject}
                </p>
              )}
            </div>
          )}

          <div className={styles.settingsButtonRow}>
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
              {disconnectEmail.isPending ? 'Disconnecting...' : 'Disconnect'}
            </button>
          </div>
        </>
      )}

      {/* Has credentials but not connected */}
      {!emailStatus?.connected && emailStatus?.hasCredentials && (
        <button
          className={`${styles.button} ${styles.buttonPrimary}`}
          onClick={handleConnect}
          disabled={getAuthUrl.isPending}
        >
          {getAuthUrl.isPending ? 'Connecting...' : 'Connect Gmail'}
        </button>
      )}

      {/* No credentials configured */}
      {!emailStatus?.connected && !emailStatus?.hasCredentials && (
        <p className={styles.formHint}>
          Gmail integration requires OAuth credentials. Set <code className={styles.settingsCode}>GMAIL_CLIENT_ID</code> and{' '}
          <code className={styles.settingsCode}>GMAIL_CLIENT_SECRET</code> environment variables to enable.
        </p>
      )}
    </section>
  );
}
