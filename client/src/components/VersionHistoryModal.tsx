import { useState } from 'react';
import { useDocumentVersions } from '../hooks';
import { Modal, ModalActions } from './Modal';
import styles from './GenerateModal.module.css';
import type { DocumentVersion } from '../types';

interface VersionHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentId: number;
  onRestoreVersion: (content: string) => void;
}

export function VersionHistoryModal({
  isOpen,
  onClose,
  documentId,
  onRestoreVersion,
}: VersionHistoryModalProps) {
  const { data: versions, isLoading } = useDocumentVersions(documentId);
  const [expandedVersion, setExpandedVersion] = useState<number | null>(null);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const truncateContent = (content: string, maxLength = 150) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength).trim() + '...';
  };

  const handleRestore = (version: DocumentVersion) => {
    onRestoreVersion(version.content);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Version History"
      size="md"
    >
      {isLoading ? (
        <div className={styles.emptyState}>
          <p>Loading versions...</p>
        </div>
      ) : versions && versions.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {versions.map((version) => (
            <div
              key={version.id}
              style={{
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                overflow: 'hidden',
              }}
            >
              {/* Version header */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: 'var(--space-3) var(--space-4)',
                  background: 'var(--color-bg-subtle)',
                  borderBottom: expandedVersion === version.id ? '1px solid var(--border-subtle)' : 'none',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                  <span style={{
                    fontWeight: 600,
                    fontSize: 'var(--text-sm)',
                    color: 'var(--color-ink)',
                  }}>
                    Version {version.version}
                  </span>
                  <span style={{
                    fontSize: 'var(--text-xs)',
                    color: 'var(--color-ink-muted)',
                  }}>
                    {formatDate(version.created_at)}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                  <button
                    onClick={() => setExpandedVersion(expandedVersion === version.id ? null : version.id)}
                    style={{
                      fontSize: 'var(--text-xs)',
                      color: 'var(--color-ink-muted)',
                      padding: 'var(--space-1) var(--space-2)',
                    }}
                  >
                    {expandedVersion === version.id ? 'Collapse' : 'View'}
                  </button>
                  {version.version > 1 && (
                    <button
                      onClick={() => handleRestore(version)}
                      style={{
                        fontSize: 'var(--text-xs)',
                        color: 'var(--color-terracotta)',
                        padding: 'var(--space-1) var(--space-2)',
                      }}
                    >
                      Restore
                    </button>
                  )}
                </div>
              </div>

              {/* Preview or full content */}
              <div style={{ padding: 'var(--space-3) var(--space-4)' }}>
                {expandedVersion === version.id ? (
                  <>
                    <pre style={{
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      fontSize: 'var(--text-sm)',
                      color: 'var(--color-ink)',
                      lineHeight: 1.6,
                      margin: 0,
                      fontFamily: 'var(--font-sans)',
                    }}>
                      {version.content}
                    </pre>
                    {version.prompt_used && (
                      <div style={{
                        marginTop: 'var(--space-3)',
                        paddingTop: 'var(--space-3)',
                        borderTop: '1px solid var(--border-subtle)',
                      }}>
                        <span style={{
                          fontSize: 'var(--text-xs)',
                          fontWeight: 600,
                          color: 'var(--color-ink-muted)',
                        }}>
                          Prompt used:
                        </span>
                        <p style={{
                          fontSize: 'var(--text-xs)',
                          color: 'var(--color-ink-light)',
                          margin: 'var(--space-1) 0 0 0',
                          fontStyle: 'italic',
                        }}>
                          {version.prompt_used}
                        </p>
                      </div>
                    )}
                  </>
                ) : (
                  <p style={{
                    fontSize: 'var(--text-sm)',
                    color: 'var(--color-ink-light)',
                    margin: 0,
                    lineHeight: 1.5,
                  }}>
                    {truncateContent(version.content)}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className={styles.emptyState}>
          <p>No versions found</p>
        </div>
      )}

      <ModalActions>
        <button className={styles.secondaryButton} onClick={onClose}>
          Close
        </button>
      </ModalActions>
    </Modal>
  );
}
