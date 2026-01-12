import { useState, useEffect } from 'react';
import { Routes, Route, NavLink } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Icons,
  Dashboard,
  ApplicationsList,
  ApplicationDetail,
  Profile,
  Documents,
  Settings,
} from './components';
import { Login } from './components/Login';
import { Onboarding } from './components/Onboarding';
import { useAuth } from './components/AuthProvider';
import { profileApi } from './services/api';
import styles from './App.module.css';

function LoadingSpinner() {
  return (
    <div className={styles.loadingContainer}>
      <div className={styles.spinner} />
      <p>Loading...</p>
    </div>
  );
}

export default function App() {
  const { user, loading, signOut } = useAuth();
  const [onboardingComplete, setOnboardingComplete] = useState<boolean | null>(null);

  // Fetch profile to check if onboarding is needed
  const { data: profile, isLoading: profileLoading, refetch: refetchProfile } = useQuery({
    queryKey: ['profile', 'onboarding-check'],
    queryFn: profileApi.get,
    enabled: !!user, // Only fetch when user is logged in
    staleTime: 0, // Always check fresh
  });

  // Determine onboarding status when profile loads
  useEffect(() => {
    if (profile) {
      // Consider onboarding complete if user has a name set
      const hasCompletedOnboarding = !!profile.name;
      setOnboardingComplete(hasCompletedOnboarding);
    }
  }, [profile]);

  // Show loading spinner while checking auth state
  if (loading) {
    return <LoadingSpinner />;
  }

  // Show login if not authenticated
  if (!user) {
    return <Login />;
  }

  // Show loading while checking profile
  if (profileLoading || onboardingComplete === null) {
    return <LoadingSpinner />;
  }

  // Show onboarding for new users
  if (!onboardingComplete) {
    return (
      <Onboarding
        userEmail={user.email}
        userName={user.user_metadata?.full_name || user.user_metadata?.name}
        onComplete={() => {
          setOnboardingComplete(true);
          refetchProfile();
        }}
      />
    );
  }

  return (
    <div className={styles.container}>
      <aside className={styles.sidebar}>
        <div className={styles.logo}>
          <h1 className={styles.logoText}>Waypoint</h1>
          <p className={styles.logoSubtext}>Job Tracker</p>
        </div>

        <nav className={styles.nav}>
          <span className={styles.navSection}>Overview</span>
          <NavLink
            to="/"
            className={({ isActive }) =>
              `${styles.navLink} ${isActive ? styles.active : ''}`
            }
            end
          >
            <span className={styles.navIcon}><Icons.Dashboard /></span>
            Dashboard
          </NavLink>

          <span className={styles.navSection} style={{ marginTop: '1rem' }}>Manage</span>
          <NavLink
            to="/applications"
            className={({ isActive }) =>
              `${styles.navLink} ${isActive ? styles.active : ''}`
            }
          >
            <span className={styles.navIcon}><Icons.Applications /></span>
            Applications
          </NavLink>
          <NavLink
            to="/profile"
            className={({ isActive }) =>
              `${styles.navLink} ${isActive ? styles.active : ''}`
            }
          >
            <span className={styles.navIcon}><Icons.Profile /></span>
            Profile
          </NavLink>
          <NavLink
            to="/documents"
            className={({ isActive }) =>
              `${styles.navLink} ${isActive ? styles.active : ''}`
            }
          >
            <span className={styles.navIcon}><Icons.Documents /></span>
            Documents
          </NavLink>

          <span className={styles.navSection} style={{ marginTop: '1rem' }}>System</span>
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              `${styles.navLink} ${isActive ? styles.active : ''}`
            }
          >
            <span className={styles.navIcon}><Icons.Settings /></span>
            Settings
          </NavLink>
        </nav>

        <div className={styles.sidebarFooter}>
          <div className={styles.userInfo}>
            <span className={styles.userEmail}>{user.email}</span>
            <button 
              onClick={signOut}
              className={styles.signOutButton}
            >
              Sign Out
            </button>
          </div>
          <span className={styles.versionBadge}>v1.0.0</span>
        </div>
      </aside>

      <main className={styles.main}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/applications" element={<ApplicationsList />} />
          <Route path="/applications/:id" element={<ApplicationDetail />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/documents" element={<Documents />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </main>
    </div>
  );
}
