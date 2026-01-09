import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApplications, useCreateApplication, useDeleteApplication } from '../hooks';
import { Icons } from './Icons';
import { Modal, ModalActions } from './Modal';
import styles from '../App.module.css';

const getStatusClass = (status: string) => {
  const map: Record<string, string> = {
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
  const deleteApplication = useDeleteApplication();
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newApp, setNewApp] = useState({ company: '', role: '', url: '' });
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: number; company: string } | null>(null);

  const handleDeleteApplication = async () => {
    if (!deleteConfirm) return;
    try {
      await deleteApplication.mutateAsync(deleteConfirm.id);
      setDeleteConfirm(null);
    } catch {
      // Error handled by mutation
    }
  };

  if (isLoading) {
    return (
      <div className={styles.mainInner}>
        <div className={styles.page}>
          <header className={styles.pageHeader}>
            <div className={styles.pageHeaderInfo}>
              <h1 className={styles.pageTitle}>Applications</h1>
              <p className={styles.pageSubtitle}>Loading your applications...</p>
            </div>
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
            <div className={styles.pageHeaderInfo}>
              <h1 className={styles.pageTitle}>Applications</h1>
              <p className={styles.pageSubtitle}>Unable to load applications</p>
            </div>
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
        custom_statuses: null,
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
          <div className={styles.pageHeaderInfo}>
            <h1 className={styles.pageTitle}>Applications</h1>
            <p className={styles.pageSubtitle}>
              {applications?.length ?? 0} application{applications?.length !== 1 ? 's' : ''} tracked
            </p>
          </div>
          <button
            className={`${styles.button} ${styles.buttonPrimary}`}
            onClick={() => setIsCreateModalOpen(true)}
          >
            <span className={styles.buttonIcon}><Icons.Plus /></span>
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
                <div className={styles.applicationActions} onClick={(e) => e.stopPropagation()}>
                  <button
                    className={styles.applicationActionBtn}
                    onClick={() => navigate(`/applications/${app.id}`)}
                    title="Edit"
                  >
                    <span className={styles.buttonIcon}><Icons.Edit /></span>
                  </button>
                  <button
                    className={`${styles.applicationActionBtn} ${styles.applicationActionBtnDanger}`}
                    onClick={() => setDeleteConfirm({ id: app.id, company: app.company })}
                    title="Delete"
                  >
                    <span className={styles.buttonIcon}><Icons.Trash /></span>
                  </button>
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
              <span className={styles.buttonIcon}><Icons.Plus /></span>
              Add Your First Application
            </button>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Delete Application?"
        size="sm"
      >
        <p className={styles.formHint}>
          Are you sure you want to delete the application for <strong>{deleteConfirm?.company}</strong>? This action cannot be undone.
        </p>
        <ModalActions>
          <button
            className={`${styles.button} ${styles.buttonSecondary}`}
            onClick={() => setDeleteConfirm(null)}
          >
            Cancel
          </button>
          <button
            className={`${styles.button} ${styles.buttonDanger}`}
            onClick={handleDeleteApplication}
            disabled={deleteApplication.isPending}
          >
            {deleteApplication.isPending ? 'Deleting...' : 'Delete'}
          </button>
        </ModalActions>
      </Modal>

      {/* Create Application Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="New Application"
        size="md"
      >
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

          <ModalActions>
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
          </ModalActions>
        </form>
      </Modal>
    </div>
  );
}
