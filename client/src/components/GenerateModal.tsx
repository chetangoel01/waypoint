import { useState } from 'react';
import { useAiStatus, useGenerateCoverLetter, useGenerateCustomResponse, useRefineContent } from '../hooks';
import { Icons } from './Icons';
import styles from './GenerateModal.module.css';
import type { CoverLetterTone } from '../services/api';

interface GenerateModalProps {
  isOpen: boolean;
  onClose: () => void;
  applicationId: number;
  companyName: string;
  roleName: string;
  mode: 'cover-letter' | 'custom-response';
  initialQuestion?: string;
  onSave?: (content: string) => void;
}

export function GenerateModal({
  isOpen,
  onClose,
  applicationId,
  companyName,
  roleName,
  mode,
  initialQuestion = '',
  onSave,
}: GenerateModalProps) {
  const { data: aiStatus } = useAiStatus();
  const generateCoverLetter = useGenerateCoverLetter();
  const generateCustomResponse = useGenerateCustomResponse();
  const refineContent = useRefineContent();

  const [step, setStep] = useState<'configure' | 'generate' | 'result'>('generate');
  const [tone, setTone] = useState<CoverLetterTone>('professional');
  const [additionalContext, setAdditionalContext] = useState('');
  const [question, setQuestion] = useState(initialQuestion);
  const [generatedContent, setGeneratedContent] = useState('');
  const [refineInstruction, setRefineInstruction] = useState('');
  const [isRefining, setIsRefining] = useState(false);

  const isLoading = generateCoverLetter.isPending || generateCustomResponse.isPending;
  const error = generateCoverLetter.error || generateCustomResponse.error;

  if (!isOpen) return null;

  const handleGenerate = async () => {
    try {
      let result;
      if (mode === 'cover-letter') {
        result = await generateCoverLetter.mutateAsync({
          applicationId,
          additionalContext: additionalContext || undefined,
          tone,
        });
      } else {
        if (!question.trim()) return;
        result = await generateCustomResponse.mutateAsync({
          applicationId,
          question: question.trim(),
          additionalContext: additionalContext || undefined,
        });
      }
      setGeneratedContent(result.content);
      setStep('result');
    } catch {
      // Error is handled by the mutation
    }
  };

  const handleRefine = async () => {
    if (!refineInstruction.trim() || !generatedContent) return;
    setIsRefining(true);
    try {
      const result = await refineContent.mutateAsync({
        content: generatedContent,
        instruction: refineInstruction.trim(),
      });
      setGeneratedContent(result.content);
      setRefineInstruction('');
    } catch {
      // Error handled
    } finally {
      setIsRefining(false);
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(generatedContent);
  };

  const handleSave = () => {
    onSave?.(generatedContent);
    onClose();
  };

  const handleClose = () => {
    // Reset state on close
    setStep('generate');
    setAdditionalContext('');
    setQuestion(initialQuestion);
    setGeneratedContent('');
    setRefineInstruction('');
    generateCoverLetter.reset();
    generateCustomResponse.reset();
    onClose();
  };

  // If AI not configured, show setup message
  if (!aiStatus?.configured) {
    return (
      <div className={styles.overlay} onClick={handleClose}>
        <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
          <div className={styles.header}>
            <h2 className={styles.title}>AI Not Configured</h2>
            <button className={styles.closeButton} onClick={handleClose}>
              <span style={{ transform: 'rotate(45deg)', display: 'flex' }}><Icons.Plus /></span>
            </button>
          </div>
          <div className={styles.body}>
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>
                <Icons.Settings />
              </div>
              <h3>Setup Required</h3>
              <p>
                To generate content with AI, please add your Gemini API key in the Settings page.
              </p>
              <a href="/settings" className={styles.primaryButton} onClick={handleClose}>
                Go to Settings
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.overlay} onClick={handleClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>
            {mode === 'cover-letter' ? 'Generate Cover Letter' : 'Generate Response'}
          </h2>
            <button className={styles.closeButton} onClick={handleClose}>
              <span style={{ transform: 'rotate(45deg)', display: 'flex' }}><Icons.Plus /></span>
            </button>
        </div>

        <div className={styles.meta}>
          <span className={styles.company}>{companyName}</span>
          <span className={styles.separator}>·</span>
          <span className={styles.role}>{roleName}</span>
        </div>

        {step === 'generate' && (
          <div className={styles.body}>
            {mode === 'cover-letter' ? (
              <>
                <div className={styles.field}>
                  <label className={styles.label}>Tone</label>
                  <div className={styles.toneButtons}>
                    {(['professional', 'conversational', 'enthusiastic'] as const).map((t) => (
                      <button
                        key={t}
                        className={`${styles.toneButton} ${tone === t ? styles.active : ''}`}
                        onClick={() => setTone(t)}
                      >
                        {t.charAt(0).toUpperCase() + t.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Additional Context (optional)</label>
                  <textarea
                    className={styles.textarea}
                    placeholder="Any specific points you want to highlight, or aspects of the role you're excited about..."
                    value={additionalContext}
                    onChange={(e) => setAdditionalContext(e.target.value)}
                    rows={3}
                  />
                </div>
              </>
            ) : (
              <>
                <div className={styles.field}>
                  <label className={styles.label}>Question</label>
                  <textarea
                    className={styles.textarea}
                    placeholder="Enter the application question..."
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    rows={3}
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Additional Context (optional)</label>
                  <textarea
                    className={styles.textarea}
                    placeholder="Any specific experiences, projects, or points you want to include in your answer..."
                    value={additionalContext}
                    onChange={(e) => setAdditionalContext(e.target.value)}
                    rows={2}
                  />
                </div>
              </>
            )}

            <div className={styles.info}>
              <Icons.Lightbulb />
              <span>
                The AI will use your profile, experience, and skills to personalize the content.
              </span>
            </div>

            {error && (
              <div className={styles.error}>
                <Icons.AlertCircle />
                <span>{error instanceof Error ? error.message : 'Generation failed'}</span>
              </div>
            )}

            <div className={styles.actions}>
              <button className={styles.secondaryButton} onClick={handleClose}>
                Cancel
              </button>
              <button
                className={styles.primaryButton}
                onClick={handleGenerate}
                disabled={isLoading || (mode === 'custom-response' && !question.trim())}
              >
                {isLoading ? (
                  <>
                    <span className={styles.spinner} />
                    Generating...
                  </>
                ) : (
                  <>
                    <Icons.Lightbulb />
                    Generate
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {step === 'result' && (
          <div className={styles.body}>
            <div className={styles.resultContainer}>
              <textarea
                className={styles.resultTextarea}
                value={generatedContent}
                onChange={(e) => setGeneratedContent(e.target.value)}
                rows={12}
              />
            </div>

            <div className={styles.refineSection}>
              <label className={styles.label}>Refine with AI</label>
              <div className={styles.refineRow}>
                <input
                  type="text"
                  className={styles.refineInput}
                  placeholder="e.g., Make it shorter, Add more technical details..."
                  value={refineInstruction}
                  onChange={(e) => setRefineInstruction(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleRefine()}
                />
                <button
                  className={styles.refineButton}
                  onClick={handleRefine}
                  disabled={isRefining || !refineInstruction.trim()}
                >
                  {isRefining ? <span className={styles.spinner} /> : 'Refine'}
                </button>
              </div>
            </div>

            <div className={styles.actions}>
              <button className={styles.secondaryButton} onClick={() => setStep('generate')}>
                Start Over
              </button>
              <div className={styles.rightActions}>
                <button className={styles.iconButton} onClick={handleCopy} title="Copy to clipboard">
                  <Icons.FileText />
                </button>
                <button className={styles.primaryButton} onClick={handleSave}>
                  Save
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
