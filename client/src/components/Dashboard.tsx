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

  // Status distribution data for chart - warm editorial palette
  const statusData = stats ? [
    { label: 'Saved', count: stats.saved, color: '#E8DDD4' },      // Warm cream
    { label: 'Applied', count: stats.applied, color: '#C4795A' },  // Terracotta
    { label: 'Phone Screen', count: stats.phoneScreen, color: '#D4A574' }, // Warm tan
    { label: 'Interview', count: stats.interviews, color: '#D97706' },  // Honey
    { label: 'Offer', count: stats.offers, color: '#059669' },     // Sage
    { label: 'Rejected', count: stats.rejected, color: '#9CA3AF' }, // Muted gray
  ].filter(s => s.count > 0) : [];

  // Calculate applications per day for the last 14 days
  const activityData = (() => {
    if (!applications || applications.length === 0) return [];

    const now = new Date();
    const days: { date: string; count: number; label: string }[] = [];

    // Generate last 14 days
    for (let i = 13; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      days.push({
        date: dateStr,
        count: 0,
        label: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      });
    }

    // Count applications per day
    applications.forEach((app) => {
      const appDate = (app.date_applied || app.date_saved)?.split('T')[0];
      const dayEntry = days.find(d => d.date === appDate);
      if (dayEntry) dayEntry.count++;
    });

    return days;
  })();

  const maxActivityCount = Math.max(...activityData.map(d => d.count), 1);
  const totalRecentActivity = activityData.reduce((sum, d) => sum + d.count, 0);

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
            {/* Mini progress bar for response rate */}
            <div style={{
              width: '100%',
              height: 4,
              backgroundColor: 'var(--color-bg-subtle)',
              borderRadius: 2,
              overflow: 'hidden',
              marginTop: 'var(--space-2)',
            }}>
              <div style={{
                width: `${Math.min(responseRate, 100)}%`,
                height: '100%',
                backgroundColor: responseRate >= 30 ? 'var(--color-sage)' : 'var(--color-honey)',
                transition: 'width 0.3s ease',
              }} />
            </div>
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

        {/* Charts Section - Side by Side */}
        {(statusData.length > 0 || activityData.length > 0) && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: 'var(--space-6)',
            marginTop: 'var(--space-8)',
          }}>
            {/* Status Distribution - Donut Chart */}
            {statusData.length > 0 && (
              <div style={{
                backgroundColor: 'var(--color-bg)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-lg)',
                padding: 'var(--space-6)',
              }}>
                <h3 style={{
                  fontFamily: 'var(--font-serif)',
                  fontSize: 'var(--text-lg)',
                  fontWeight: 500,
                  color: 'var(--color-ink)',
                  marginBottom: 'var(--space-5)',
                  letterSpacing: '-0.01em',
                }}>
                  Pipeline
                </h3>

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-6)',
                }}>
                  {/* Donut */}
                  <div style={{ position: 'relative', width: 120, height: 120, flexShrink: 0 }}>
                    <svg
                      viewBox="0 0 100 100"
                      style={{ transform: 'rotate(-90deg)', width: '100%', height: '100%' }}
                    >
                      {/* Background ring */}
                      <circle
                        cx="50"
                        cy="50"
                        r="38"
                        fill="none"
                        stroke="var(--color-bg-subtle)"
                        strokeWidth="12"
                      />
                      {(() => {
                        const total = statusData.reduce((sum, s) => sum + s.count, 0);
                        const radius = 38;
                        const circumference = 2 * Math.PI * radius;
                        let offset = 0;

                        return statusData.map((status) => {
                          const percentage = status.count / total;
                          const dashLength = percentage * circumference;
                          const dashOffset = -offset;
                          offset += dashLength;

                          return (
                            <circle
                              key={status.label}
                              cx="50"
                              cy="50"
                              r={radius}
                              fill="none"
                              stroke={status.color}
                              strokeWidth="12"
                              strokeDasharray={`${dashLength} ${circumference - dashLength}`}
                              strokeDashoffset={dashOffset}
                              style={{ transition: 'stroke-dasharray 0.5s ease' }}
                            />
                          );
                        });
                      })()}
                    </svg>
                    {/* Center */}
                    <div style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      textAlign: 'center',
                    }}>
                      <div style={{
                        fontFamily: 'var(--font-serif)',
                        fontSize: 'var(--text-2xl)',
                        fontWeight: 500,
                        color: 'var(--color-ink)',
                        lineHeight: 1,
                      }}>
                        {stats?.total ?? 0}
                      </div>
                    </div>
                  </div>

                  {/* Legend */}
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 'var(--space-2)',
                    flex: 1,
                  }}>
                    {statusData.map((status) => (
                      <div
                        key={status.label}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          fontSize: 'var(--text-sm)',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                          <span style={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            backgroundColor: status.color,
                          }} />
                          <span style={{ color: 'var(--color-ink-light)' }}>{status.label}</span>
                        </div>
                        <span style={{
                          fontWeight: 600,
                          color: 'var(--color-ink)',
                          fontVariantNumeric: 'tabular-nums',
                        }}>
                          {status.count}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Activity - Sparkline Chart */}
            {activityData.length > 0 && (
              <div style={{
                backgroundColor: 'var(--color-bg)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-lg)',
                padding: 'var(--space-6)',
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'baseline',
                  marginBottom: 'var(--space-5)',
                }}>
                  <h3 style={{
                    fontFamily: 'var(--font-serif)',
                    fontSize: 'var(--text-lg)',
                    fontWeight: 500,
                    color: 'var(--color-ink)',
                    letterSpacing: '-0.01em',
                  }}>
                    Activity
                  </h3>
                  <span style={{
                    fontSize: 'var(--text-sm)',
                    color: 'var(--color-ink-muted)',
                  }}>
                    Last 14 days
                  </span>
                </div>

                {/* Big number */}
                <div style={{ marginBottom: 'var(--space-4)' }}>
                  <span style={{
                    fontFamily: 'var(--font-serif)',
                    fontSize: 'var(--text-4xl)',
                    fontWeight: 400,
                    color: 'var(--color-ink)',
                    lineHeight: 1,
                  }}>
                    {totalRecentActivity}
                  </span>
                  <span style={{
                    fontSize: 'var(--text-sm)',
                    color: 'var(--color-ink-muted)',
                    marginLeft: 'var(--space-2)',
                  }}>
                    applications
                  </span>
                </div>

                {/* Sparkline */}
                <div style={{ height: 60 }}>
                  <svg
                    viewBox="0 0 280 50"
                    preserveAspectRatio="none"
                    style={{ width: '100%', height: '100%' }}
                  >
                    {/* Gradient definition */}
                    <defs>
                      <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#C4795A" stopOpacity="0.2" />
                        <stop offset="100%" stopColor="#C4795A" stopOpacity="0" />
                      </linearGradient>
                    </defs>

                    {/* Area */}
                    <path
                      d={`
                        M 0 ${50 - (activityData[0]?.count / maxActivityCount) * 45}
                        ${activityData.map((d, i) => `L ${(i / (activityData.length - 1)) * 280} ${50 - (d.count / maxActivityCount) * 45}`).join(' ')}
                        L 280 50
                        L 0 50
                        Z
                      `}
                      fill="url(#areaGradient)"
                    />

                    {/* Line */}
                    <path
                      d={`M ${activityData.map((d, i) => `${(i / (activityData.length - 1)) * 280} ${50 - (d.count / maxActivityCount) * 45}`).join(' L ')}`}
                      fill="none"
                      stroke="#C4795A"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>

                {/* Date range */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginTop: 'var(--space-2)',
                }}>
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-ink-muted)' }}>
                    {activityData[0]?.label}
                  </span>
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-ink-muted)' }}>
                    {activityData[activityData.length - 1]?.label}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Recent Activity */}
        <div className={styles.sectionHeader} style={{ marginTop: 'var(--space-8)' }}>
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
