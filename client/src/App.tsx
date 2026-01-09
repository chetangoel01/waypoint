import { Routes, Route, NavLink } from 'react-router-dom';
import {
  Icons,
  Dashboard,
  ApplicationsList,
  ApplicationDetail,
  Profile,
  Documents,
  Settings,
} from './components';
import styles from './App.module.css';

export default function App() {
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
