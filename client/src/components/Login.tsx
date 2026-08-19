import React, { useState } from 'react';
import { supabase } from '../services/supabase';
import styles from './Login.module.css';

export const Login: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);

    try {
      // Always use production URL if we're on the production domain, otherwise use current origin
      const isProductionDomain = window.location.hostname === 'waypoint-o8bu.onrender.com';
      const redirectTo = isProductionDomain
        ? 'https://waypoint-o8bu.onrender.com'
        : window.location.origin;

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          scopes: 'email profile',
        },
      });

      if (error) throw error;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Login failed';
      setError(message);
      setLoading(false);
    }
  };

  return (
    <div className={styles.loginPage}>
      {/* Decorative left panel - visible on larger screens */}
      <div className={styles.decorativePanel}>
        <div className={styles.decorativeContent}>
          <blockquote className={styles.decorativeQuote}>
            The job search is a journey, not a destination. Track every step, celebrate every milestone.
          </blockquote>
          <p className={styles.decorativeAuthor}>— Your Career Companion</p>

          <div className={styles.decorativeStats}>
            <div className={styles.decorativeStat}>
              <span className={styles.statNumber}>100%</span>
              <span className={styles.statLabel}>Organized</span>
            </div>
            <div className={styles.decorativeStat}>
              <span className={styles.statNumber}>Zero</span>
              <span className={styles.statLabel}>Missed Deadlines</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main login area */}
      <main className={styles.loginMain}>
        <div className={styles.loginCard}>
          {/* Brand header */}
          <div className={styles.brandHeader}>
            <div className={styles.brandIcon}>
              <svg className={styles.brandIconSvg} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
            </div>
            <h1 className={styles.brandName}>Waypoint</h1>
            <p className={styles.brandTagline}>Your personal job application tracker</p>
          </div>

          {/* Welcome section */}
          <div className={styles.welcomeSection}>
            <h2 className={styles.welcomeTitle}>Welcome back</h2>
            <p className={styles.welcomeText}>
              Sign in to continue tracking your job applications and career progress.
            </p>
          </div>

          {/* Error message */}
          {error && (
            <div className={styles.errorMessage}>
              <div className={styles.errorIcon}>
                <svg viewBox="0 0 20 20" fill="currentColor" width="20" height="20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <p className={styles.errorText}>{error}</p>
            </div>
          )}

          {/* Google sign-in button */}
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className={styles.googleButton}
          >
            {loading ? (
              <div className={styles.loadingSpinner} />
            ) : (
              <svg className={styles.googleIcon} viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
            )}
            <span className={styles.buttonText}>
              {loading ? 'Signing in...' : 'Continue with Google'}
            </span>
          </button>

          {/* Divider */}
          <div className={styles.divider}>
            <div className={styles.dividerLine} />
            <span className={styles.dividerText}>What you get</span>
            <div className={styles.dividerLine} />
          </div>

          {/* Features list */}
          <div className={styles.featuresList}>
            <div className={styles.featureItem}>
              <div className={styles.featureIcon}>
                <svg viewBox="0 0 20 20" fill="currentColor" width="20" height="20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <span>Track applications in one place</span>
            </div>
            <div className={styles.featureItem}>
              <div className={styles.featureIcon}>
                <svg viewBox="0 0 20 20" fill="currentColor" width="20" height="20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <span>Generate tailored cover letters</span>
            </div>
            <div className={styles.featureItem}>
              <div className={styles.featureIcon}>
                <svg viewBox="0 0 20 20" fill="currentColor" width="20" height="20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <span>Auto-sync from your inbox</span>
            </div>
          </div>

          {/* Footer */}
          <div className={styles.loginFooter}>
            <p className={styles.footerText}>
              By signing in, you agree to our{' '}
              <a href="#" className={styles.footerLink}>terms of service</a>
              {' '}and{' '}
              <a href="#" className={styles.footerLink}>privacy policy</a>.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};
