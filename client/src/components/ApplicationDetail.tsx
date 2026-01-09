import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApplication, useUpdateApplication } from '../hooks';
import { Icons } from './Icons';
import { GenerateModal } from './GenerateModal';
import styles from '../App.module.css';
import type { Contact, ApplicationStatusOption } from '../types';

// Default statuses for new applications
const defaultStatuses: ApplicationStatusOption[] = [
  { key: 'saved', label: 'Saved', color: 'gray' },
  { key: 'applied', label: 'Applied', color: 'blue' },
  { key: 'phone_screen', label: 'Phone Screen', color: 'blue' },
  { key: 'interview', label: 'Interview', color: 'amber' },
  { key: 'offer', label: 'Offer', color: 'green' },
  { key: 'rejected', label: 'Rejected', color: 'red' },
  { key: 'withdrawn', label: 'Withdrawn', color: 'red' },
];

const colorOptions: ApplicationStatusOption['color'][] = ['gray', 'blue', 'amber', 'green', 'red'];

const getStatusClass = (status: string, statuses: ApplicationStatusOption[]) => {
  const found = statuses.find(s => s.key === status);
  const color = found?.color || 'gray';
  const colorMap: Record<string, string> = {
    gray: styles.statusSaved,
    blue: styles.statusApplied,
    amber: styles.statusInterview,
    green: styles.statusOffer,
    red: styles.statusRejected,
  };
  return colorMap[color] || styles.statusSaved;
};

