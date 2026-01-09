import { useEffect } from 'react';
import { Icons } from './Icons';
import styles from './Toast.module.css';

export type ToastType = 'success' | 'error' | 'info';

interface ToastProps {
  type: ToastType;
  message: string;
  onDismiss: () => void;
  duration?: number;
}

export function Toast({ type, message, onDismiss, duration = 4000 }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, duration);
    return () => clearTimeout(timer);
  }, [onDismiss, duration]);

  return (
    <div className={`${styles.toast} ${styles[type]}`}>
      <span className={styles.icon}>
        {type === 'success' && <Icons.Check />}
        {type === 'error' && <Icons.AlertCircle />}
        {type === 'info' && <Icons.Lightbulb />}
      </span>
      {message}
      <button className={styles.dismiss} onClick={onDismiss} aria-label="Dismiss">
        <Icons.X />
      </button>
    </div>
  );
}
