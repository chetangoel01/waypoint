import { useState } from 'react';
import { Modal, ModalActions } from './Modal';
import { Icons } from './Icons';
import type { ParsedResumeData } from '../services/api';
import styles from '../App.module.css';
import sectionStyles from './ProfileSections.module.css';

interface ResumeParseModalProps {
  isOpen: boolean;
  onClose: () => void;
  parsedData: ParsedResumeData | null;
  onConfirm: (selections: ResumeImportSelections) => Promise<void>;
  isImporting: boolean;
}

export interface ResumeImportSelections {
  profile: boolean;
  experience: boolean;
  education: boolean;
  skills: boolean;
  projects: boolean;
}

export function ResumeParseModal({
  isOpen,
  onClose,
  parsedData,
  onConfirm,
  isImporting,
}: ResumeParseModalProps) {
  const [selections, setSelections] = useState<ResumeImportSelections>({
    profile: true,
    experience: true,
    education: true,
    skills: true,
    projects: true,
  });

  if (!parsedData) return null;

  const toggleSection = (section: keyof ResumeImportSelections) => {
    setSelections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const handleConfirm = () => {
    onConfirm(selections);
  };

  const hasProfile = parsedData.profile.name || parsedData.profile.email || parsedData.profile.phone;
  const hasExperience = parsedData.experience.length > 0;
  const hasEducation = parsedData.education.length > 0;
  const hasSkills = parsedData.skills.length > 0;
  const hasProjects = parsedData.projects.length > 0;

  const selectedCount = Object.values(selections).filter(Boolean).length;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Review Parsed Resume Data" size="xl">
      <p className={styles.formHint}>
        Review the extracted information below. Select what you want to import into your profile.
      </p>

      <div className={sectionStyles.parseModalContent}>
        {/* Profile Section */}
        {hasProfile && (
          <SectionCard
            title="Personal Information"
            icon={<Icons.Profile />}
            selected={selections.profile}
            onToggle={() => toggleSection('profile')}
          >
            <div className={sectionStyles.dataFieldGrid}>
              {parsedData.profile.name && (
                <DataField label="Name" value={parsedData.profile.name} />
              )}
              {parsedData.profile.email && (
                <DataField label="Email" value={parsedData.profile.email} />
              )}
              {parsedData.profile.phone && (
                <DataField label="Phone" value={parsedData.profile.phone} />
              )}
              {parsedData.profile.location && (
                <DataField label="Location" value={parsedData.profile.location} />
              )}
              {parsedData.profile.linkedin_url && (
                <DataField label="LinkedIn" value={parsedData.profile.linkedin_url} />
              )}
              {parsedData.profile.github_url && (
                <DataField label="GitHub" value={parsedData.profile.github_url} />
              )}
              {parsedData.profile.portfolio_url && (
                <DataField label="Portfolio" value={parsedData.profile.portfolio_url} />
              )}
            </div>
            {parsedData.profile.career_goals && (
              <div className={sectionStyles.parseEntryItem}>
                <DataField label="Career Goals" value={parsedData.profile.career_goals} />
              </div>
            )}
          </SectionCard>
        )}

        {/* Experience Section */}
        {hasExperience && (
          <SectionCard
            title={`Work Experience (${parsedData.experience.length})`}
            icon={<Icons.Applications />}
            selected={selections.experience}
            onToggle={() => toggleSection('experience')}
          >
            <div className={sectionStyles.parseColumnLayout}>
              {parsedData.experience.map((exp, i) => (
                <div key={i} className={sectionStyles.parseEntryItem}>
                  <p className={sectionStyles.parseEntryTitle}>
                    {exp.role} at {exp.company}
                  </p>
                  {(exp.start_date || exp.end_date) && (
                    <p className={sectionStyles.parseEntryMeta}>
                      {exp.start_date || 'Unknown'} - {exp.end_date || 'Present'}
                    </p>
                  )}
                  {exp.description && (
                    <p className={sectionStyles.parseEntryDescription}>
                      {exp.description}
                    </p>
                  )}
                  {Array.isArray(exp.achievements) && exp.achievements.length > 0 && (
                    <ul className={sectionStyles.parseEntryList}>
                      {exp.achievements.slice(0, 3).map((ach, j) => (
                        <li key={j}>{ach}</li>
                      ))}
                      {exp.achievements.length > 3 && (
                        <li className={sectionStyles.parseEntryListMore}>
                          +{exp.achievements.length - 3} more
                        </li>
                      )}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </SectionCard>
        )}

        {/* Education Section */}
        {hasEducation && (
          <SectionCard
            title={`Education (${parsedData.education.length})`}
            icon={<Icons.FileText />}
            selected={selections.education}
            onToggle={() => toggleSection('education')}
          >
            <div className={`${sectionStyles.parseColumnLayout} ${sectionStyles.parseColumnLayoutTight}`}>
              {parsedData.education.map((edu, i) => (
                <div key={i} className={sectionStyles.parseEntryItem}>
                  <p className={sectionStyles.parseEntryTitle}>
                    {edu.degree}{edu.field ? ` in ${edu.field}` : ''}
                  </p>
                  <p className={sectionStyles.parseEntryMeta}>
                    {edu.institution}
                    {edu.end_date && ` (${edu.end_date})`}
                    {edu.gpa && ` - GPA: ${edu.gpa}`}
                  </p>
                </div>
              ))}
            </div>
          </SectionCard>
        )}

        {/* Skills Section */}
        {hasSkills && (
          <SectionCard
            title={`Skills (${parsedData.skills.length})`}
            icon={<Icons.Check />}
            selected={selections.skills}
            onToggle={() => toggleSection('skills')}
          >
            <div className={sectionStyles.parseSkillsGrid}>
              {parsedData.skills.map((skill, i) => (
                <span key={i} className={sectionStyles.entryTag}>
                  {skill.name}
                  {skill.category && (
                    <span className={sectionStyles.skillProficiency}>
                      {skill.category}
                    </span>
                  )}
                </span>
              ))}
            </div>
          </SectionCard>
        )}

        {/* Projects Section */}
        {hasProjects && (
          <SectionCard
            title={`Projects (${parsedData.projects.length})`}
            icon={<Icons.Lightbulb />}
            selected={selections.projects}
            onToggle={() => toggleSection('projects')}
          >
            <div className={`${sectionStyles.parseColumnLayout} ${sectionStyles.parseColumnLayoutTight}`}>
              {parsedData.projects.map((proj, i) => (
                <div key={i} className={sectionStyles.parseEntryItem}>
                  <p className={sectionStyles.parseEntryTitle}>{proj.name}</p>
                  {proj.description && (
                    <p className={sectionStyles.parseEntryDescription}>
                      {proj.description}
                    </p>
                  )}
                  {Array.isArray(proj.technologies) && proj.technologies.length > 0 && (
                    <div className={sectionStyles.techTagsContainer}>
                      {proj.technologies.map((tech, j) => (
                        <span key={j} className={sectionStyles.techTag}>
                          {tech}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </SectionCard>
        )}

        {/* No data found */}
        {!hasProfile && !hasExperience && !hasEducation && !hasSkills && !hasProjects && (
          <div className={styles.emptyState}>
            <div className={styles.emptyStateIcon}>
              <Icons.AlertCircle />
            </div>
            <h3 className={styles.emptyStateTitle}>No Data Extracted</h3>
            <p className={styles.emptyStateText}>
              The AI couldn't extract any structured data from your resume. Try uploading a different format or adding the information manually.
            </p>
          </div>
        )}
      </div>

      <ModalActions>
        <button
          className={`${styles.button} ${styles.buttonSecondary}`}
          onClick={onClose}
          disabled={isImporting}
        >
          Cancel
        </button>
        <button
          className={`${styles.button} ${styles.buttonPrimary}`}
          onClick={handleConfirm}
          disabled={isImporting || selectedCount === 0}
        >
          {isImporting ? (
            <>
              <span className={styles.buttonIcon}>
                <Icons.Loader />
              </span>
              Importing...
            </>
          ) : (
            `Import ${selectedCount} Section${selectedCount !== 1 ? 's' : ''}`
          )}
        </button>
      </ModalActions>
    </Modal>
  );
}

// Helper components
interface SectionCardProps {
  title: string;
  icon: React.ReactNode;
  selected: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

function SectionCard({ title, icon, selected, onToggle, children }: SectionCardProps) {
  return (
    <div className={`${sectionStyles.sectionCard} ${selected ? sectionStyles.sectionCardSelected : ''}`}>
      <div className={sectionStyles.sectionCardHeader} onClick={onToggle}>
        <input
          type="checkbox"
          checked={selected}
          onChange={onToggle}
          className={sectionStyles.sectionCardCheckbox}
        />
        <span className={sectionStyles.sectionCardIcon}>{icon}</span>
        <span className={sectionStyles.sectionCardTitle}>{title}</span>
      </div>
      <div className={`${sectionStyles.sectionCardContent} ${!selected ? sectionStyles.sectionCardContentFaded : ''}`}>
        {children}
      </div>
    </div>
  );
}

interface DataFieldProps {
  label: string;
  value: string;
}

function DataField({ label, value }: DataFieldProps) {
  return (
    <div className={sectionStyles.dataField}>
      <span className={sectionStyles.dataFieldLabel}>{label}</span>
      <span className={sectionStyles.dataFieldValue}>{value}</span>
    </div>
  );
}
