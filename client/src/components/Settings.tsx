import styles from '../App.module.css';

export function Settings() {
  return (
    <div className={styles.mainInner}>
      <div className={styles.page}>
        <header className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>Settings</h1>
          <p className={styles.pageSubtitle}>Configure your preferences</p>
        </header>

        <section className={styles.profileSection}>
          <h2 className={styles.profileSectionTitle}>API Configuration</h2>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Gemini API Key</label>
            <p className={styles.formHint}>Required for AI-powered content generation</p>
            <input type="password" placeholder="Enter your API key" style={{ maxWidth: '400px' }} />
          </div>
        </section>

        <section className={styles.profileSection}>
          <h2 className={styles.profileSectionTitle}>Data Management</h2>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Export Your Data</label>
            <p className={styles.formHint}>Download all your data as a JSON file</p>
            <button className={`${styles.button} ${styles.buttonSecondary}`} style={{ marginTop: '0.5rem' }}>
              Export to JSON
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
