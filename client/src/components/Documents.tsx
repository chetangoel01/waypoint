import { useState } from 'react';
import { useDocuments, useDeleteDocument, useApplications, useAddDocumentVersion, useAiStatus } from '../hooks';
import { Icons } from './Icons';
import { Modal, ModalActions, modalStyles } from './Modal';
import { DocumentEditorModal } from './DocumentEditorModal';
import { VersionHistoryModal } from './VersionHistoryModal';
import { GenerateModal } from './GenerateModal';
import styles from '../App.module.css';
import type { Document, Application } from '../types';

export function Documents() {
  const { data: documents, isLoading, error } = useDocuments();
  const { data: applications } = useApplications();
  const { data: aiStatus } = useAiStatus();
  const deleteDocument = useDeleteDocument();
  const addVersion = useAddDocumentVersion();

  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<Document | null>(null);

  // Generate new document state
  const [showAppSelector, setShowAppSelector] = useState(false);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [generateMode, setGenerateMode] = useState<'cover-letter' | 'custom-response'>('cover-letter');

  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'cover_letter' | 'custom_question'>('all');
  const [appFilter, setAppFilter] = useState<number | null>(null);

  const handleGenerateNew = () => {
    if (!aiStatus?.configured) {
      // Show settings prompt
      setShowAppSelector(true);
      return;
    }
    if (!applications || applications.length === 0) {
      // No applications available
      setShowAppSelector(true);
      return;
    }
    setShowAppSelector(true);
  };

  const handleSelectAppAndGenerate = (app: Application, mode: 'cover-letter' | 'custom-response') => {
    setSelectedApp(app);
    setGenerateMode(mode);
    setShowAppSelector(false);
    setShowGenerateModal(true);
  };

  const handleCloseGenerateModal = () => {
    setShowGenerateModal(false);
    setSelectedApp(null);
  };

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

  // Filter and sort documents
  const filteredDocuments = (documents ?? [])
    .filter((doc) => {
      // Search filter - search in question and content
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesQuestion = doc.question?.toLowerCase().includes(query);
        const matchesContent = doc.versions?.[0]?.content?.toLowerCase().includes(query);
        const matchesApp = getApplicationName(doc.application_id)?.toLowerCase().includes(query);
        if (!matchesQuestion && !matchesContent && !matchesApp) return false;
      }
      // Type filter
      if (typeFilter !== 'all' && doc.type !== typeFilter) return false;
      // Application filter
      if (appFilter !== null && doc.application_id !== appFilter) return false;
      return true;
    })
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());

  const hasActiveFilters = searchQuery || typeFilter !== 'all' || appFilter !== null;

  // Get unique applications that have documents
  const appsWithDocuments = applications?.filter(app =>
    documents?.some(doc => doc.application_id === app.id)
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
              {documents?.length ?? 0} document{(documents?.length ?? 0) !== 1 ? 's' : ''} saved
            </p>
          </div>
          <button
            className={`${styles.button} ${styles.buttonPrimary}`}
            onClick={handleGenerateNew}
          >
            <span className={styles.buttonIcon}><Icons.Lightbulb /></span>
            Generate New
          </button>
        </header>

        {/* Filters */}
        {(documents?.length ?? 0) > 0 && (
          <div style={{ marginBottom: 'var(--space-6)' }}>
            {/* Search */}
            <div style={{ position: 'relative', marginBottom: 'var(--space-4)' }}>
              <span style={{
                position: 'absolute',
                left: 'var(--space-3)',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--color-ink-muted)',
                pointerEvents: 'none',
                width: 16,
                height: 16,
              }}>
                <Icons.Search />
              </span>
              <input
                type="text"
                placeholder="Search documents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  paddingLeft: 'var(--space-10)',
                }}
              />
            </div>

            {/* Type and App Filters */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)', alignItems: 'center' }}>
              {/* Type Filter */}
              <button
                onClick={() => setTypeFilter('all')}
                style={{
                  padding: 'var(--space-1) var(--space-3)',
                  borderRadius: '9999px',
                  fontSize: 'var(--text-sm)',
                  fontWeight: typeFilter === 'all' ? 600 : 400,
                  backgroundColor: typeFilter === 'all' ? 'var(--color-ink)' : 'var(--color-bg-subtle)',
                  color: typeFilter === 'all' ? 'white' : 'var(--color-ink-muted)',
                  border: '1px solid transparent',
                }}
              >
                All Types
              </button>
              <button
                onClick={() => setTypeFilter(typeFilter === 'cover_letter' ? 'all' : 'cover_letter')}
                style={{
                  padding: 'var(--space-1) var(--space-3)',
                  borderRadius: '9999px',
                  fontSize: 'var(--text-sm)',
                  fontWeight: typeFilter === 'cover_letter' ? 600 : 400,
                  backgroundColor: typeFilter === 'cover_letter' ? 'var(--color-ink)' : 'var(--color-bg-subtle)',
                  color: typeFilter === 'cover_letter' ? 'white' : 'var(--color-ink-muted)',
                  border: '1px solid transparent',
                }}
              >
                Cover Letters
              </button>
              <button
                onClick={() => setTypeFilter(typeFilter === 'custom_question' ? 'all' : 'custom_question')}
                style={{
                  padding: 'var(--space-1) var(--space-3)',
                  borderRadius: '9999px',
                  fontSize: 'var(--text-sm)',
                  fontWeight: typeFilter === 'custom_question' ? 600 : 400,
                  backgroundColor: typeFilter === 'custom_question' ? 'var(--color-ink)' : 'var(--color-bg-subtle)',
                  color: typeFilter === 'custom_question' ? 'white' : 'var(--color-ink-muted)',
                  border: '1px solid transparent',
                }}
              >
                Responses
              </button>

              {/* Application Filter - only show if there are apps with documents */}
              {appsWithDocuments.length > 0 && (
                <>
                  <span style={{ color: 'var(--color-ink-muted)', margin: '0 var(--space-2)' }}>|</span>
                  <select
                    value={appFilter ?? ''}
                    onChange={(e) => setAppFilter(e.target.value ? parseInt(e.target.value, 10) : null)}
                    style={{
                      padding: 'var(--space-1) var(--space-3)',
                      borderRadius: '9999px',
                      fontSize: 'var(--text-sm)',
                      backgroundColor: appFilter ? 'var(--color-ink)' : 'var(--color-bg-subtle)',
                      color: appFilter ? 'white' : 'var(--color-ink-muted)',
                      border: '1px solid transparent',
                      cursor: 'pointer',
                    }}
                  >
                    <option value="">All Applications</option>
                    {appsWithDocuments.map((app) => (
                      <option key={app.id} value={app.id}>
                        {app.company} - {app.role}
                      </option>
                    ))}
                  </select>
                </>
              )}
            </div>
          </div>
        )}

        {filteredDocuments.length > 0 ? (
          <div className={styles.applicationsList}>
            {filteredDocuments.map((doc) => {
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
                  <div
                    className={styles.applicationLogo}
                    style={{
                      width: 36,
                      height: 36,
                      fontSize: 'var(--text-sm)',
                      backgroundColor: doc.type === 'cover_letter' ? 'var(--color-terracotta-light)' : 'var(--color-sky-light)',
                      color: doc.type === 'cover_letter' ? 'var(--color-terracotta-dark)' : 'var(--color-sky)',
                    }}
                  >
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
        ) : hasActiveFilters ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyStateIcon}>
              <Icons.Search />
            </div>
            <h3 className={styles.emptyStateTitle}>No matching documents</h3>
            <p className={styles.emptyStateText}>
              Try adjusting your search or filters
            </p>
            <button
              className={`${styles.button} ${styles.buttonSecondary}`}
              onClick={() => { setSearchQuery(''); setTypeFilter('all'); setAppFilter(null); }}
              style={{ marginTop: 'var(--space-4)' }}
            >
              Clear Filters
            </button>
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
        <p className={modalStyles.confirmMessage}>
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

      {/* Application Selector Modal */}
      <Modal
        isOpen={showAppSelector}
        onClose={() => setShowAppSelector(false)}
        title="Generate New Document"
        size="md"
      >
        {!aiStatus?.configured ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyStateIcon}>
              <Icons.Settings />
            </div>
            <h3 className={styles.emptyStateTitle}>Setup Required</h3>
            <p className={styles.emptyStateText}>
              To generate content with AI, please add your API key in Settings first.
            </p>
            <a
              href="/settings"
              className={`${styles.button} ${styles.buttonPrimary}`}
              style={{ marginTop: 'var(--space-4)', display: 'inline-flex' }}
              onClick={() => setShowAppSelector(false)}
            >
              Go to Settings
            </a>
          </div>
        ) : !applications || applications.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyStateIcon}>
              <Icons.Applications />
            </div>
            <h3 className={styles.emptyStateTitle}>No Applications</h3>
            <p className={styles.emptyStateText}>
              Create an application first to generate documents for it.
            </p>
            <a
              href="/applications"
              className={`${styles.button} ${styles.buttonPrimary}`}
              style={{ marginTop: 'var(--space-4)', display: 'inline-flex' }}
              onClick={() => setShowAppSelector(false)}
            >
              Go to Applications
            </a>
          </div>
        ) : (
          <>
            <p className={styles.formHint} style={{ marginBottom: 'var(--space-4)' }}>
              Select an application to generate a document for:
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', maxHeight: '300px', overflowY: 'auto' }}>
              {applications.map((app) => (
                <div
                  key={app.id}
                  style={{
                    padding: 'var(--space-3)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)' }}>{app.company}</div>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-ink-muted)' }}>{app.role}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                    <button
                      className={`${styles.button} ${styles.buttonSecondary}`}
                      style={{ padding: 'var(--space-1) var(--space-3)', fontSize: 'var(--text-xs)' }}
                      onClick={() => handleSelectAppAndGenerate(app, 'cover-letter')}
                    >
                      Cover Letter
                    </button>
                    <button
                      className={`${styles.button} ${styles.buttonSecondary}`}
                      style={{ padding: 'var(--space-1) var(--space-3)', fontSize: 'var(--text-xs)' }}
                      onClick={() => handleSelectAppAndGenerate(app, 'custom-response')}
                    >
                      Response
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </Modal>

      {/* Generate Modal */}
      {selectedApp && (
        <GenerateModal
          isOpen={showGenerateModal}
          onClose={handleCloseGenerateModal}
          applicationId={selectedApp.id}
          companyName={selectedApp.company}
          roleName={selectedApp.role}
          mode={generateMode}
        />
      )}
    </div>
  );
}
