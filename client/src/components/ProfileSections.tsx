import { useState } from 'react';
import {
  useExperiences,
  useCreateExperience,
  useUpdateExperience,
  useDeleteExperience,
  useEducation,
  useCreateEducation,
  useUpdateEducation,
  useDeleteEducation,
  useSkills,
  useCreateSkill,
  useUpdateSkill,
  useDeleteSkill,
  useProjects,
  useCreateProject,
  useUpdateProject,
  useDeleteProject,
  useStories,
  useCreateStory,
  useUpdateStory,
  useDeleteStory,
} from '../hooks';
import { Icons } from './Icons';
import { Modal, ModalActions, modalStyles } from './Modal';
import type { WorkExperience, Education, Skill, Project, Story } from '../types';
import styles from '../App.module.css';
import sectionStyles from './ProfileSections.module.css';

// ==================== SUGGESTION DATA ====================

const SKILL_CATEGORIES = [
  'Programming Languages',
  'Frontend',
  'Backend',
  'Databases',
  'Cloud & DevOps',
  'Tools & Platforms',
  'Frameworks & Libraries',
  'Mobile Development',
  'Data & Analytics',
  'Design',
  'Soft Skills',
  'Languages',
  'Certifications',
];

const PROFICIENCY_LEVELS = ['Beginner', 'Intermediate', 'Advanced', 'Expert'];

const TECH_SUGGESTIONS = [
  'React', 'TypeScript', 'JavaScript', 'Node.js', 'Python', 'Go', 'Rust', 'Java',
  'PostgreSQL', 'MongoDB', 'Redis', 'GraphQL', 'REST API', 'Docker', 'Kubernetes',
  'AWS', 'GCP', 'Azure', 'Terraform', 'CI/CD', 'Git', 'Linux', 'Next.js', 'Vue.js',
  'TailwindCSS', 'Express', 'FastAPI', 'Django', 'Spring Boot', 'Prisma', 'SQLite',
];

const STORY_TAG_SUGGESTIONS = [
  'leadership', 'teamwork', 'conflict resolution', 'problem-solving', 'innovation',
  'failure', 'success', 'communication', 'technical', 'deadline', 'mentoring',
  'customer-facing', 'cross-functional', 'initiative', 'adaptability', 'growth',
];

// ==================== WORK EXPERIENCE ====================

interface ExperienceFormData {
  company: string;
  role: string;
  start_date: string;
  end_date: string;
  description: string;
  achievements: string;
}

const emptyExperience: ExperienceFormData = {
  company: '',
  role: '',
  start_date: '',
  end_date: '',
  description: '',
  achievements: '',
};

