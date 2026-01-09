import { useState } from 'react';
import { Routes, Route, NavLink, Link, useNavigate, useParams } from 'react-router-dom';
import styles from './App.module.css';

// Simple SVG icons as components
const Icons = {
  Dashboard: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="9" rx="1" />
      <rect x="14" y="3" width="7" height="5" rx="1" />
      <rect x="14" y="12" width="7" height="9" rx="1" />
      <rect x="3" y="16" width="7" height="5" rx="1" />
    </svg>
  ),
  Applications: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <rect x="8" y="2" width="8" height="4" rx="1" />
      <path d="M9 12h6" />
      <path d="M9 16h6" />
    </svg>
  ),
  Profile: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" />
      <path d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" />
    </svg>
  ),
  Documents: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  ),
  Settings: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  ),
  ArrowLeft: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 12H5M12 19l-7-7 7-7" />
    </svg>
  ),
  Check: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  Mail: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  ),
  LinkedIn: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect x="2" y="9" width="4" height="12" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  ),
  Plus: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  ),
  Upload: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  ),
  FileText: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  ),
  Lightbulb: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18h6M10 22h4M12 2v1M4.22 4.22l.71.71M1 12h1M4.22 19.78l.71-.71M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10z" />
    </svg>
  ),
  ExternalLink: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  ),
};

// Helper to get greeting based on time
function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

// Mock data for applications
const mockApplications = [
  {
    id: '1',
    company: 'Stripe',
    role: 'Senior Frontend Engineer',
    status: 'interview',
    dateSaved: 'Jan 2, 2026',
    dateApplied: 'Jan 5, 2026',
    url: 'https://stripe.com/jobs/123',
    contacts: [
      { name: 'Sarah Chen', role: 'Technical Recruiter', email: 'sarah@stripe.com', linkedin: 'linkedin.com/in/sarahchen' },
      { name: 'Mike Johnson', role: 'Engineering Manager', linkedin: 'linkedin.com/in/mikej' },
    ],
    questions: [
      { question: 'Why do you want to work at Stripe?', answer: 'I am passionate about building financial infrastructure that powers the internet economy...' },
      { question: 'Describe a challenging technical project you led.', answer: null },
    ],
    notes: 'Phone screen went well. Technical interview scheduled for next week.',
    jobDescription: 'We are looking for a Senior Frontend Engineer to join our Dashboard team. You will be responsible for building and maintaining the merchant-facing dashboard that powers millions of businesses worldwide.\n\nResponsibilities:\n- Build new features for the Stripe Dashboard\n- Improve performance and reliability\n- Collaborate with designers and product managers\n- Mentor junior engineers',
  },
  {
    id: '2',
    company: 'Notion',
    role: 'Product Designer',
    status: 'applied',
    dateSaved: 'Jan 3, 2026',
    dateApplied: 'Jan 7, 2026',
    url: 'https://notion.so/careers',
    contacts: [],
    questions: [],
    notes: '',
    jobDescription: 'Join Notion as a Product Designer and help shape the future of productivity tools.',
  },
  {
    id: '3',
    company: 'Linear',
    role: 'Software Engineer',
    status: 'applied',
    dateSaved: 'Jan 4, 2026',
    dateApplied: 'Jan 5, 2026',
    url: null,
    contacts: [
      { name: 'Lisa Park', role: 'Recruiter', email: 'lisa@linear.app' },
    ],
    questions: [
      { question: 'What interests you about Linear?', answer: null },
    ],
    notes: '',
    jobDescription: 'Build the future of issue tracking and project management.',
  },
  {
    id: '4',
    company: 'Vercel',
    role: 'Developer Advocate',
    status: 'saved',
    dateSaved: 'Jan 4, 2026',
    dateApplied: null,
    url: 'https://vercel.com/careers',
    contacts: [],
    questions: [],
    notes: 'Interesting role. Need to update resume before applying.',
    jobDescription: 'Help developers build a faster web.',
  },
  {
    id: '5',
    company: 'Figma',
    role: 'Design Engineer',
    status: 'rejected',
    dateSaved: 'Dec 15, 2025',
    dateApplied: 'Dec 20, 2025',
    url: null,
    contacts: [],
    questions: [],
    notes: 'Rejected after technical interview. Feedback: need more experience with WebGL.',
    jobDescription: 'Bridge the gap between design and engineering at Figma.',
  },
];

