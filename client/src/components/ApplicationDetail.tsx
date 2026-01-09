import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApplication, useUpdateApplication } from '../hooks';
import { Icons } from './Icons';
import { GenerateModal } from './GenerateModal';
import styles from '../App.module.css';
import type { ApplicationStatus } from '../types';

const statusSteps: { key: ApplicationStatus; label: string }[] = [
  { key: 'saved', label: 'Saved' },
  { key: 'applied', label: 'Applied' },
  { key: 'phone_screen', label: 'Phone Screen' },
  { key: 'interview', label: 'Interview' },
  { key: 'offer', label: 'Offer' },
];

const getStatusIndex = (status: ApplicationStatus) => {
  if (status === 'rejected' || status === 'withdrawn') return -1;
  const idx = statusSteps.findIndex(s => s.key === status);
  return idx >= 0 ? idx : 0;
};

const getStatusClass = (status: ApplicationStatus) => {
  const map: Record<ApplicationStatus, string> = {
    saved: styles.statusSaved,
    applied: styles.statusApplied,
    phone_screen: styles.statusApplied,
    interview: styles.statusInterview,
    offer: styles.statusOffer,
    rejected: styles.statusRejected,
    withdrawn: styles.statusRejected,
  };
  return map[status] || styles.statusSaved;
};