export function ExperienceSection() {
  const { data: experiences, isLoading } = useExperiences();
  const createExperience = useCreateExperience();
  const updateExperience = useUpdateExperience();
  const deleteExperience = useDeleteExperience();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<ExperienceFormData>(emptyExperience);
  const [deleteConfirm, setDeleteConfirm] = useState<WorkExperience | null>(null);
  const [previewItem, setPreviewItem] = useState<WorkExperience | null>(null);

  const handleEdit = (exp: WorkExperience) => {
    setEditingId(exp.id);
    setFormData({
      company: exp.company,
      role: exp.role,
      start_date: exp.start_date || '',
      end_date: exp.end_date || '',
      description: exp.description || '',
      achievements: Array.isArray(exp.achievements) ? exp.achievements.join('\n') : '',
    });
    setPreviewItem(null);
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    const data = {
      company: formData.company,
      role: formData.role,
      start_date: formData.start_date || null,
      end_date: formData.end_date || null,
      description: formData.description || null,
      achievements: formData.achievements
        ? formData.achievements.split('\n').filter((a) => a.trim())
        : null,
    };

    if (editingId) {
      await updateExperience.mutateAsync({ id: editingId, data });
    } else {
      await createExperience.mutateAsync(data);
    }
    setIsModalOpen(false);
    setEditingId(null);
    setFormData(emptyExperience);
  };

  const handleDelete = async () => {
    if (deleteConfirm) {
      await deleteExperience.mutateAsync(deleteConfirm.id);
      setDeleteConfirm(null);
    }
  };

  return (
    <section className={styles.profileSection}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
        <h2 className={styles.profileSectionTitle} style={{ marginBottom: 0 }}>Work Experience</h2>
        <button
          className={`${styles.button} ${styles.buttonSecondary}`}
          onClick={() => {
            setEditingId(null);
            setFormData(emptyExperience);
            setIsModalOpen(true);
          }}
        >
          <span className={styles.buttonIcon}><Icons.Plus /></span>
          Add
        </button>
      </div>

      {isLoading ? (
        <p className={styles.formHint}>Loading...</p>
      ) : experiences?.length === 0 ? (
        <div className={sectionStyles.emptyHint}>
          No work experience added yet. Add your work history to help the AI personalize your applications.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {experiences?.map((exp) => (
            <div key={exp.id} className={sectionStyles.entryCard} onClick={() => setPreviewItem(exp)}>
              <div className={`${sectionStyles.entryIcon} ${sectionStyles.entryIconExperience}`}>
                <Icons.Applications />
              </div>
              <div className={sectionStyles.entryContent}>
                <p className={sectionStyles.entryTitle}>{exp.role}</p>
                <p className={sectionStyles.entrySubtitle}>
                  {exp.company}
                  {exp.start_date && ` · ${exp.start_date}${exp.end_date ? ` - ${exp.end_date}` : ' - Present'}`}
                </p>
              </div>
              <div className={sectionStyles.entryActions}>
                <button
                  className={`${sectionStyles.actionBtn} ${sectionStyles.actionBtnEdit}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEdit(exp);
                  }}
                  title="Edit"
                >
                  <Icons.Edit />
                </button>
                <button
                  className={`${sectionStyles.actionBtn} ${sectionStyles.actionBtnDelete}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteConfirm(exp);
                  }}
                  title="Delete"
                >
                  <Icons.Trash />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Preview Modal */}
      <Modal
        isOpen={!!previewItem}
        onClose={() => setPreviewItem(null)}
        title={previewItem?.role || 'Experience'}
        size="md"
      >
        {previewItem && (
          <div>
            <div className={sectionStyles.previewSection}>
              <p className={sectionStyles.previewLabel}>Company</p>
              <p className={sectionStyles.previewValue}>{previewItem.company}</p>
            </div>
            <div className={sectionStyles.previewSection}>
              <p className={sectionStyles.previewLabel}>Duration</p>
              <p className={sectionStyles.previewValue}>
                {previewItem.start_date || 'N/A'} - {previewItem.end_date || 'Present'}
              </p>
            </div>
            {previewItem.description && (
              <div className={sectionStyles.previewSection}>
                <p className={sectionStyles.previewLabel}>Description</p>
                <p className={sectionStyles.previewValue}>{previewItem.description}</p>
              </div>
            )}
            {previewItem.achievements && Array.isArray(previewItem.achievements) && previewItem.achievements.length > 0 && (
              <div className={sectionStyles.previewSection}>
                <p className={sectionStyles.previewLabel}>Key Achievements</p>
                <ul className={sectionStyles.previewList}>
                  {previewItem.achievements.map((ach, i) => (
                    <li key={i}>{ach}</li>
                  ))}
                </ul>
              </div>
            )}
            <ModalActions>
              <button
                className={`${styles.button} ${styles.buttonSecondary}`}
                onClick={() => setPreviewItem(null)}
              >
                Close
              </button>
              <button
                className={`${styles.button} ${styles.buttonPrimary}`}
                onClick={() => {
                  handleEdit(previewItem);
                }}
              >
                <span className={styles.buttonIcon}><Icons.Edit /></span>
                Edit
              </button>
            </ModalActions>
          </div>
        )}
      </Modal>

      {/* Edit/Create Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingId ? 'Edit Experience' : 'Add Experience'}
        size="md"
      >
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Company *</label>
          <input
            type="text"
            value={formData.company}
            onChange={(e) => setFormData({ ...formData, company: e.target.value })}
            placeholder="Company name"
          />
        </div>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Role *</label>
          <input
            type="text"
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            placeholder="Job title"
          />
        </div>
        <div className={styles.formGrid}>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Start Date</label>
            <input
              type="text"
              value={formData.start_date}
              onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
              placeholder="e.g., Jan 2022"
            />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>End Date</label>
            <input
              type="text"
              value={formData.end_date}
              onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
              placeholder="e.g., Dec 2023 or Present"
            />
          </div>
        </div>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Description</label>
          <textarea
            rows={3}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Brief description of your role"
            style={{ width: '100%', resize: 'vertical' }}
          />
        </div>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Key Achievements</label>
          <p className={styles.formHint}>One per line</p>
          <textarea
            rows={4}
            value={formData.achievements}
            onChange={(e) => setFormData({ ...formData, achievements: e.target.value })}
            placeholder="Increased sales by 20%&#10;Led team of 5 engineers&#10;Launched new product feature"
            style={{ width: '100%', resize: 'vertical' }}
          />
        </div>
        <ModalActions>
          <button className={`${styles.button} ${styles.buttonSecondary}`} onClick={() => setIsModalOpen(false)}>
            Cancel
          </button>
          <button
            className={`${styles.button} ${styles.buttonPrimary}`}
            onClick={handleSave}
            disabled={!formData.company || !formData.role || createExperience.isPending || updateExperience.isPending}
          >
            {createExperience.isPending || updateExperience.isPending ? 'Saving...' : 'Save'}
          </button>
        </ModalActions>
      </Modal>

      {/* Delete Confirmation */}
      <Modal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Delete Experience?" size="sm">
        <p className={modalStyles.confirmMessage}>
          Are you sure you want to delete your experience at <strong>{deleteConfirm?.company}</strong>?
        </p>
        <ModalActions>
          <button className={`${styles.button} ${styles.buttonSecondary}`} onClick={() => setDeleteConfirm(null)}>
            Cancel
          </button>
          <button
            className={`${styles.button} ${styles.buttonDanger}`}
            onClick={handleDelete}
            disabled={deleteExperience.isPending}
          >
            {deleteExperience.isPending ? 'Deleting...' : 'Delete'}
          </button>
        </ModalActions>
      </Modal>
    </section>
  );
}

// ==================== EDUCATION ====================

interface EducationFormData {
  institution: string;
  degree: string;
  field: string;
  start_date: string;
  end_date: string;
  gpa: string;
  coursework: string;
}

const emptyEducation: EducationFormData = {
  institution: '',
  degree: '',
  field: '',
  start_date: '',
  end_date: '',
  gpa: '',
  coursework: '',
};

export function EducationSection() {
  const { data: educationList, isLoading } = useEducation();
  const createEducation = useCreateEducation();
  const updateEducation = useUpdateEducation();
  const deleteEducation = useDeleteEducation();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<EducationFormData>(emptyEducation);
  const [deleteConfirm, setDeleteConfirm] = useState<Education | null>(null);
  const [previewItem, setPreviewItem] = useState<Education | null>(null);

  const handleEdit = (edu: Education) => {
    setEditingId(edu.id);
    setFormData({
      institution: edu.institution,
      degree: edu.degree,
      field: edu.field || '',
      start_date: edu.start_date || '',
      end_date: edu.end_date || '',
      gpa: edu.gpa?.toString() || '',
      coursework: Array.isArray(edu.coursework) ? edu.coursework.join('\n') : '',
    });
    setPreviewItem(null);
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    const data = {
      institution: formData.institution,
      degree: formData.degree,
      field: formData.field || null,
      start_date: formData.start_date || null,
      end_date: formData.end_date || null,
      gpa: formData.gpa ? parseFloat(formData.gpa) : null,
      coursework: formData.coursework
        ? formData.coursework.split('\n').filter((c) => c.trim())
        : null,
    };

    if (editingId) {
      await updateEducation.mutateAsync({ id: editingId, data });
    } else {
      await createEducation.mutateAsync(data);
    }
    setIsModalOpen(false);
    setEditingId(null);
    setFormData(emptyEducation);
  };

  const handleDelete = async () => {
    if (deleteConfirm) {
      await deleteEducation.mutateAsync(deleteConfirm.id);
      setDeleteConfirm(null);
    }
  };

  return (
    <section className={styles.profileSection}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
        <h2 className={styles.profileSectionTitle} style={{ marginBottom: 0 }}>Education</h2>
        <button
          className={`${styles.button} ${styles.buttonSecondary}`}
          onClick={() => {
            setEditingId(null);
            setFormData(emptyEducation);
            setIsModalOpen(true);
          }}
        >
          <span className={styles.buttonIcon}><Icons.Plus /></span>
          Add
        </button>
      </div>

      {isLoading ? (
        <p className={styles.formHint}>Loading...</p>
      ) : educationList?.length === 0 ? (
        <div className={sectionStyles.emptyHint}>
          No education added yet. Add your academic background.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {educationList?.map((edu) => (
            <div key={edu.id} className={sectionStyles.entryCard} onClick={() => setPreviewItem(edu)}>
              <div className={`${sectionStyles.entryIcon} ${sectionStyles.entryIconEducation}`}>
                <Icons.FileText />
              </div>
              <div className={sectionStyles.entryContent}>
                <p className={sectionStyles.entryTitle}>{edu.degree}{edu.field && ` in ${edu.field}`}</p>
                <p className={sectionStyles.entrySubtitle}>
                  {edu.institution}
                  {edu.end_date && ` · ${edu.end_date}`}
                  {edu.gpa && ` · GPA: ${edu.gpa}`}
                </p>
              </div>
              <div className={sectionStyles.entryActions}>
                <button
                  className={`${sectionStyles.actionBtn} ${sectionStyles.actionBtnEdit}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEdit(edu);
                  }}
                  title="Edit"
                >
                  <Icons.Edit />
                </button>
                <button
                  className={`${sectionStyles.actionBtn} ${sectionStyles.actionBtnDelete}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteConfirm(edu);
                  }}
                  title="Delete"
                >
                  <Icons.Trash />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Preview Modal */}
      <Modal
        isOpen={!!previewItem}
        onClose={() => setPreviewItem(null)}
        title={previewItem?.degree || 'Education'}
        size="md"
      >
        {previewItem && (
          <div>
            <div className={sectionStyles.previewSection}>
              <p className={sectionStyles.previewLabel}>Institution</p>
              <p className={sectionStyles.previewValue}>{previewItem.institution}</p>
            </div>
            <div className={sectionStyles.previewSection}>
              <p className={sectionStyles.previewLabel}>Degree</p>
              <p className={sectionStyles.previewValue}>
                {previewItem.degree}
                {previewItem.field && ` in ${previewItem.field}`}
              </p>
            </div>
            <div className={sectionStyles.previewSection}>
              <p className={sectionStyles.previewLabel}>Duration</p>
              <p className={sectionStyles.previewValue}>
                {previewItem.start_date || 'N/A'} - {previewItem.end_date || 'Present'}
              </p>
            </div>
            {previewItem.gpa && (
              <div className={sectionStyles.previewSection}>
                <p className={sectionStyles.previewLabel}>GPA</p>
                <p className={sectionStyles.previewValue}>{previewItem.gpa}</p>
              </div>
            )}
            {previewItem.coursework && previewItem.coursework.length > 0 && (
              <div className={sectionStyles.previewSection}>
                <p className={sectionStyles.previewLabel}>Relevant Coursework</p>
                <ul className={sectionStyles.previewList}>
                  {previewItem.coursework.map((course, i) => (
                    <li key={i}>{course}</li>
                  ))}
                </ul>
              </div>
            )}
            <ModalActions>
              <button
                className={`${styles.button} ${styles.buttonSecondary}`}
                onClick={() => setPreviewItem(null)}
              >
                Close
              </button>
              <button
                className={`${styles.button} ${styles.buttonPrimary}`}
                onClick={() => {
                  handleEdit(previewItem);
                }}
              >
                <span className={styles.buttonIcon}><Icons.Edit /></span>
                Edit
              </button>
            </ModalActions>
          </div>
        )}
      </Modal>

      {/* Edit/Create Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingId ? 'Edit Education' : 'Add Education'}
        size="md"
      >
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Institution *</label>
          <input
            type="text"
            value={formData.institution}
            onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
            placeholder="University or school name"
          />
        </div>
        <div className={styles.formGrid}>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Degree *</label>
            <input
              type="text"
              value={formData.degree}
              onChange={(e) => setFormData({ ...formData, degree: e.target.value })}
              placeholder="e.g., Bachelor of Science"
            />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Field of Study</label>
            <input
              type="text"
              value={formData.field}
              onChange={(e) => setFormData({ ...formData, field: e.target.value })}
              placeholder="e.g., Computer Science"
            />
          </div>
        </div>
        <div className={styles.formGrid}>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Start Date</label>
            <input
              type="text"
              value={formData.start_date}
              onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
              placeholder="e.g., Sep 2018"
            />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>End Date</label>
            <input
              type="text"
              value={formData.end_date}
              onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
              placeholder="e.g., May 2022"
            />
          </div>
        </div>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>GPA</label>
          <input
            type="text"
            value={formData.gpa}
            onChange={(e) => setFormData({ ...formData, gpa: e.target.value })}
            placeholder="e.g., 3.8"
            style={{ maxWidth: '100px' }}
          />
        </div>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Relevant Coursework</label>
          <p className={styles.formHint}>One per line</p>
          <textarea
            rows={3}
            value={formData.coursework}
            onChange={(e) => setFormData({ ...formData, coursework: e.target.value })}
            placeholder="Data Structures&#10;Machine Learning&#10;Database Systems"
            style={{ width: '100%', resize: 'vertical' }}
          />
        </div>
        <ModalActions>
          <button className={`${styles.button} ${styles.buttonSecondary}`} onClick={() => setIsModalOpen(false)}>
            Cancel
          </button>
          <button
            className={`${styles.button} ${styles.buttonPrimary}`}
            onClick={handleSave}
            disabled={!formData.institution || !formData.degree || createEducation.isPending || updateEducation.isPending}
          >
            {createEducation.isPending || updateEducation.isPending ? 'Saving...' : 'Save'}
          </button>
        </ModalActions>
      </Modal>

      {/* Delete Confirmation */}
      <Modal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Delete Education?" size="sm">
        <p className={modalStyles.confirmMessage}>
          Are you sure you want to delete <strong>{deleteConfirm?.institution}</strong>?
        </p>
        <ModalActions>
          <button className={`${styles.button} ${styles.buttonSecondary}`} onClick={() => setDeleteConfirm(null)}>
            Cancel
          </button>
          <button
            className={`${styles.button} ${styles.buttonDanger}`}
            onClick={handleDelete}
            disabled={deleteEducation.isPending}
          >
            {deleteEducation.isPending ? 'Deleting...' : 'Delete'}
          </button>
        </ModalActions>
      </Modal>
    </section>
  );
}

// ==================== SKILLS ====================

interface SkillFormData {
  category: string;
  name: string;
  proficiency: string;
}

export function SkillsSection() {
  const { data: skillsByCategory, isLoading } = useSkills();
  const createSkill = useCreateSkill();
  const updateSkill = useUpdateSkill();
  const deleteSkill = useDeleteSkill();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSkill, setEditingSkill] = useState<Skill | null>(null);
  const [formData, setFormData] = useState<SkillFormData>({ category: '', name: '', proficiency: '' });

  const categories = skillsByCategory ? Object.keys(skillsByCategory) : [];

  const handleAddSkill = async () => {
    if (!formData.category || !formData.name) return;

    if (editingSkill) {
      await updateSkill.mutateAsync({
        id: editingSkill.id,
        data: {
          category: formData.category,
          name: formData.name,
          proficiency: formData.proficiency || null,
        },
      });
    } else {
      await createSkill.mutateAsync({
        category: formData.category,
        name: formData.name,
        proficiency: formData.proficiency || null,
      });
    }
    setFormData({ category: '', name: '', proficiency: '' });
    setEditingSkill(null);
    setIsModalOpen(false);
  };

  const handleEditSkill = (skill: Skill) => {
    setEditingSkill(skill);
    setFormData({
      category: skill.category,
      name: skill.name,
      proficiency: skill.proficiency || '',
    });
    setIsModalOpen(true);
  };

  const openAddModal = (category?: string) => {
    setEditingSkill(null);
    setFormData({ category: category || '', name: '', proficiency: '' });
    setIsModalOpen(true);
  };

  return (
    <section className={styles.profileSection}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
        <h2 className={styles.profileSectionTitle} style={{ marginBottom: 0 }}>Skills</h2>
        <button
          className={`${styles.button} ${styles.buttonSecondary}`}
          onClick={() => openAddModal()}
        >
          <span className={styles.buttonIcon}><Icons.Plus /></span>
          Add
        </button>
      </div>

      {isLoading ? (
        <p className={styles.formHint}>Loading...</p>
      ) : categories.length === 0 ? (
        <div className={sectionStyles.emptyHint}>
          No skills added yet. Add your technical and professional skills.
        </div>
      ) : (
        <div className={sectionStyles.skillsContainer}>
          {categories.map((category) => (
            <div key={category} className={sectionStyles.skillCategory}>
              <div className={sectionStyles.skillCategoryHeader}>
                <p className={sectionStyles.skillCategoryTitle}>{category}</p>
                <button
                  className={sectionStyles.skillCategoryEdit}
                  onClick={() => openAddModal(category)}
                >
                  + Add
                </button>
              </div>
              <div className={sectionStyles.skillTags}>
                {skillsByCategory?.[category]?.map((skill: Skill) => (
                  <span key={skill.id} className={sectionStyles.skillTag}>
                    {skill.name}
                    {skill.proficiency && (
                      <span className={sectionStyles.skillProficiency}>{skill.proficiency}</span>
                    )}
                    <button
                      className={`${sectionStyles.actionBtn} ${sectionStyles.actionBtnEdit}`}
                      onClick={() => handleEditSkill(skill)}
                      title="Edit"
                      style={{ width: '20px', height: '20px', marginLeft: 'var(--space-1)' }}
                    >
                      <Icons.Edit />
                    </button>
                    <button
                      className={sectionStyles.skillRemove}
                      onClick={() => deleteSkill.mutate(skill.id)}
                      title="Remove"
                    >
                      <Icons.X />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Skill Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingSkill(null);
        }}
        title={editingSkill ? 'Edit Skill' : 'Add Skill'}
        size="sm"
      >
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Category *</label>
          <input
            type="text"
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            placeholder="e.g., Programming Languages"
            list="skill-categories"
          />
          <datalist id="skill-categories">
            {SKILL_CATEGORIES.map((cat) => (
              <option key={cat} value={cat} />
            ))}
          </datalist>
          <div className={sectionStyles.suggestionChips}>
            {SKILL_CATEGORIES.slice(0, 6).map((cat) => (
              <button
                key={cat}
                type="button"
                className={sectionStyles.suggestionChip}
                onClick={() => setFormData({ ...formData, category: cat })}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Skill Name *</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., Python"
          />
        </div>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Proficiency</label>
          <select
            value={formData.proficiency}
            onChange={(e) => setFormData({ ...formData, proficiency: e.target.value })}
            style={{ width: '100%' }}
          >
            <option value="">Select proficiency level</option>
            {PROFICIENCY_LEVELS.map((level) => (
              <option key={level} value={level}>{level}</option>
            ))}
          </select>
        </div>
        <ModalActions>
          <button
            className={`${styles.button} ${styles.buttonSecondary}`}
            onClick={() => {
              setIsModalOpen(false);
              setEditingSkill(null);
            }}
          >
            Cancel
          </button>
          <button
            className={`${styles.button} ${styles.buttonPrimary}`}
            onClick={handleAddSkill}
            disabled={!formData.category || !formData.name || createSkill.isPending || updateSkill.isPending}
          >
            {createSkill.isPending || updateSkill.isPending ? 'Saving...' : editingSkill ? 'Update' : 'Add Skill'}
          </button>
        </ModalActions>
      </Modal>
    </section>
  );
}

// ==================== PROJECTS ====================

interface ProjectFormData {
  name: string;
  description: string;
  technologies: string;
  outcomes: string;
  url: string;
}

const emptyProject: ProjectFormData = {
  name: '',
  description: '',
  technologies: '',
  outcomes: '',
  url: '',
};

export function ProjectsSection() {
  const { data: projects, isLoading } = useProjects();
  const createProject = useCreateProject();
  const updateProject = useUpdateProject();
  const deleteProject = useDeleteProject();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<ProjectFormData>(emptyProject);
  const [deleteConfirm, setDeleteConfirm] = useState<Project | null>(null);
  const [previewItem, setPreviewItem] = useState<Project | null>(null);

  const handleEdit = (proj: Project) => {
    setEditingId(proj.id);
    setFormData({
      name: proj.name,
      description: proj.description || '',
      technologies: Array.isArray(proj.technologies) ? proj.technologies.join(', ') : '',
      outcomes: proj.outcomes || '',
      url: proj.url || '',
    });
    setPreviewItem(null);
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    const data = {
      name: formData.name,
      description: formData.description || null,
      technologies: formData.technologies
        ? formData.technologies.split(',').map((t) => t.trim()).filter(Boolean)
        : null,
      outcomes: formData.outcomes || null,
      url: formData.url || null,
    };

    if (editingId) {
      await updateProject.mutateAsync({ id: editingId, data });
    } else {
      await createProject.mutateAsync(data);
    }
    setIsModalOpen(false);
    setEditingId(null);
    setFormData(emptyProject);
  };

  const handleDelete = async () => {
    if (deleteConfirm) {
      await deleteProject.mutateAsync(deleteConfirm.id);
      setDeleteConfirm(null);
    }
  };

  const addTech = (tech: string) => {
    const current = formData.technologies ? formData.technologies.split(',').map(t => t.trim()) : [];
    if (!current.includes(tech)) {
      setFormData({ ...formData, technologies: [...current, tech].join(', ') });
    }
  };

  return (
    <section className={styles.profileSection}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
        <h2 className={styles.profileSectionTitle} style={{ marginBottom: 0 }}>Projects</h2>
        <button
          className={`${styles.button} ${styles.buttonSecondary}`}
          onClick={() => {
            setEditingId(null);
            setFormData(emptyProject);
            setIsModalOpen(true);
          }}
        >
          <span className={styles.buttonIcon}><Icons.Plus /></span>
          Add
        </button>
      </div>

      {isLoading ? (
        <p className={styles.formHint}>Loading...</p>
      ) : projects?.length === 0 ? (
        <div className={sectionStyles.emptyHint}>
          No projects added yet. Showcase your notable work and side projects.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {projects?.map((proj) => (
            <div key={proj.id} className={sectionStyles.entryCard} onClick={() => setPreviewItem(proj)}>
              <div className={`${sectionStyles.entryIcon} ${sectionStyles.entryIconProject}`}>
                <Icons.Lightbulb />
              </div>
              <div className={sectionStyles.entryContent}>
                <p className={sectionStyles.entryTitle}>{proj.name}</p>
                <p className={sectionStyles.entrySubtitle}>
                  {Array.isArray(proj.technologies) && proj.technologies.slice(0, 3).join(', ')}
                  {Array.isArray(proj.technologies) && proj.technologies.length > 3 && ` +${proj.technologies.length - 3} more`}
                </p>
              </div>
              <div className={sectionStyles.entryActions}>
                <button
                  className={`${sectionStyles.actionBtn} ${sectionStyles.actionBtnEdit}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEdit(proj);
                  }}
                  title="Edit"
                >
                  <Icons.Edit />
                </button>
                <button
                  className={`${sectionStyles.actionBtn} ${sectionStyles.actionBtnDelete}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteConfirm(proj);
                  }}
                  title="Delete"
                >
                  <Icons.Trash />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Preview Modal */}
      <Modal
        isOpen={!!previewItem}
        onClose={() => setPreviewItem(null)}
        title={previewItem?.name || 'Project'}
        size="md"
      >
        {previewItem && (
          <div>
            {previewItem.description && (
              <div className={sectionStyles.previewSection}>
                <p className={sectionStyles.previewLabel}>Description</p>
                <p className={sectionStyles.previewValue}>{previewItem.description}</p>
              </div>
            )}
            {previewItem.technologies && Array.isArray(previewItem.technologies) && previewItem.technologies.length > 0 && (
              <div className={sectionStyles.previewSection}>
                <p className={sectionStyles.previewLabel}>Technologies</p>
                <div className={sectionStyles.entryMeta}>
                  {previewItem.technologies.map((tech, i) => (
                    <span key={i} className={sectionStyles.entryTag}>{tech}</span>
                  ))}
                </div>
              </div>
            )}
            {previewItem.outcomes && (
              <div className={sectionStyles.previewSection}>
                <p className={sectionStyles.previewLabel}>Outcomes / Impact</p>
                <p className={sectionStyles.previewValue}>{previewItem.outcomes}</p>
              </div>
            )}
            {previewItem.url && (
              <div className={sectionStyles.previewSection}>
                <p className={sectionStyles.previewLabel}>URL</p>
                <p className={sectionStyles.previewValue}>
                  <a href={previewItem.url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-terracotta)' }}>
                    {previewItem.url}
                  </a>
                </p>
              </div>
            )}
            <ModalActions>
              <button
                className={`${styles.button} ${styles.buttonSecondary}`}
                onClick={() => setPreviewItem(null)}
              >
                Close
              </button>
              <button
                className={`${styles.button} ${styles.buttonPrimary}`}
                onClick={() => {
                  handleEdit(previewItem);
                }}
              >
                <span className={styles.buttonIcon}><Icons.Edit /></span>
                Edit
              </button>
            </ModalActions>
          </div>
        )}
      </Modal>

      {/* Edit/Create Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingId ? 'Edit Project' : 'Add Project'}
        size="md"
      >
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Project Name *</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Project name"
          />
        </div>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Description</label>
          <textarea
            rows={3}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="What does this project do?"
            style={{ width: '100%', resize: 'vertical' }}
          />
        </div>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Technologies</label>
          <p className={styles.formHint}>Comma-separated</p>
          <input
            type="text"
            value={formData.technologies}
            onChange={(e) => setFormData({ ...formData, technologies: e.target.value })}
            placeholder="React, Node.js, PostgreSQL"
          />
          <div className={sectionStyles.suggestionChips}>
            {TECH_SUGGESTIONS.slice(0, 8).map((tech) => (
              <button
                key={tech}
                type="button"
                className={sectionStyles.suggestionChip}
                onClick={() => addTech(tech)}
              >
                + {tech}
              </button>
            ))}
          </div>
        </div>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Outcomes / Impact</label>
          <textarea
            rows={2}
            value={formData.outcomes}
            onChange={(e) => setFormData({ ...formData, outcomes: e.target.value })}
            placeholder="What was the result or impact?"
            style={{ width: '100%', resize: 'vertical' }}
          />
        </div>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>URL</label>
          <input
            type="url"
            value={formData.url}
            onChange={(e) => setFormData({ ...formData, url: e.target.value })}
            placeholder="https://github.com/..."
          />
        </div>
        <ModalActions>
          <button className={`${styles.button} ${styles.buttonSecondary}`} onClick={() => setIsModalOpen(false)}>
            Cancel
          </button>
          <button
            className={`${styles.button} ${styles.buttonPrimary}`}
            onClick={handleSave}
            disabled={!formData.name || createProject.isPending || updateProject.isPending}
          >
            {createProject.isPending || updateProject.isPending ? 'Saving...' : 'Save'}
          </button>
        </ModalActions>
      </Modal>

      {/* Delete Confirmation */}
      <Modal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Delete Project?" size="sm">
        <p className={modalStyles.confirmMessage}>
          Are you sure you want to delete <strong>{deleteConfirm?.name}</strong>?
        </p>
        <ModalActions>
          <button className={`${styles.button} ${styles.buttonSecondary}`} onClick={() => setDeleteConfirm(null)}>
            Cancel
          </button>
          <button
            className={`${styles.button} ${styles.buttonDanger}`}
            onClick={handleDelete}
            disabled={deleteProject.isPending}
          >
            {deleteProject.isPending ? 'Deleting...' : 'Delete'}
          </button>
        </ModalActions>
      </Modal>
    </section>
  );
}

// ==================== STORIES (STAR Format) ====================

interface StoryFormData {
  title: string;
  situation: string;
  task: string;
  action: string;
  result: string;
  tags: string;
}

const emptyStory: StoryFormData = {
  title: '',
  situation: '',
  task: '',
  action: '',
  result: '',
  tags: '',
};

export function StoriesSection() {
  const { data: stories, isLoading } = useStories();
  const createStory = useCreateStory();
  const updateStory = useUpdateStory();
  const deleteStory = useDeleteStory();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<StoryFormData>(emptyStory);
  const [deleteConfirm, setDeleteConfirm] = useState<Story | null>(null);
  const [previewItem, setPreviewItem] = useState<Story | null>(null);

  const handleEdit = (story: Story) => {
    setEditingId(story.id);
    setFormData({
      title: story.title,
      situation: story.situation || '',
      task: story.task || '',
      action: story.action || '',
      result: story.result || '',
      tags: Array.isArray(story.tags) ? story.tags.join(', ') : '',
    });
    setPreviewItem(null);
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    const data = {
      title: formData.title,
      situation: formData.situation || null,
      task: formData.task || null,
      action: formData.action || null,
      result: formData.result || null,
      tags: formData.tags
        ? formData.tags.split(',').map((t) => t.trim()).filter(Boolean)
        : null,
    };

    if (editingId) {
      await updateStory.mutateAsync({ id: editingId, data });
    } else {
      await createStory.mutateAsync(data);
    }
    setIsModalOpen(false);
    setEditingId(null);
    setFormData(emptyStory);
  };

  const handleDelete = async () => {
    if (deleteConfirm) {
      await deleteStory.mutateAsync(deleteConfirm.id);
      setDeleteConfirm(null);
    }
  };

  const addTag = (tag: string) => {
    const current = formData.tags ? formData.tags.split(',').map(t => t.trim()) : [];
    if (!current.includes(tag)) {
      setFormData({ ...formData, tags: [...current, tag].join(', ') });
    }
  };

  return (
    <section className={styles.profileSection}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
        <div>
          <h2 className={styles.profileSectionTitle} style={{ marginBottom: 'var(--space-1)' }}>STAR Stories</h2>
          <p className={styles.formHint}>Behavioral interview stories in Situation-Task-Action-Result format</p>
        </div>
        <button
          className={`${styles.button} ${styles.buttonSecondary}`}
          onClick={() => {
            setEditingId(null);
            setFormData(emptyStory);
            setIsModalOpen(true);
          }}
        >
          <span className={styles.buttonIcon}><Icons.Plus /></span>
          Add
        </button>
      </div>

      {isLoading ? (
        <p className={styles.formHint}>Loading...</p>
      ) : stories?.length === 0 ? (
        <div className={sectionStyles.emptyHint}>
          No stories added yet. Add your best behavioral interview stories.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {stories?.map((story) => (
            <div key={story.id} className={sectionStyles.entryCard} onClick={() => setPreviewItem(story)}>
              <div className={`${sectionStyles.entryIcon} ${sectionStyles.entryIconStory}`}>
                <Icons.FileText />
              </div>
              <div className={sectionStyles.entryContent}>
                <p className={sectionStyles.entryTitle}>{story.title}</p>
                {story.tags && story.tags.length > 0 && (
                  <div className={sectionStyles.entryMeta}>
                    {story.tags.map((tag, i) => (
                      <span key={i} className={sectionStyles.entryTag}>#{tag}</span>
                    ))}
                  </div>
                )}
              </div>
              <div className={sectionStyles.entryActions}>
                <button
                  className={`${sectionStyles.actionBtn} ${sectionStyles.actionBtnEdit}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEdit(story);
                  }}
                  title="Edit"
                >
                  <Icons.Edit />
                </button>
                <button
                  className={`${sectionStyles.actionBtn} ${sectionStyles.actionBtnDelete}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteConfirm(story);
                  }}
                  title="Delete"
                >
                  <Icons.Trash />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Preview Modal */}
      <Modal
        isOpen={!!previewItem}
        onClose={() => setPreviewItem(null)}
        title={previewItem?.title || 'Story'}
        size="lg"
      >
        {previewItem && (
          <div>
            {previewItem.tags && previewItem.tags.length > 0 && (
              <div className={sectionStyles.entryMeta} style={{ marginBottom: 'var(--space-4)' }}>
                {previewItem.tags.map((tag, i) => (
                  <span key={i} className={sectionStyles.entryTag}>#{tag}</span>
                ))}
              </div>
            )}
            {previewItem.situation && (
              <div className={sectionStyles.starSection}>
                <p className={sectionStyles.starLabel}>Situation</p>
                <p className={sectionStyles.starContent}>{previewItem.situation}</p>
              </div>
            )}
            {previewItem.task && (
              <div className={sectionStyles.starSection}>
                <p className={sectionStyles.starLabel}>Task</p>
                <p className={sectionStyles.starContent}>{previewItem.task}</p>
              </div>
            )}
            {previewItem.action && (
              <div className={sectionStyles.starSection}>
                <p className={sectionStyles.starLabel}>Action</p>
                <p className={sectionStyles.starContent}>{previewItem.action}</p>
              </div>
            )}
            {previewItem.result && (
              <div className={sectionStyles.starSection}>
                <p className={sectionStyles.starLabel}>Result</p>
                <p className={sectionStyles.starContent}>{previewItem.result}</p>
              </div>
            )}
            <ModalActions>
              <button
                className={`${styles.button} ${styles.buttonSecondary}`}
                onClick={() => setPreviewItem(null)}
              >
                Close
              </button>
              <button
                className={`${styles.button} ${styles.buttonPrimary}`}
                onClick={() => {
                  handleEdit(previewItem);
                }}
              >
                <span className={styles.buttonIcon}><Icons.Edit /></span>
                Edit
              </button>
            </ModalActions>
          </div>
        )}
      </Modal>

      {/* Edit/Create Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingId ? 'Edit Story' : 'Add Story'}
        size="lg"
      >
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Story Title *</label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="e.g., Led migration to microservices"
          />
        </div>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Situation</label>
          <p className={styles.formHint}>Set the scene - what was the context?</p>
          <textarea
            rows={2}
            value={formData.situation}
            onChange={(e) => setFormData({ ...formData, situation: e.target.value })}
            placeholder="Our monolithic application was struggling to scale..."
            style={{ width: '100%', resize: 'vertical' }}
          />
        </div>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Task</label>
          <p className={styles.formHint}>What was your responsibility?</p>
          <textarea
            rows={2}
            value={formData.task}
            onChange={(e) => setFormData({ ...formData, task: e.target.value })}
            placeholder="I was tasked with leading the migration..."
            style={{ width: '100%', resize: 'vertical' }}
          />
        </div>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Action</label>
          <p className={styles.formHint}>What did you do?</p>
          <textarea
            rows={3}
            value={formData.action}
            onChange={(e) => setFormData({ ...formData, action: e.target.value })}
            placeholder="I designed the new architecture, coordinated with 3 teams..."
            style={{ width: '100%', resize: 'vertical' }}
          />
        </div>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Result</label>
          <p className={styles.formHint}>What was the outcome? Use metrics if possible.</p>
          <textarea
            rows={2}
            value={formData.result}
            onChange={(e) => setFormData({ ...formData, result: e.target.value })}
            placeholder="Reduced deployment time by 80%, improved uptime to 99.9%..."
            style={{ width: '100%', resize: 'vertical' }}
          />
        </div>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Tags</label>
          <p className={styles.formHint}>Comma-separated (e.g., leadership, technical, conflict)</p>
          <input
            type="text"
            value={formData.tags}
            onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
            placeholder="leadership, technical, teamwork"
          />
          <div className={sectionStyles.suggestionChips}>
            {STORY_TAG_SUGGESTIONS.slice(0, 8).map((tag) => (
              <button
                key={tag}
                type="button"
                className={sectionStyles.suggestionChip}
                onClick={() => addTag(tag)}
              >
                + {tag}
              </button>
            ))}
          </div>
        </div>
        <ModalActions>
          <button className={`${styles.button} ${styles.buttonSecondary}`} onClick={() => setIsModalOpen(false)}>
            Cancel
          </button>
          <button
            className={`${styles.button} ${styles.buttonPrimary}`}
            onClick={handleSave}
            disabled={!formData.title || createStory.isPending || updateStory.isPending}
          >
            {createStory.isPending || updateStory.isPending ? 'Saving...' : 'Save'}
          </button>
        </ModalActions>
      </Modal>

      {/* Delete Confirmation */}
      <Modal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Delete Story?" size="sm">
        <p className={modalStyles.confirmMessage}>
          Are you sure you want to delete <strong>{deleteConfirm?.title}</strong>?
        </p>
        <ModalActions>
          <button className={`${styles.button} ${styles.buttonSecondary}`} onClick={() => setDeleteConfirm(null)}>
            Cancel
          </button>
          <button
            className={`${styles.button} ${styles.buttonDanger}`}
            onClick={handleDelete}
            disabled={deleteStory.isPending}
          >
            {deleteStory.isPending ? 'Deleting...' : 'Delete'}
          </button>
        </ModalActions>
      </Modal>
    </section>
  );
}
