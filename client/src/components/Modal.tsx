import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Icons } from './Icons';
import styles from './Modal.module.css';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  children: React.ReactNode;
}

export function Modal({ isOpen, onClose, title, size = 'md', children }: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) onClose();
  };

  const sizeClasses: Record<string, string> = {
    sm: styles.modalSm,
    md: styles.modalMd,
    lg: styles.modalLg,
    xl: styles.modalXl,
    full: styles.modalFull,
  };
  const sizeClass = sizeClasses[size] || styles.modalMd;

  const modalContent = (
    <div className={styles.overlay} ref={overlayRef} onClick={handleOverlayClick}>
      <div className={`${styles.modal} ${sizeClass}`}>
        <div className={styles.header}>
          <h2 className={styles.title}>{title}</h2>
          <button className={styles.closeButton} onClick={onClose} aria-label="Close modal">
            <Icons.X />
          </button>
        </div>
        <div className={styles.body}>
          {children}
        </div>
      </div>
    </div>
  );

  // Portal to document body so modal covers everything
  return createPortal(modalContent, document.body);
}

interface ModalActionsProps {
  children: React.ReactNode;
}

export function ModalActions({ children }: ModalActionsProps) {
  return <div className={styles.actions}>{children}</div>;
}

// Export modal styles for use in confirmation messages