const formatDate = (dateString: string | null): string | null => {
  if (!dateString) return null;
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

export function ApplicationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const applicationId = id ? parseInt(id, 10) : 0;
  
  const { data: app, isLoading, error } = useApplication(applicationId);
  const updateApplication = useUpdateApplication();

  // Modal state
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [generateMode, setGenerateMode] = useState<'cover-letter' | 'custom-response'>('cover-letter');

  if (isLoading) {
    return (
      <div className={styles.mainInner}>
        <div className={styles.detailView}>
          <button className={styles.backButton} onClick={() => navigate('/applications')}>
            <span className={styles.backIcon}><Icons.ArrowLeft /></span>
            Back to applications
          </button>
          <div className={styles.emptyState}>
            <p>Loading application details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !app) {
    return (
      <div className={styles.mainInner}>
        <div className={styles.detailView}>
          <button className={styles.backButton} onClick={() => navigate('/applications')}>
            <span className={styles.backIcon}><Icons.ArrowLeft /></span>
            Back to applications
          </button>
          <div className={styles.emptyState}>
            <div className={styles.emptyStateIcon}>
              <Icons.AlertCircle />
            </div>
            <h3 className={styles.emptyStateTitle}>Application not found</h3>
            <p className={styles.emptyStateText}>
              {error instanceof Error ? error.message : 'This application may have been deleted'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const currentStatusIndex = getStatusIndex(app.status);
  const contacts = app.contacts ?? [];

  const handleNotesChange = (e: React.FocusEvent<HTMLTextAreaElement>) => {
    const newNotes = e.target.value;
    if (newNotes !== app.notes) {
      updateApplication.mutate({ id: app.id, data: { notes: newNotes } });
    }
  };

  const handleOpenCoverLetter = () => {
    setGenerateMode('cover-letter');
    setShowGenerateModal(true);
  };

  const handleSaveGenerated = (content: string) => {
    // For now, save to notes. Later this could create a document.
    const updatedNotes = app.notes 
      ? `${app.notes}\n\n--- Generated ${generateMode === 'cover-letter' ? 'Cover Letter' : 'Response'} ---\n${content}`
      : `--- Generated ${generateMode === 'cover-letter' ? 'Cover Letter' : 'Response'} ---\n${content}`;
    updateApplication.mutate({ id: app.id, data: { notes: updatedNotes } });
  };

  return (
    <div className={styles.mainInner}>
      <div className={styles.detailView}>
        <button className={styles.backButton} onClick={() => navigate('/applications')}>
          <span className={styles.backIcon}><Icons.ArrowLeft /></span>
          Back to applications
        </button>

        <header className={styles.detailHeader}>
          <div className={styles.detailLogo}>{app.company.charAt(0)}</div>
          <div className={styles.detailInfo}>
            <h1 className={styles.detailCompany}>{app.company}</h1>
            <p className={styles.detailRole}>{app.role}</p>
            <div className={styles.detailMeta}>
              <span className={`${styles.statusBadge} ${getStatusClass(app.status)}`}>
                {app.status.replace('_', ' ')}
              </span>
              {app.url && (
                <a href={app.url} target="_blank" rel="noopener noreferrer" className={styles.sectionLink}>
                  View posting <Icons.ExternalLink />
                </a>
              )}
            </div>
          </div>
          <div className={styles.detailActions}>
            <button 
              className={`${styles.button} ${styles.buttonPrimary}`}
              onClick={handleOpenCoverLetter}
            >
              <Icons.Lightbulb />
              Generate Cover Letter
            </button>
          </div>
        </header>

        <div className={styles.detailGrid}>
          {/* Left column */}
          <div>
            {/* Job Description */}
            {app.job_description && (
              <section className={styles.detailSection}>
                <h2 className={styles.detailSectionTitle}>Job Description</h2>
                <p className={styles.jobDescription}>{app.job_description}</p>
              </section>
            )}

            {/* Notes */}
            <section className={styles.detailSection}>
              <h2 className={styles.detailSectionTitle}>Notes</h2>
              <textarea
                className={styles.notesTextarea}
                placeholder="Add notes about this application..."
                defaultValue={app.notes ?? ''}
                onBlur={handleNotesChange}
              />
            </section>
          </div>

          {/* Right column */}
          <div>
            {/* Status Timeline */}
            <section className={styles.detailSection}>
              <h2 className={styles.detailSectionTitle}>Status</h2>
              <div className={styles.statusTimeline}>
                {statusSteps.map((step, idx) => {
                  const isCompleted = idx < currentStatusIndex;
                  const isActive = idx === currentStatusIndex;

                  return (
                    <div key={step.key} className={styles.timelineItem}>
                      <div className={`${styles.timelineDot} ${isCompleted ? styles.completed : ''} ${isActive ? styles.active : ''}`}>
                        {isCompleted && <span className={styles.timelineCheck}><Icons.Check /></span>}
                      </div>
                      <div className={styles.timelineContent}>
                        <p className={styles.timelineLabel}>{step.label}</p>
                        {step.key === 'saved' && app.date_saved && (
                          <p className={styles.timelineDate}>{formatDate(app.date_saved)}</p>
                        )}
                        {step.key === 'applied' && app.date_applied && (
                          <p className={styles.timelineDate}>{formatDate(app.date_applied)}</p>
                        )}
                        {isActive && step.key !== 'saved' && step.key !== 'applied' && (
                          <p className={styles.timelineDate}>Current</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Contacts */}
            <section className={styles.detailSection}>
              <h2 className={styles.detailSectionTitle}>Contacts</h2>
              {contacts.length > 0 ? (
                <div className={styles.contactsList}>
                  {contacts.map((contact, idx) => (
                    <div key={idx} className={styles.contactCard}>
                      <div className={styles.contactAvatar}>
                        {contact.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div className={styles.contactInfo}>
                        <p className={styles.contactName}>{contact.name}</p>
                        {contact.role && <p className={styles.contactRole}>{contact.role}</p>}
                      </div>
                      <div className={styles.contactLinks}>
                        {contact.email && (
                          <a href={`mailto:${contact.email}`} className={styles.contactLink} title="Send email">
                            <span className={styles.contactLinkIcon}><Icons.Mail /></span>
                          </a>
                        )}
                        {contact.linkedin && (
                          <a href={`https://${contact.linkedin}`} target="_blank" rel="noopener noreferrer" className={styles.contactLink} title="View LinkedIn">
                            <span className={styles.contactLinkIcon}><Icons.LinkedIn /></span>
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className={styles.insightEmpty}>No contacts added yet</p>
              )}
              <button className={styles.addQuestionButton} style={{ marginTop: '0.75rem' }}>
                <Icons.Plus /> Add contact
              </button>
            </section>
          </div>
        </div>
      </div>

      {/* Generate Modal */}
      <GenerateModal
        isOpen={showGenerateModal}
        onClose={() => setShowGenerateModal(false)}
        applicationId={applicationId}
        companyName={app.company}
        roleName={app.role}
        mode={generateMode}
        onSave={handleSaveGenerated}
      />
    </div>
  );
}
