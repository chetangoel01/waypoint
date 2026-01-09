import { useState } from 'react';
import { useDocuments, useDeleteDocument, useApplications, useAddDocumentVersion } from '../hooks';
import { Icons } from './Icons';
import { Modal, ModalActions } from './Modal';
import { DocumentEditorModal } from './DocumentEditorModal';
import { VersionHistoryModal } from './VersionHistoryModal';
import styles from '../App.module.css';
import type { Document } from '../types';

export function Documents() {
  const { data: documents, isLoading, error } = useDocuments();
  const { data: applications } = useApplications();
  const deleteDocument = useDeleteDocument();
  const addVersion = useAddDocumentVersion();

  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<Document | null>(null);

  // Get application name for a document
  const getApplicationName = (applicationId: number | null) => {
    if (!applicationId || !applications) return null;
    const app = applications.find(a => a.id === applicationId);
    return app ? `${app.company} - ${app.role}` : null;
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Truncate content for preview
  const truncateContent = (content: string, maxLength = 120) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength).trim() + '...';
  };

  const handleOpenEditor = (doc: Document) => {
    setSelectedDocument(doc);
    setShowEditor(true);
  };

  const handleCloseEditor = () => {
    setShowEditor(false);
    setSelectedDocument(null);
  };

  const handleViewHistory = () => {
    setShowEditor(false);
    setShowVersionHistory(true);
  };

  const handleCloseHistory = () => {
    setShowVersionHistory(false);
    setShowEditor(true);
  };

  const handleRestoreVersion = async (content: string) => {
    if (!selectedDocument) return;
    // Add a new version with the restored content
    try {
      await addVersion.mutateAsync({
        documentId: selectedDocument.id,
        data: {
          content,
          is_ai_generated: false,
          prompt_used: 'Restored from previous version',
        },
      });
    } catch {
      // Error handled by mutation
    }
  };

  const handleDeleteDocument = async () => {
    if (!deleteConfirm) return;
    try {
      await deleteDocument.mutateAsync(deleteConfirm.id);
      setDeleteConfirm(null);
    } catch {
      // Error handled by mutation
    }
  };

  // Sort documents by updated_at descending
  const sortedDocuments = documents?.slice().sort(
    (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
  ) ?? [];

  if (isLoading) {
    return (
      <div className={styles.mainInner}>
        <div className={styles.page}>
          <header className={styles.pageHeader}>
            <div className={styles.pageHeaderInfo}>
              <h1 className={styles.pageTitle}>Documents</h1>
              <p className={styles.pageSubtitle}>Loading your documents...</p>
            </div>
          </header>
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
              <h1 className={styles.pageTitle}>Documents</h1>
              <p className={styles.pageSubtitle}>Unable to load documents</p>
            </div>
          </header>
          <div className={styles.emptyState}>
            <div className={styles.emptyStateIcon}>
              <Icons.AlertCircle />
            </div>
            <h3 className={styles.emptyStateTitle}>Error Loading Documents</h3>
            <p className={styles.emptyStateText}>
              {error instanceof Error ? error.message : 'Failed to load documents'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.mainInner}>
      <div className={styles.page}>
        <header className={styles.pageHeader}>
          <div className={styles.pageHeaderInfo}>
            <h1 className={styles.pageTitle}>Documents</h1>
            <p className={styles.pageSubtitle}>
              {sortedDocuments.length} document{sortedDocuments.length !== 1 ? 's' : ''} saved
            </p>
          </div>
        </header>

        {sortedDocuments.length > 0 ? (
          <div className={styles.applicationsList}>
            {sortedDocuments.map((doc) => {
              const appName = getApplicationName(doc.application_id);
              const typeBadgeStyle = doc.type === 'cover_letter'
                ? { backgroundColor: 'var(--color-terracotta-light)', color: 'var(--color-terracotta-dark)' }
                : { backgroundColor: 'var(--color-sky-light)', color: 'var(--color-sky)' };

              return (
                <div
                  key={doc.id}
                  className={styles.applicationCard}
                  onClick={() => handleOpenEditor(doc)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className={styles.applicationLogo}>
                    {doc.type === 'cover_letter' ? (
                      <Icons.FileText />
                    ) : (
                      <Icons.Lightbulb />
                    )}
                  </div>
                  <div className={styles.applicationInfo}>
                    <div className={styles.applicationCompany}>
                      {doc.type === 'cover_letter' ? 'Cover Letter' : 'Response'}
                      {doc.question && (
                        <span style={{
                          fontWeight: 400,
                          color: 'var(--color-ink-light)',
                          marginLeft: 'var(--space-2)',
                        }}>
                          - {truncateContent(doc.question, 40)}
                        </span>
                      )}
                    </div>
                    <div className={styles.applicationRole}>
                      {appName || 'No application linked'}
                    </div>
                    <div className={styles.applicationMeta}>
                      <span
                        className={styles.statusBadge}
                        style={typeBadgeStyle}
                      >
                        {doc.type === 'cover_letter' ? 'Cover Letter' : 'Custom Response'}
                      </span>
                      <span className={styles.applicationDate}>
                        Updated {formatDate(doc.updated_at)}
                      </span>
                    </div>
                  </div>
                  <div className={styles.applicationActions} onClick={(e) => e.stopPropagation()}>
                    <button
                      className={styles.applicationActionBtn}
                      onClick={() => handleOpenEditor(doc)}
                      title="Edit"
                    >
                      <span className={styles.buttonIcon}><Icons.Edit /></span>
                    </button>
                    <button
                      className={`${styles.applicationActionBtn} ${styles.applicationActionBtnDanger}`}
                      onClick={() => setDeleteConfirm(doc)}
                      title="Delete"
                    >
                      <span className={styles.buttonIcon}><Icons.Trash /></span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className={styles.emptyState}>
            <div className={styles.emptyStateIcon}>
              <Icons.Documents />
            </div>
            <h3 className={styles.emptyStateTitle}>No documents yet</h3>
            <p className={styles.emptyStateText}>
              When you generate cover letters or custom responses from an application, they'll appear here.
            </p>
            <p className={styles.emptyStateHint}>
              Tip: Go to an application and click "Generate Cover Letter" or "Generate Response to Question"
            </p>
          </div>
        )}
      </div>

      {/* Document Editor Modal */}
      {selectedDocument && (
        <DocumentEditorModal
          isOpen={showEditor}
          onClose={handleCloseEditor}
          documentId={selectedDocument.id}
          applicationName={getApplicationName(selectedDocument.application_id) ?? undefined}
          onViewHistory={handleViewHistory}
        />
      )}

      {/* Version History Modal */}
      {selectedDocument && (
        <VersionHistoryModal
          isOpen={showVersionHistory}
          onClose={handleCloseHistory}
          documentId={selectedDocument.id}
          onRestoreVersion={handleRestoreVersion}
        />
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Delete Document?"
        size="sm"
      >
        <p className={styles.formHint}>
          Are you sure you want to delete this {deleteConfirm?.type === 'cover_letter' ? 'cover letter' : 'response'}? This action cannot be undone.
        </p>
        <ModalActions>
          <button
            className={`${styles.button} ${styles.buttonSecondary}`}
            onClick={() => setDeleteConfirm(null)}
          >
            Cancel
          </button>
          <button
            className={`${styles.button} ${styles.buttonDanger}`}
            onClick={handleDeleteDocument}
            disabled={deleteDocument.isPending}
          >
            {deleteDocument.isPending ? 'Deleting...' : 'Delete'}
          </button>
        </ModalActions>
      </Modal>
    </div>
  );
}