function Dashboard() {
  return (
    <div className={styles.mainInner}>
      <div className={styles.page}>
        <header className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>{getGreeting()}</h1>
          <p className={styles.pageSubtitle}>Here's where you stand in your job search</p>
        </header>

        {/* Stats */}
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Active Applications</div>
            <div className={styles.statValue}>12</div>
            <div className={styles.statMeta}>3 awaiting response</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Interviews</div>
            <div className={styles.statValue}>4</div>
            <div className={styles.statMeta}>2 scheduled this week</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Response Rate</div>
            <div className={styles.statValue}>33%</div>
            <div className={styles.statMeta}>Above average</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Documents</div>
            <div className={styles.statValue}>8</div>
            <div className={styles.statMeta}>Cover letters generated</div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Recent Activity</h2>
          <Link to="/applications" className={styles.sectionLink}>View all</Link>
        </div>
        <div className={styles.activityList}>
          <div className={styles.activityItem}>
            <div className={styles.activityDot} style={{ backgroundColor: 'var(--color-sage)' }} />
            <div className={styles.activityContent}>
              <p className={styles.activityTitle}>Interview scheduled with Stripe</p>
              <p className={styles.activityMeta}>Senior Frontend Engineer · Tomorrow at 2:00 PM</p>
            </div>
          </div>
          <div className={styles.activityItem}>
            <div className={styles.activityDot} style={{ backgroundColor: 'var(--color-terracotta)' }} />
            <div className={styles.activityContent}>
              <p className={styles.activityTitle}>Applied to Notion</p>
              <p className={styles.activityMeta}>Product Designer · 2 days ago</p>
            </div>
          </div>
          <div className={styles.activityItem}>
            <div className={styles.activityDot} style={{ backgroundColor: 'var(--color-amber)' }} />
            <div className={styles.activityContent}>
              <p className={styles.activityTitle}>Cover letter generated for Linear</p>
              <p className={styles.activityMeta}>Software Engineer · 3 days ago</p>
            </div>
          </div>
          <div className={styles.activityItem}>
            <div className={styles.activityDot} />
            <div className={styles.activityContent}>
              <p className={styles.activityTitle}>Saved position at Vercel</p>
              <p className={styles.activityMeta}>Developer Advocate · 4 days ago</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ApplicationsList() {
  const navigate = useNavigate();

  const getStatusClass = (status: string) => {
    const map: Record<string, string> = {
      saved: styles.statusSaved,
      applied: styles.statusApplied,
      interview: styles.statusInterview,
      offer: styles.statusOffer,
      rejected: styles.statusRejected,
    };
    return map[status] || styles.statusSaved;
  };

  return (
    <div className={styles.mainInner}>
      <div className={styles.page}>
        <header className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>Applications</h1>
          <p className={styles.pageSubtitle}>Track and manage your job applications</p>
        </header>

        <div className={styles.applicationsList}>
          {mockApplications.map((app) => (
            <div
              key={app.id}
              className={styles.applicationCard}
              onClick={() => navigate(`/applications/${app.id}`)}
            >
              <div className={styles.applicationLogo}>
                {app.company.charAt(0)}
              </div>
              <div className={styles.applicationInfo}>
                <h3 className={styles.applicationCompany}>{app.company}</h3>
                <p className={styles.applicationRole}>{app.role}</p>
                <div className={styles.applicationMeta}>
                  <span className={`${styles.statusBadge} ${getStatusClass(app.status)}`}>
                    {app.status}
                  </span>
                  <span className={styles.dateBadge}>{app.dateApplied || app.dateSaved}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ApplicationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const app = mockApplications.find(a => a.id === id);

  if (!app) {
    return (
      <div className={styles.mainInner}>
        <div className={styles.page}>
          <p>Application not found</p>
          <button onClick={() => navigate('/applications')}>Go back</button>
        </div>
      </div>
    );
  }

  const statusSteps = [
    { key: 'saved', label: 'Saved', date: app.dateSaved },
    { key: 'applied', label: 'Applied', date: app.dateApplied },
    { key: 'phone_screen', label: 'Phone Screen', date: null },
    { key: 'interview', label: 'Interview', date: app.status === 'interview' ? 'Scheduled' : null },
    { key: 'offer', label: 'Offer', date: null },
  ];

  const getStatusIndex = (status: string) => {
    if (status === 'rejected' || status === 'withdrawn') return -1;
    const idx = statusSteps.findIndex(s => s.key === status);
    return idx >= 0 ? idx : 0;
  };

  const currentStatusIndex = getStatusIndex(app.status);

  const getStatusClass = (status: string) => {
    const map: Record<string, string> = {
      saved: styles.statusSaved,
      applied: styles.statusApplied,
      interview: styles.statusInterview,
      offer: styles.statusOffer,
      rejected: styles.statusRejected,
    };
    return map[status] || styles.statusSaved;
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
                {app.status}
              </span>
              {app.url && (
                <a href={app.url} target="_blank" rel="noopener noreferrer" className={styles.sectionLink}>
                  View posting <Icons.ExternalLink />
                </a>
              )}
            </div>
          </div>
          <div className={styles.detailActions}>
            <button className={`${styles.button} ${styles.buttonPrimary}`}>
              Generate Cover Letter
            </button>
          </div>
        </header>

        <div className={styles.detailGrid}>
          {/* Left column */}
          <div>
            {/* Job Description */}
            {app.jobDescription && (
              <section className={styles.detailSection}>
                <h2 className={styles.detailSectionTitle}>Job Description</h2>
                <p className={styles.jobDescription}>{app.jobDescription}</p>
              </section>
            )}

            {/* Custom Questions */}
            <section className={styles.detailSection}>
              <h2 className={styles.detailSectionTitle}>Custom Questions</h2>
              {app.questions.length > 0 ? (
                <div className={styles.questionsList}>
                  {app.questions.map((q, idx) => (
                    <div key={idx} className={styles.questionItem}>
                      <p className={styles.questionText}>{q.question}</p>
                      {q.answer ? (
                        <p className={styles.questionAnswer}>{q.answer}</p>
                      ) : (
                        <p className={styles.questionPending}>Response not yet generated</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : null}
              <button className={styles.addQuestionButton}>
                <Icons.Plus /> Add a question
              </button>
            </section>

            {/* Notes */}
            <section className={styles.detailSection}>
              <h2 className={styles.detailSectionTitle}>Notes</h2>
              <textarea
                className={styles.notesTextarea}
                placeholder="Add notes about this application..."
                defaultValue={app.notes}
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
                        {step.date && <p className={styles.timelineDate}>{step.date}</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Contacts */}
            <section className={styles.detailSection}>
              <h2 className={styles.detailSectionTitle}>Contacts</h2>
              {app.contacts.length > 0 ? (
                <div className={styles.contactsList}>
                  {app.contacts.map((contact, idx) => (
                    <div key={idx} className={styles.contactCard}>
                      <div className={styles.contactAvatar}>
                        {contact.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div className={styles.contactInfo}>
                        <p className={styles.contactName}>{contact.name}</p>
                        <p className={styles.contactRole}>{contact.role}</p>
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
    </div>
  );
}

function Profile() {
  const [hasResume, setHasResume] = useState(false);

  return (
    <div className={styles.mainInner}>
      <div className={styles.page}>
        <header className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>Your Profile</h1>
          <p className={styles.pageSubtitle}>The foundation for all your AI-generated content</p>
        </header>

        {/* Resume Upload */}
        <section className={styles.profileSection}>
          <h2 className={styles.profileSectionTitle}>Resume</h2>
          {!hasResume ? (
            <div className={styles.uploadArea} onClick={() => setHasResume(true)}>
              <div className={styles.uploadIcon}><Icons.Upload /></div>
              <p className={styles.uploadText}>Drop your resume here or click to upload</p>
              <p className={styles.uploadHint}>PDF or DOCX, max 5MB</p>
            </div>
          ) : (
            <div className={styles.uploadedFile}>
              <div className={styles.fileIcon}><Icons.FileText /></div>
              <div className={styles.fileInfo}>
                <p className={styles.fileName}>resume_2026.pdf</p>
                <p className={styles.fileDate}>Uploaded Jan 5, 2026</p>
              </div>
              <button className={`${styles.button} ${styles.buttonSecondary}`}>Replace</button>
            </div>
          )}
        </section>

        {/* Personal Information */}
        <section className={styles.profileSection}>
          <h2 className={styles.profileSectionTitle}>Personal Information</h2>
          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Full Name</label>
              <input type="text" placeholder="Your name" />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Email</label>
              <input type="email" placeholder="your@email.com" />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Phone</label>
              <input type="tel" placeholder="+1 (555) 000-0000" />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Location</label>
              <input type="text" placeholder="City, State" />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>LinkedIn</label>
              <input type="url" placeholder="linkedin.com/in/..." />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>GitHub</label>
              <input type="url" placeholder="github.com/..." />
            </div>
          </div>
        </section>

        {/* Career Goals */}
        <section className={styles.profileSection}>
          <h2 className={styles.profileSectionTitle}>Career Goals</h2>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>What are you looking for?</label>
            <p className={styles.formHint}>Describe your ideal role, company culture, and what matters most to you</p>
            <textarea
              rows={4}
              placeholder="I'm seeking a senior engineering role at a product-focused company where I can..."
              style={{ width: '100%', resize: 'vertical' }}
            />
          </div>
        </section>

        {/* AI Learning Insights */}
        <section className={styles.profileSection}>
          <h2 className={styles.profileSectionTitle}>AI Learning Insights</h2>
          <p className={styles.formHint} style={{ marginBottom: '1rem' }}>
            Patterns learned from your edits to AI-generated content
          </p>
          <div className={styles.insightsList}>
            <div className={styles.insightCard}>
              <div className={styles.insightIcon}><Icons.Lightbulb /></div>
              <div className={styles.insightContent}>
                <p className={styles.insightTitle}>Prefers concise introductions</p>
                <p className={styles.insightText}>You often remove generic opening lines and get straight to the point.</p>
              </div>
            </div>
            <div className={styles.insightCard}>
              <div className={styles.insightIcon}><Icons.Lightbulb /></div>
              <div className={styles.insightContent}>
                <p className={styles.insightTitle}>Adds specific metrics</p>
                <p className={styles.insightText}>You frequently add quantified achievements like percentages and numbers.</p>
              </div>
            </div>
            <div className={styles.insightCard}>
              <div className={styles.insightIcon}><Icons.Lightbulb /></div>
              <div className={styles.insightContent}>
                <p className={styles.insightTitle}>Technical depth preferred</p>
                <p className={styles.insightText}>You tend to expand on technical details and specific technologies used.</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function Documents() {
  return (
    <div className={styles.mainInner}>
      <div className={styles.page}>
        <header className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>Documents</h1>
          <p className={styles.pageSubtitle}>Cover letters and responses you've generated</p>
        </header>

        <div className={styles.emptyState}>
          <div className={styles.emptyStateIcon}>
            <Icons.Documents />
          </div>
          <h3 className={styles.emptyStateTitle}>No documents yet</h3>
          <p className={styles.emptyStateText}>
            When you generate cover letters or custom responses, they'll appear here
          </p>
        </div>
      </div>
    </div>
  );
}

function Settings() {
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

export default function App() {
  return (
    <div className={styles.container}>
      <aside className={styles.sidebar}>
        <div className={styles.logo}>
          <h1 className={styles.logoText}>Waypoint</h1>
          <p className={styles.logoSubtext}>Job Tracker</p>
        </div>

        <nav className={styles.nav}>
          <span className={styles.navSection}>Overview</span>
          <NavLink
            to="/"
            className={({ isActive }) =>
              `${styles.navLink} ${isActive ? styles.active : ''}`
            }
            end
          >
            <span className={styles.navIcon}><Icons.Dashboard /></span>
            Dashboard
          </NavLink>

          <span className={styles.navSection} style={{ marginTop: '1rem' }}>Manage</span>
          <NavLink
            to="/applications"
            className={({ isActive }) =>
              `${styles.navLink} ${isActive ? styles.active : ''}`
            }
          >
            <span className={styles.navIcon}><Icons.Applications /></span>
            Applications
          </NavLink>
          <NavLink
            to="/profile"
            className={({ isActive }) =>
              `${styles.navLink} ${isActive ? styles.active : ''}`
            }
          >
            <span className={styles.navIcon}><Icons.Profile /></span>
            Profile
          </NavLink>
          <NavLink
            to="/documents"
            className={({ isActive }) =>
              `${styles.navLink} ${isActive ? styles.active : ''}`
            }
          >
            <span className={styles.navIcon}><Icons.Documents /></span>
            Documents
          </NavLink>

          <span className={styles.navSection} style={{ marginTop: '1rem' }}>System</span>
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              `${styles.navLink} ${isActive ? styles.active : ''}`
            }
          >
            <span className={styles.navIcon}><Icons.Settings /></span>
            Settings
          </NavLink>
        </nav>

        <div className={styles.sidebarFooter}>
          <span className={styles.versionBadge}>v1.0.0</span>
        </div>
      </aside>

      <main className={styles.main}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/applications" element={<ApplicationsList />} />
          <Route path="/applications/:id" element={<ApplicationDetail />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/documents" element={<Documents />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </main>
    </div>
  );
}
