import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApplications, useCreateApplication, useDeleteApplication } from '../hooks';
import { Icons } from './Icons';
import { Modal, ModalActions } from './Modal';
import { modalStyles } from './modalStyles';
import { validateForm, required, maxLength, url, combine } from '../utils/validation';
import styles from '../App.module.css';

type SortOption = 'updated' | 'applied' | 'company_asc' | 'company_desc' | 'status';

const sortOptions: { value: SortOption; label: string }[] = [
  { value: 'updated', label: 'Last Updated' },
  { value: 'applied', label: 'Date Applied' },
  { value: 'company_asc', label: 'Company (A-Z)' },
  { value: 'company_desc', label: 'Company (Z-A)' },
  { value: 'status', label: 'Status' },
];

const statusOrder: Record<string, number> = {
  offer: 1,
  interview: 2,
  phone_screen: 3,
  applied: 4,
  saved: 5,
  withdrawn: 6,
  rejected: 7,
};

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

  // Filter and sort state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('updated');

  // Form validation state
  const [formErrors, setFormErrors] = useState<{ company?: string; role?: string; url?: string }>({});

  const statusOptions = [
    { key: 'saved', label: 'Saved' },
    { key: 'applied', label: 'Applied' },
    { key: 'phone_screen', label: 'Phone Screen' },
    { key: 'interview', label: 'Interview' },
    { key: 'offer', label: 'Offer' },
    { key: 'rejected', label: 'Rejected' },
    { key: 'withdrawn', label: 'Withdrawn' },
  ];

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

  // Filter and sort applications
  const filteredApplications = [...(applications ?? [])]
    .filter((app) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesCompany = app.company.toLowerCase().includes(query);
        const matchesRole = app.role.toLowerCase().includes(query);
        if (!matchesCompany && !matchesRole) return false;
      }
      // Status filter
      if (statusFilter && app.status !== statusFilter) return false;
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'applied': {
          // Sort by date_applied (most recent first), then by date_saved
          const dateA = a.date_applied || a.date_saved || '';
          const dateB = b.date_applied || b.date_saved || '';
          return new Date(dateB).getTime() - new Date(dateA).getTime();
        }
        case 'company_asc':
          return a.company.localeCompare(b.company);
        case 'company_desc':
          return b.company.localeCompare(a.company);
        case 'status':
          return (statusOrder[a.status] ?? 99) - (statusOrder[b.status] ?? 99);
        case 'updated':
        default:
          return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
      }
    });

  const hasActiveFilters = searchQuery || statusFilter;

  const handleCreateApplication = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form
    const { valid, errors } = validateForm(newApp, {
      company: combine(required('Company'), maxLength(255, 'Company')),
      role: combine(required('Role'), maxLength(255, 'Role')),
      url: url('Job URL'),
    });

    setFormErrors(errors);
    if (!valid) return;

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
      setFormErrors({});
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

        {/* Filters */}
        {(applications?.length ?? 0) > 0 && (
          <div style={{ marginBottom: 'var(--space-6)' }}>
            {/* Search */}
            <div style={{ position: 'relative', marginBottom: 'var(--space-4)' }}>
              <span style={{
                position: 'absolute',
                left: 'var(--space-3)',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--color-ink-muted)',
                pointerEvents: 'none',
                width: 16,
                height: 16,
              }}>
                <Icons.Search />
              </span>
              <input
                type="text"
                placeholder="Search by company or role..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  paddingLeft: 'var(--space-10)',
                }}
              />
            </div>

            {/* Status Filter Pills + Sort */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
                <button
                  onClick={() => setStatusFilter(null)}
                  style={{
                    padding: 'var(--space-1) var(--space-3)',
                    borderRadius: '9999px',
                    fontSize: 'var(--text-sm)',
                    fontWeight: statusFilter === null ? 600 : 400,
                    backgroundColor: statusFilter === null ? 'var(--color-ink)' : 'var(--color-bg-subtle)',
                    color: statusFilter === null ? 'white' : 'var(--color-ink-muted)',
                    border: '1px solid transparent',
                    transition: 'all var(--duration-fast) var(--ease-out)',
                  }}
                >
                  All
                </button>
                {statusOptions.map((status) => (
                  <button
                    key={status.key}
                    onClick={() => setStatusFilter(statusFilter === status.key ? null : status.key)}
                    style={{
                      padding: 'var(--space-1) var(--space-3)',
                      borderRadius: '9999px',
                      fontSize: 'var(--text-sm)',
                      fontWeight: statusFilter === status.key ? 600 : 400,
                      backgroundColor: statusFilter === status.key ? 'var(--color-ink)' : 'var(--color-bg-subtle)',
                      color: statusFilter === status.key ? 'white' : 'var(--color-ink-muted)',
                      border: '1px solid transparent',
                      transition: 'all var(--duration-fast) var(--ease-out)',
                    }}
                  >
                    {status.label}
                  </button>
                ))}
              </div>

              {/* Sort Dropdown */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <label style={{ fontSize: 'var(--text-sm)', color: 'var(--color-ink-muted)' }}>
                  Sort by:
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  style={{
                    padding: 'var(--space-1) var(--space-3)',
                    fontSize: 'var(--text-sm)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border)',
                    backgroundColor: 'var(--color-bg)',
                    color: 'var(--color-ink)',
                    cursor: 'pointer',
                  }}
                >
                  {sortOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {filteredApplications.length > 0 ? (
          <div className={styles.applicationsList}>
            {filteredApplications.map((app) => (
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
        ) : hasActiveFilters ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyStateIcon}>
              <Icons.Search />
            </div>
            <h3 className={styles.emptyStateTitle}>No matching applications</h3>
            <p className={styles.emptyStateText}>
              Try adjusting your search or filters
            </p>
            <button
              className={`${styles.button} ${styles.buttonSecondary}`}
              onClick={() => { setSearchQuery(''); setStatusFilter(null); }}
              style={{ marginTop: 'var(--space-4)' }}
            >
              Clear Filters
            </button>
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
        <p className={modalStyles.confirmMessage}>
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
        onClose={() => {
          setIsCreateModalOpen(false);
          setFormErrors({});
        }}
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
              onChange={(e) => {
                setNewApp({ ...newApp, company: e.target.value });
                if (formErrors.company) setFormErrors({ ...formErrors, company: undefined });
              }}
              autoFocus
              style={formErrors.company ? { borderColor: 'var(--color-rose)' } : undefined}
            />
            {formErrors.company && (
              <span style={{ color: 'var(--color-rose)', fontSize: 'var(--text-sm)', marginTop: 'var(--space-1)', display: 'block' }}>
                {formErrors.company}
              </span>
            )}
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Role *</label>
            <input
              type="text"
              placeholder="e.g., Senior Software Engineer"
              value={newApp.role}
              onChange={(e) => {
                setNewApp({ ...newApp, role: e.target.value });
                if (formErrors.role) setFormErrors({ ...formErrors, role: undefined });
              }}
              style={formErrors.role ? { borderColor: 'var(--color-rose)' } : undefined}
            />
            {formErrors.role && (
              <span style={{ color: 'var(--color-rose)', fontSize: 'var(--text-sm)', marginTop: 'var(--space-1)', display: 'block' }}>
                {formErrors.role}
              </span>
            )}
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Job URL (optional)</label>
            <input
              type="url"
              placeholder="https://..."
              value={newApp.url}
              onChange={(e) => {
                setNewApp({ ...newApp, url: e.target.value });
                if (formErrors.url) setFormErrors({ ...formErrors, url: undefined });
              }}
              style={formErrors.url ? { borderColor: 'var(--color-rose)' } : undefined}
            />
            {formErrors.url && (
              <span style={{ color: 'var(--color-rose)', fontSize: 'var(--text-sm)', marginTop: 'var(--space-1)', display: 'block' }}>
                {formErrors.url}
              </span>
            )}
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
              onClick={() => {
                setIsCreateModalOpen(false);
                setFormErrors({});
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`${styles.button} ${styles.buttonPrimary}`}
              disabled={createApplication.isPending}
            >
              {createApplication.isPending ? 'Creating...' : 'Create Application'}
            </button>
          </ModalActions>
        </form>
      </Modal>
    </div>
  );
}
