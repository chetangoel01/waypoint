import { Link } from 'react-router-dom';
import { useApplications, computeApplicationStats } from '../hooks';
import { Icons } from './Icons';
import styles from '../App.module.css';

// Helper to get greeting based on time
function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

// Format a date string to relative time
function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function Dashboard() {
  const { data: applications, isLoading, error } = useApplications();
  
  const stats = applications ? computeApplicationStats(applications) : null;
  
  // Get recent activity from applications
  const recentApplications = applications
    ?.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    .slice(0, 4) ?? [];

  if (isLoading) {
    return (
      <div className={styles.mainInner}>
        <div className={styles.page}>
          <header className={styles.pageHeader}>
            <div className={styles.pageHeaderInfo}>
              <h1 className={styles.pageTitle}>{getGreeting()}</h1>
              <p className={styles.pageSubtitle}>Loading your job search data...</p>
            </div>
          </header>
          <div className={styles.statsGrid}>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className={styles.statCard} style={{ opacity: 0.5 }}>
                <div className={styles.statLabel}>Loading...</div>
                <div className={styles.statValue}>—</div>
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
              <h1 className={styles.pageTitle}>{getGreeting()}</h1>
              <p className={styles.pageSubtitle}>Unable to load data</p>
            </div>
          </header>
          <div className={styles.emptyState}>
            <div className={styles.emptyStateIcon}>
              <Icons.AlertCircle />
            </div>
            <h3 className={styles.emptyStateTitle}>Connection Error</h3>
            <p className={styles.emptyStateText}>
              {error instanceof Error ? error.message : 'Failed to connect to the server'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const responseRate = stats && stats.total > 0 
    ? Math.round(((stats.interviews + stats.offers) / (stats.total - stats.active)) * 100) || 0
    : 0;

  return (
    <div className={styles.mainInner}>
      <div className={styles.page}>
        <header className={styles.pageHeader}>
          <div className={styles.pageHeaderInfo}>
            <h1 className={styles.pageTitle}>{getGreeting()}</h1>
            <p className={styles.pageSubtitle}>Here's where you stand in your job search</p>
          </div>
        </header>

        {/* Stats */}
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Active Applications</div>
            <div className={styles.statValue}>{stats?.active ?? 0}</div>
            <div className={styles.statMeta}>
              {stats?.awaitingResponse ?? 0} awaiting response
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Interviews</div>
            <div className={styles.statValue}>{stats?.interviews ?? 0}</div>
            <div className={styles.statMeta}>
              {stats?.interviewsThisWeek ?? 0} this week
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Response Rate</div>
            <div className={styles.statValue}>{responseRate}%</div>
            <div className={styles.statMeta}>
              {responseRate >= 30 ? 'Above average' : responseRate > 0 ? 'Keep going!' : 'No responses yet'}
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Total Applications</div>
            <div className={styles.statValue}>{stats?.total ?? 0}</div>
            <div className={styles.statMeta}>
              {stats?.offers ?? 0} offers received
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Recent Activity</h2>
          <Link to="/applications" className={styles.sectionLink}>View all</Link>
        </div>
        
        {recentApplications.length > 0 ? (
          <div className={styles.activityList}>
            {recentApplications.map((app) => (
              <Link 
                key={app.id} 
                to={`/applications/${app.id}`}
                className={styles.activityItem}
                style={{ textDecoration: 'none' }}
              >
                <div 
                  className={styles.activityDot} 
                  style={{ 
                    backgroundColor: 
                      app.status === 'interview' ? 'var(--color-sage)' :
                      app.status === 'applied' ? 'var(--color-terracotta)' :
                      app.status === 'offer' ? 'var(--color-amber)' :
                      undefined
                  }} 
                />
                <div className={styles.activityContent}>
                  <p className={styles.activityTitle}>
                    {app.status === 'saved' && `Saved position at ${app.company}`}
                    {app.status === 'applied' && `Applied to ${app.company}`}
                    {app.status === 'interview' && `Interview with ${app.company}`}
                    {app.status === 'phone_screen' && `Phone screen with ${app.company}`}
                    {app.status === 'offer' && `Offer from ${app.company}`}
                    {app.status === 'rejected' && `Rejected by ${app.company}`}
                    {app.status === 'withdrawn' && `Withdrew from ${app.company}`}
                  </p>
                  <p className={styles.activityMeta}>
                    {app.role} · {formatRelativeTime(app.updated_at)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className={styles.emptyState}>
            <div className={styles.emptyStateIcon}>
              <Icons.Applications />
            </div>
            <h3 className={styles.emptyStateTitle}>No applications yet</h3>
            <p className={styles.emptyStateText}>
              Start tracking your job applications to see your progress here
            </p>
            <Link
              to="/applications"
              className={`${styles.button} ${styles.buttonPrimary}`}
              style={{ marginTop: 'var(--space-4)', display: 'inline-flex' }}
            >
              <span className={styles.buttonIcon}><Icons.Plus /></span>
              Add Application
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
