import { Icons } from './Icons';
import styles from '../App.module.css';

export function Documents() {
  return (
    <div className={styles.mainInner}>
      <div className={styles.page}>
        <header className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>Documents</h1>
          <p className={styles.pageSubtitle}>Cover letters and responses you've generated</p>
        </header>

        <div className={styles.emptyState}>
          <div className={styles.emptyStateIcon}>
            <Icons.Documents />
          </div>
          <h3 className={styles.emptyStateTitle}>No documents yet</h3>
          <p className={styles.emptyStateText}>
            When you generate cover letters or custom responses, they'll appear here
          </p>
        </div>
      </div>
    </div>
  );
}
