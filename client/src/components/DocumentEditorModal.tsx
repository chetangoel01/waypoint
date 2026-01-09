import { useState, useEffect } from 'react';
import { useDocument, useAddDocumentVersion } from '../hooks';
import { Icons } from './Icons';
import { Modal, ModalActions } from './Modal';
import styles from './GenerateModal.module.css';
import appStyles from '../App.module.css';

interface DocumentEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentId: number;
  applicationName?: string;
  onViewHistory: () => void;
}

export function DocumentEditorModal({
  isOpen,
  onClose,
  documentId,
  applicationName,
  onViewHistory,
}: DocumentEditorModalProps) {
  const { data: document, isLoading } = useDocument(documentId);
  const addVersion = useAddDocumentVersion();

  const [content, setContent] = useState('');
  const [hasChanges, setHasChanges] = useState(false);

  // Get the latest version content when document loads
  const latestVersion = document?.versions?.[0];

  useEffect(() => {
    if (latestVersion?.content) {
      setContent(latestVersion.content);
      setHasChanges(false);
    }
  }, [latestVersion?.content]);

  const handleContentChange = (newContent: string) => {
    setContent(newContent);
    setHasChanges(newContent !== latestVersion?.content);
  };

  const handleSave = async () => {
    if (!hasChanges || !content.trim()) return;

    try {
      await addVersion.mutateAsync({
        documentId,
        data: {
          content: content.trim(),
          is_ai_generated: false,
        },
      });
      setHasChanges(false);
    } catch {
      // Error handled by mutation
    }
  };

  const handleClose = () => {
    if (hasChanges) {
      const confirmed = window.confirm('You have unsaved changes. Are you sure you want to close?');
      if (!confirmed) return;
    }
    onClose();
  };

  const typeLabel = document?.type === 'cover_letter' ? 'Cover Letter' : 'Response';
  const versionCount = document?.versions?.length ?? 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={isLoading ? 'Loading...' : typeLabel}
      size="lg"
    >
      {isLoading ? (
        <div className={styles.emptyState}>
          <p>Loading document...</p>
        </div>
      ) : document ? (
        <>
          {/* Meta info */}
          {applicationName && (
            <div className={styles.meta} style={{ margin: 'calc(-1 * var(--space-6))', marginBottom: 'var(--space-4)', marginTop: 'calc(-1 * var(--space-6))' }}>
              <span className={styles.company}>{applicationName}</span>
            </div>
          )}

          {/* Question (for custom responses) */}
          {document.type === 'custom_question' && document.question && (
            <div className={styles.field}>
              <label className={styles.label}>Question</label>
              <p style={{
                fontSize: 'var(--text-sm)',
                color: 'var(--color-ink-light)',
                margin: 0,
                padding: 'var(--space-3)',
                background: 'var(--color-bg-subtle)',
                borderRadius: 'var(--radius-md)',
              }}>
                {document.question}
              </p>
            </div>
          )}

          {/* Content editor */}
          <div className={styles.resultContainer}>
            <textarea
              className={styles.resultTextarea}
              value={content}
              onChange={(e) => handleContentChange(e.target.value)}
              rows={14}
              placeholder="Document content..."
            />
          </div>

          {/* Version info */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: 'var(--text-sm)',
            color: 'var(--color-ink-muted)',
            marginBottom: 'var(--space-4)',
          }}>
            <span>
              Version {latestVersion?.version ?? 1} of {versionCount}
              {latestVersion?.is_ai_generated && (
                <span style={{
                  marginLeft: 'var(--space-2)',
                  padding: '2px 6px',
                  background: 'var(--color-terracotta-light)',
                  color: 'var(--color-terracotta-dark)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: 'var(--text-xs)',
                }}>
                  AI Generated
                </span>
              )}
            </span>
            <button
              onClick={onViewHistory}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-1)',
                fontSize: 'var(--text-sm)',
                color: 'var(--color-terracotta)',
              }}
            >
              <span className={appStyles.buttonIcon}><Icons.FileText /></span>
              View History ({versionCount})
            </button>
          </div>

          <ModalActions>
            <button className={styles.secondaryButton} onClick={handleClose}>
              {hasChanges ? 'Discard' : 'Close'}
            </button>
            <button
              className={styles.primaryButton}
              onClick={handleSave}
              disabled={!hasChanges || addVersion.isPending}
            >
              {addVersion.isPending ? (
                <>
                  <span className={styles.spinner} />
                  Saving...
                </>
              ) : (
                <>
                  <Icons.Save />
                  Save as New Version
                </>
              )}
            </button>
          </ModalActions>
        </>
      ) : (
        <div className={styles.emptyState}>
          <p>Document not found</p>
        </div>
      )}
    </Modal>
  );
}