const getStatusLabel = (status: string, statuses: ApplicationStatusOption[]) => {
  const found = statuses.find(s => s.key === status);
  return found?.label || status.replace(/_/g, ' ');
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
  
  // Use app's custom statuses if available, otherwise use defaults
  const statuses = app?.custom_statuses || defaultStatuses;

  // Modal state
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [generateMode, setGenerateMode] = useState<'cover-letter' | 'custom-response'>('cover-letter');
  const [initialQuestion, setInitialQuestion] = useState('');
  
  // Edit mode state
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ company: '', role: '', url: '', job_description: '' });
  
  // Contact modal state
  const [showContactModal, setShowContactModal] = useState(false);
  const [newContact, setNewContact] = useState<Contact>({ name: '', role: '', email: '', linkedin: '' });
  
  // Status dropdown and edit
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showStatusEditor, setShowStatusEditor] = useState(false);
  const [editingStatuses, setEditingStatuses] = useState<ApplicationStatusOption[]>([]);
  const [newStatus, setNewStatus] = useState({ label: '', color: 'gray' as ApplicationStatusOption['color'] });

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

  const contacts = app.contacts ?? [];

  const handleNotesChange = (e: React.FocusEvent<HTMLTextAreaElement>) => {
    const newNotes = e.target.value;
    if (newNotes !== app.notes) {
      updateApplication.mutate({ id: app.id, data: { notes: newNotes } });
    }
  };

  const handleOpenCoverLetter = () => {
    setGenerateMode('cover-letter');
    setInitialQuestion('');
    setShowGenerateModal(true);
  };

  const handleOpenCustomResponse = (question?: string) => {
    setGenerateMode('custom-response');
    setInitialQuestion(question || '');
    setShowGenerateModal(true);
  };

  const handleSaveGenerated = (content: string) => {
    // Save to notes with clear formatting
    const label = generateMode === 'cover-letter' ? 'Cover Letter' : 'Response';
    const timestamp = new Date().toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      hour: 'numeric', 
      minute: '2-digit' 
    });
    const newContent = `\n\n--- Generated ${label} (${timestamp}) ---\n${content}`;
    const updatedNotes = (app.notes || '') + newContent;
    updateApplication.mutate({ id: app.id, data: { notes: updatedNotes } });
  };

  const handleStartEdit = () => {
    setEditForm({
      company: app.company,
      role: app.role,
      url: app.url || '',
      job_description: app.job_description || '',
    });
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    updateApplication.mutate({
      id: app.id,
      data: {
        company: editForm.company.trim(),
        role: editForm.role.trim(),
        url: editForm.url.trim() || null,
        job_description: editForm.job_description.trim() || null,
      },
    });
    setIsEditing(false);
  };

  const handleStatusChange = (newStatus: string) => {
    const updates: { status: string; date_applied?: string } = { status: newStatus };
    if (newStatus === 'applied' && !app.date_applied) {
      updates.date_applied = new Date().toISOString().split('T')[0];
    }
    updateApplication.mutate({ id: app.id, data: updates });
    setShowStatusDropdown(false);
  };

  const handleAddContact = () => {
    if (!newContact.name.trim()) return;
    const updatedContacts = [...contacts, { ...newContact, name: newContact.name.trim() }];
    updateApplication.mutate({ id: app.id, data: { contacts: updatedContacts } });
    setNewContact({ name: '', role: '', email: '', linkedin: '' });
    setShowContactModal(false);
  };

  const handleRemoveContact = (index: number) => {
    const updatedContacts = contacts.filter((_, i) => i !== index);
    updateApplication.mutate({ id: app.id, data: { contacts: updatedContacts } });
  };

  // Status editing handlers
  const handleOpenStatusEditor = () => {
    setEditingStatuses([...statuses]);
    setShowStatusEditor(true);
    setShowStatusDropdown(false);
  };

  const handleSaveStatuses = () => {
    updateApplication.mutate({ 
      id: app.id, 
      data: { custom_statuses: editingStatuses } 
    });
    setShowStatusEditor(false);
  };

  const handleAddStatus = () => {
    if (!newStatus.label.trim()) return;
    const key = newStatus.label.trim().toLowerCase().replace(/\s+/g, '_');
    if (editingStatuses.some(s => s.key === key)) return;
    setEditingStatuses([...editingStatuses, { key, label: newStatus.label.trim(), color: newStatus.color }]);
    setNewStatus({ label: '', color: 'gray' });
  };

  const handleRemoveStatus = (key: string) => {
    setEditingStatuses(editingStatuses.filter(s => s.key !== key));
  };

  const handleUpdateStatusOption = (key: string, field: 'label' | 'color', value: string) => {
    setEditingStatuses(editingStatuses.map(s => 
      s.key === key ? { ...s, [field]: value } : s
    ));
  };

  return (
    <div className={styles.mainInner}>
      <div className={styles.detailView}>
        <button className={styles.backButton} onClick={() => navigate('/applications')}>
          <span className={styles.backIcon}><Icons.ArrowLeft /></span>
          Back to applications
        </button>

        <header className={styles.detailHeader}>
          <div className={styles.detailLogo}>{(isEditing ? editForm.company : app.company).charAt(0)}</div>
          <div className={styles.detailInfo}>
            {isEditing ? (
              <div className={styles.detailInfo}>
                <input
                  type="text"
                  value={editForm.company}
                  onChange={(e) => setEditForm({ ...editForm, company: e.target.value })}
                  placeholder="Company name"
                  autoFocus
                  style={{
                    font: 'inherit',
                    fontSize: 'var(--text-2xl)',
                    fontWeight: 600,
                    color: 'var(--color-ink)',
                    background: 'transparent',
                    border: 'none',
                    borderBottom: '2px solid var(--color-terracotta)',
                    borderRadius: 0,
                    padding: '0 0 2px 0',
                    margin: 0,
                    width: '100%',
                    outline: 'none',
                  }}
                />
                <input
                  type="text"
                  value={editForm.role}
                  onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                  placeholder="Role"
                  style={{
                    font: 'inherit',
                    fontSize: 'var(--text-lg)',
                    color: 'var(--color-ink-muted)',
                    background: 'transparent',
                    border: 'none',
                    borderBottom: '1px solid var(--border-subtle)',
                    borderRadius: 0,
                    padding: '0 0 2px 0',
                    margin: 0,
                    width: '100%',
                    outline: 'none',
                  }}
                />
                <input
                  type="url"
                  value={editForm.url}
                  onChange={(e) => setEditForm({ ...editForm, url: e.target.value })}
                  placeholder="Add job posting URL..."
                  style={{
                    font: 'inherit',
                    fontSize: 'var(--text-sm)',
                    color: 'var(--color-ink-muted)',
                    background: 'transparent',
                    border: 'none',
                    borderBottom: '1px dashed var(--border-subtle)',
                    borderRadius: 0,
                    padding: '2px 0',
                    margin: 0,
                    width: '100%',
                    outline: 'none',
                  }}
                />
              </div>
            ) : (
              <>
                <h1 className={styles.detailCompany}>{app.company}</h1>
                <p className={styles.detailRole}>{app.role}</p>
                <div className={styles.detailMeta}>
                  <div style={{ position: 'relative' }}>
                    <button
                      className={`${styles.statusBadge} ${getStatusClass(app.status, statuses)}`}
                      onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                      style={{ cursor: 'pointer' }}
                    >
                      {getStatusLabel(app.status, statuses)}
                      <span style={{ marginLeft: 4, opacity: 0.7 }}>▾</span>
                    </button>
                    {showStatusDropdown && (
                      <div style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        marginTop: 'var(--space-1)',
                        backgroundColor: 'var(--color-bg)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-lg)',
                        boxShadow: 'var(--shadow-lg)',
                        zIndex: 100,
                        minWidth: 180,
                        overflow: 'hidden',
                      }}>
                        {statuses.map((s) => (
                          <button
                            key={s.key}
                            onClick={() => handleStatusChange(s.key)}
                            style={{
                              display: 'block',
                              width: '100%',
                              padding: 'var(--space-2) var(--space-3)',
                              textAlign: 'left',
                              fontSize: 'var(--text-sm)',
                              backgroundColor: app.status === s.key ? 'var(--color-bg-subtle)' : 'transparent',
                              fontWeight: app.status === s.key ? 500 : 400,
                            }}
                          >
                            {s.label}
                          </button>
                        ))}
                        <div style={{ borderTop: '1px solid var(--border-subtle)', marginTop: 'var(--space-1)' }}>
                          <button
                            onClick={handleOpenStatusEditor}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 'var(--space-2)',
                              width: '100%',
                              padding: 'var(--space-2) var(--space-3)',
                              textAlign: 'left',
                              fontSize: 'var(--text-sm)',
                              color: 'var(--color-ink-muted)',
                            }}
                          >
                            <span style={{ width: 14, height: 14, display: 'flex' }}><Icons.Settings /></span>
                            Edit statuses
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                  {app.url && (
                    <a href={app.url} target="_blank" rel="noopener noreferrer" className={styles.sectionLink}>
                      View posting <span className={styles.navIcon}><Icons.ExternalLink /></span>
                    </a>
                  )}
                </div>
              </>
            )}
          </div>
          <div className={styles.detailActions}>
            {isEditing ? (
              <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                <button 
                  onClick={() => setIsEditing(false)}
                  style={{
                    fontSize: 'var(--text-sm)',
                    color: 'var(--color-ink-muted)',
                    padding: 'var(--space-1) var(--space-2)',
                  }}
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSaveEdit}
                  disabled={!editForm.company.trim() || !editForm.role.trim()}
                  style={{
                    fontSize: 'var(--text-sm)',
                    color: 'var(--color-terracotta)',
                    fontWeight: 500,
                    padding: 'var(--space-1) var(--space-2)',
                  }}
                >
                  Save
                </button>
              </div>
            ) : (
              <>
                <button 
                  className={`${styles.button} ${styles.buttonSecondary}`}
                  onClick={handleStartEdit}
                >
                  <span className={styles.navIcon}><Icons.FileText /></span>
                  Edit
                </button>
                <button 
                  className={`${styles.button} ${styles.buttonPrimary}`}
                  onClick={handleOpenCoverLetter}
                >
                  <span className={styles.navIcon}><Icons.Lightbulb /></span>
                  Generate Cover Letter
                </button>
              </>
            )}
          </div>
        </header>

        <div className={styles.detailGrid}>
          {/* Left column */}
          <div>
            {/* Job Description */}
            <section className={styles.detailSection}>
              <h2 className={styles.detailSectionTitle}>Job Description</h2>
              {isEditing ? (
                <textarea
                  className={styles.notesTextarea}
                  value={editForm.job_description}
                  onChange={(e) => setEditForm({ ...editForm, job_description: e.target.value })}
                  placeholder="Paste the job description here..."
                  rows={8}
                />
              ) : app.job_description ? (
                <p className={styles.jobDescription}>{app.job_description}</p>
              ) : (
                <p className={styles.insightEmpty}>No job description added. Click Edit to add one.</p>
              )}
            </section>

            {/* Custom Questions Section */}
            <section className={styles.detailSection}>
              <h2 className={styles.detailSectionTitle}>Application Questions</h2>
              <p className={styles.formHint} style={{ marginBottom: 'var(--space-4)' }}>
                Generate AI-powered responses to application questions
              </p>
              <button 
                className={styles.addQuestionButton}
                onClick={() => handleOpenCustomResponse()}
              >
                <span className={styles.navIcon}><Icons.Lightbulb /></span>
                Generate Response to Question
              </button>
            </section>

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
                {(() => {
                  // Filter to "positive" statuses for timeline (exclude rejected/withdrawn type statuses)
                  const timelineStatuses = statuses.filter(s => s.color !== 'red');
                  const currentIndex = timelineStatuses.findIndex(s => s.key === app.status);
                  
                  return timelineStatuses.map((step, idx) => {
                    const isCompleted = currentIndex >= 0 && idx < currentIndex;
                    const isActive = idx === currentIndex;

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
                  });
                })()}
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
                          <a href={contact.linkedin.startsWith('http') ? contact.linkedin : `https://${contact.linkedin}`} target="_blank" rel="noopener noreferrer" className={styles.contactLink} title="View LinkedIn">
                            <span className={styles.contactLinkIcon}><Icons.LinkedIn /></span>
                          </a>
                        )}
                        <button 
                          onClick={() => handleRemoveContact(idx)} 
                          className={styles.contactLink} 
                          title="Remove contact"
                          style={{ color: 'var(--color-rose)' }}
                        >
                          <span className={styles.contactLinkIcon}><Icons.Plus style={{ transform: 'rotate(45deg)' }} /></span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className={styles.insightEmpty}>No contacts added yet</p>
              )}
              <button 
                className={styles.addQuestionButton} 
                style={{ marginTop: 'var(--space-3)' }}
                onClick={() => setShowContactModal(true)}
              >
                <span className={styles.navIcon}><Icons.Plus /></span>
                Add contact
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
        initialQuestion={initialQuestion}
        onSave={handleSaveGenerated}
      />

      {/* Add Contact Modal */}
      {showContactModal && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setShowContactModal(false)}
        >
          <div 
            style={{
              backgroundColor: 'var(--color-bg)',
              borderRadius: 'var(--radius-xl)',
              padding: 'var(--space-6)',
              width: '100%',
              maxWidth: '400px',
              boxShadow: 'var(--shadow-xl)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-5)' }}>
              <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 600, color: 'var(--color-ink)' }}>
                Add Contact
              </h2>
              <button 
                onClick={() => setShowContactModal(false)}
                style={{ 
                  width: 32, 
                  height: 32, 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--color-ink-muted)',
                }}
              >
                <span style={{ transform: 'rotate(45deg)', display: 'flex', width: 20, height: 20 }}>
                  <Icons.Plus />
                </span>
              </button>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); handleAddContact(); }}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Name *</label>
                <input
                  type="text"
                  placeholder="Contact name"
                  value={newContact.name}
                  onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                  autoFocus
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Role</label>
                <input
                  type="text"
                  placeholder="e.g., Hiring Manager, Recruiter"
                  value={newContact.role}
                  onChange={(e) => setNewContact({ ...newContact, role: e.target.value })}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Email</label>
                <input
                  type="email"
                  placeholder="email@company.com"
                  value={newContact.email}
                  onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>LinkedIn</label>
                <input
                  type="text"
                  placeholder="linkedin.com/in/username"
                  value={newContact.linkedin}
                  onChange={(e) => setNewContact({ ...newContact, linkedin: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end', marginTop: 'var(--space-5)' }}>
                <button 
                  type="button"
                  className={`${styles.button} ${styles.buttonSecondary}`}
                  onClick={() => setShowContactModal(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className={`${styles.button} ${styles.buttonPrimary}`}
                  disabled={!newContact.name.trim()}
                >
                  Add Contact
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Statuses Modal */}
      {showStatusEditor && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setShowStatusEditor(false)}
        >
          <div 
            style={{
              backgroundColor: 'var(--color-bg)',
              borderRadius: 'var(--radius-xl)',
              padding: 'var(--space-6)',
              width: '100%',
              maxWidth: '500px',
              maxHeight: '80vh',
              overflow: 'auto',
              boxShadow: 'var(--shadow-xl)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-5)' }}>
              <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 600, color: 'var(--color-ink)' }}>
                Edit Statuses
              </h2>
              <button 
                onClick={() => setShowStatusEditor(false)}
                style={{ 
                  width: 32, 
                  height: 32, 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--color-ink-muted)',
                }}
              >
                <span style={{ transform: 'rotate(45deg)', display: 'flex', width: 20, height: 20 }}>
                  <Icons.Plus />
                </span>
              </button>
            </div>

            <p className={styles.formHint} style={{ marginBottom: 'var(--space-4)' }}>
              Customize the status options for this application's pipeline
            </p>

            {/* Existing statuses */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
              {editingStatuses.map((status) => (
                <div key={status.key} style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
                  <input
                    type="text"
                    value={status.label}
                    onChange={(e) => handleUpdateStatusOption(status.key, 'label', e.target.value)}
                    style={{ flex: 1 }}
                  />
                  <select
                    value={status.color}
                    onChange={(e) => handleUpdateStatusOption(status.key, 'color', e.target.value)}
                    style={{ width: 100 }}
                  >
                    {colorOptions.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => handleRemoveStatus(status.key)}
                    style={{ color: 'var(--color-rose)', padding: 'var(--space-1)' }}
                    title="Remove"
                  >
                    <span style={{ width: 16, height: 16, display: 'flex', transform: 'rotate(45deg)' }}>
                      <Icons.Plus />
                    </span>
                  </button>
                </div>
              ))}
            </div>

            {/* Add new status */}
            <div style={{ 
              display: 'flex', 
              gap: 'var(--space-2)', 
              alignItems: 'center', 
              paddingTop: 'var(--space-3)', 
              borderTop: '1px solid var(--border-subtle)',
              marginBottom: 'var(--space-4)'
            }}>
              <input
                type="text"
                placeholder="New status label"
                value={newStatus.label}
                onChange={(e) => setNewStatus({ ...newStatus, label: e.target.value })}
                onKeyDown={(e) => e.key === 'Enter' && handleAddStatus()}
                style={{ flex: 1 }}
              />
              <select
                value={newStatus.color}
                onChange={(e) => setNewStatus({ ...newStatus, color: e.target.value as ApplicationStatusOption['color'] })}
                style={{ width: 100 }}
              >
                {colorOptions.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <button
                className={`${styles.button} ${styles.buttonSecondary}`}
                onClick={handleAddStatus}
                disabled={!newStatus.label.trim()}
                style={{ padding: 'var(--space-1) var(--space-3)' }}
              >
                Add
              </button>
            </div>

            <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end' }}>
              <button 
                className={`${styles.button} ${styles.buttonSecondary}`}
                onClick={() => setShowStatusEditor(false)}
              >
                Cancel
              </button>
              <button 
                className={`${styles.button} ${styles.buttonPrimary}`}
                onClick={handleSaveStatuses}
              >
                Save Statuses
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
