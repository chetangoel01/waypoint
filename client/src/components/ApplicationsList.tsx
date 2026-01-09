import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApplications, useCreateApplication } from '../hooks';
import { Icons } from './Icons';
import styles from '../App.module.css';
import type { ApplicationStatus } from '../types';

const getStatusClass = (status: ApplicationStatus) => {
  const map: Record<ApplicationStatus, string> = {
    saved: styles.statusSaved,
    applied: styles.statusApplied,
    phone_screen: styles.statusApplied,
    interview: styles.statusInterview,
    offer: styles.statusOffer,
    rejected: styles.statusRejected,
    withdrawn: styles.statusRejected,
  };
  return map[status] || styles.statusSaved;
};

const formatDate = (dateString: string | null): string => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

export function ApplicationsList() {
  const navigate = useNavigate();
  const { data: applications, isLoading, error } = useApplications();
  const createApplication = useCreateApplication();
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newApp, setNewApp] = useState({ company: '', role: '', url: '' });

  if (isLoading) {
    return (
      <div className={styles.mainInner}>
        <div className={styles.page}>
          <header className={styles.pageHeader}>
            <h1 className={styles.pageTitle}>Applications</h1>
            <p className={styles.pageSubtitle}>Loading your applications...</p>
          </header>
          <div className={styles.applicationsList}>
            {[1, 2, 3].map((i) => (
              <div key={i} className={styles.applicationCard} style={{ opacity: 0.5 }}>
                <div className={styles.applicationLogo}>...</div>
                <div className={styles.applicationInfo}>
                  <h3 className={styles.applicationCompany}>Loading...</h3>
                  <p className={styles.applicationRole}>Please wait</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.mainInner}>
        <div className={styles.page}>
          <header className={styles.pageHeader}>
            <h1 className={styles.pageTitle}>Applications</h1>
            <p className={styles.pageSubtitle}>Unable to load applications</p>
          </header>
          <div className={styles.emptyState}>
            <div className={styles.emptyStateIcon}>
              <Icons.AlertCircle />
            </div>
            <h3 className={styles.emptyStateTitle}>Error Loading Applications</h3>
            <p className={styles.emptyStateText}>
              {error instanceof Error ? error.message : 'Failed to fetch applications'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const sortedApplications = [...(applications ?? [])].sort(
    (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
  );

  const handleCreateApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newApp.company.trim() || !newApp.role.trim()) return;
    
    try {
      const created = await createApplication.mutateAsync({
        company: newApp.company.trim(),
        role: newApp.role.trim(),
        url: newApp.url.trim() || null,
        job_description: null,
        status: 'saved',
        date_saved: new Date().toISOString().split('T')[0],
        date_applied: null,
        contacts: null,
        notes: null,
      });
      setIsCreateModalOpen(false);
      setNewApp({ company: '', role: '', url: '' });
      navigate(`/applications/${created.id}`);
    } catch {
      // Error handled by mutation
    }
  };

  return (
    <div className={styles.mainInner}>
      <div className={styles.page}>
        <header className={styles.pageHeader}>
          <div>
            <h1 className={styles.pageTitle}>Applications</h1>
            <p className={styles.pageSubtitle}>
              {applications?.length ?? 0} application{applications?.length !== 1 ? 's' : ''} tracked
            </p>
          </div>
          <button 
            className={`${styles.button} ${styles.buttonPrimary}`}
            onClick={() => setIsCreateModalOpen(true)}
          >
            <span className={styles.navIcon}><Icons.Plus /></span>
            New Application
          </button>
        </header>

        {sortedApplications.length > 0 ? (
          <div className={styles.applicationsList}>
            {sortedApplications.map((app) => (
              <div
                key={app.id}
                className={styles.applicationCard}
                onClick={() => navigate(`/applications/${app.id}`)}
              >
                <div className={styles.applicationLogo}>
                  {app.company.charAt(0)}
                </div>
                <div className={styles.applicationInfo}>
                  <h3 className={styles.applicationCompany}>{app.company}</h3>
                  <p className={styles.applicationRole}>{app.role}</p>
                  <div className={styles.applicationMeta}>
                    <span className={`${styles.statusBadge} ${getStatusClass(app.status)}`}>
                      {app.status.replace('_', ' ')}
                    </span>
                    <span className={styles.dateBadge}>
                      {formatDate(app.date_applied || app.date_saved)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className={styles.emptyState}>
            <div className={styles.emptyStateIcon}>
              <Icons.Applications />
            </div>
            <h3 className={styles.emptyStateTitle}>No applications yet</h3>
            <p className={styles.emptyStateText}>
              Start tracking your job applications to see them here
            </p>
            <button 
              className={`${styles.button} ${styles.buttonPrimary}`}
              onClick={() => setIsCreateModalOpen(true)}
              style={{ marginTop: 'var(--space-4)' }}
            >
              <span className={styles.navIcon}><Icons.Plus /></span>
              Add Your First Application
            </button>
          </div>
        )}
      </div>

      {/* Create Application Modal */}
      {isCreateModalOpen && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setIsCreateModalOpen(false)}
        >
          <div 
            style={{
              backgroundColor: 'var(--color-bg)',
              borderRadius: 'var(--radius-xl)',
              padding: 'var(--space-6)',
              width: '100%',
              maxWidth: '480px',
              boxShadow: 'var(--shadow-xl)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-5)' }}>
              <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 600, color: 'var(--color-ink)' }}>
                New Application
              </h2>
              <button 
                onClick={() => setIsCreateModalOpen(false)}
                style={{ 
                  width: 32, 
                  height: 32, 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--color-ink-muted)',
                }}
              >
                <span style={{ transform: 'rotate(45deg)', display: 'flex', width: 20, height: 20 }}>
                  <Icons.Plus />
                </span>
              </button>
            </div>

            <form onSubmit={handleCreateApplication}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Company *</label>
                <input
                  type="text"
                  placeholder="e.g., Acme Inc."
                  value={newApp.company}
                  onChange={(e) => setNewApp({ ...newApp, company: e.target.value })}
                  autoFocus
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Role *</label>
                <input
                  type="text"
                  placeholder="e.g., Senior Software Engineer"
                  value={newApp.role}
                  onChange={(e) => setNewApp({ ...newApp, role: e.target.value })}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Job URL (optional)</label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={newApp.url}
                  onChange={(e) => setNewApp({ ...newApp, url: e.target.value })}
                />
              </div>

              {createApplication.error && (
                <p style={{ color: 'var(--color-rose)', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-4)' }}>
                  {createApplication.error instanceof Error ? createApplication.error.message : 'Failed to create application'}
                </p>
              )}

              <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end', marginTop: 'var(--space-5)' }}>
                <button 
                  type="button"
                  className={`${styles.button} ${styles.buttonSecondary}`}
                  onClick={() => setIsCreateModalOpen(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className={`${styles.button} ${styles.buttonPrimary}`}
                  disabled={!newApp.company.trim() || !newApp.role.trim() || createApplication.isPending}
                >
                  {createApplication.isPending ? 'Creating...' : 'Create Application'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
