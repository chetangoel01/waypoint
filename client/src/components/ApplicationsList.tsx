import { useNavigate } from 'react-router-dom';
import { useApplications } from '../hooks';
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

  return (
    <div className={styles.mainInner}>
      <div className={styles.page}>
        <header className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>Applications</h1>
          <p className={styles.pageSubtitle}>
            {applications?.length ?? 0} application{applications?.length !== 1 ? 's' : ''} tracked
          </p>
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
          </div>
        )}
      </div>
    </div>
  );
}
