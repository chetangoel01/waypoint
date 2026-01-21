import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Documents } from '../Documents';
import type { Application, Document, DocumentVersion } from '../../types';

const mockHooks = vi.hoisted(() => ({
  useDocuments: vi.fn(),
  useApplications: vi.fn(),
  useAiStatus: vi.fn(),
  useDeleteDocument: vi.fn(),
  useAddDocumentVersion: vi.fn(),
}));

vi.mock('../../hooks', () => mockHooks);

vi.mock('../DocumentEditorModal', () => ({
  DocumentEditorModal: () => <div data-testid="doc-editor" />,
}));

vi.mock('../VersionHistoryModal', () => ({
  VersionHistoryModal: () => <div data-testid="version-history" />,
}));

vi.mock('../GenerateModal', () => ({
  GenerateModal: () => <div data-testid="generate-modal" />,
}));

const baseVersion: DocumentVersion = {
  id: 1,
  document_id: 1,
  version: 1,
  content: 'Draft',
  prompt_used: null,
  is_ai_generated: false,
  created_at: '2024-01-01T00:00:00Z',
};

const documents: (Document & { versions: DocumentVersion[] })[] = [
  {
    id: 1,
    user_id: 'user-1',
    application_id: 10,
    type: 'cover_letter',
    question: 'Why Acme?',
    key_points: null,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z',
    versions: [baseVersion],
  },
  {
    id: 2,
    user_id: 'user-1',
    application_id: 11,
    type: 'custom_question',
    question: 'Tell us about yourself',
    key_points: null,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-03T00:00:00Z',
    versions: [baseVersion],
  },
];

const applications: Application[] = [
  {
    id: 10,
    user_id: 'user-1',
    company: 'Acme',
    role: 'Engineer',
    url: null,
    job_description: null,
    status: 'saved',
    date_saved: '2024-01-01',
    date_applied: null,
    contacts: null,
    notes: null,
    custom_statuses: null,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 11,
    user_id: 'user-1',
    company: 'Beta',
    role: 'Designer',
    url: null,
    job_description: null,
    status: 'applied',
    date_saved: '2024-01-01',
    date_applied: '2024-01-02',
    contacts: null,
    notes: null,
    custom_statuses: null,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
];

describe('Documents', () => {
  it('filters documents by search query', async () => {
    mockHooks.useDocuments.mockReturnValue({ data: documents, isLoading: false, error: null });
    mockHooks.useApplications.mockReturnValue({ data: applications });
    mockHooks.useAiStatus.mockReturnValue({ data: { configured: true } });
    mockHooks.useDeleteDocument.mockReturnValue({ mutateAsync: vi.fn() });
    mockHooks.useAddDocumentVersion.mockReturnValue({ mutateAsync: vi.fn() });

    const user = userEvent.setup();
    render(<Documents />);

    const search = screen.getByPlaceholderText('Search documents...');
    await user.type(search, 'Acme');

    expect(screen.getByText(/Acme - Engineer/i, { selector: 'div' })).toBeInTheDocument();
    expect(screen.queryByText(/Beta - Designer/i, { selector: 'div' })).not.toBeInTheDocument();
  });

  it('shows empty state for unmatched filters', async () => {
    mockHooks.useDocuments.mockReturnValue({ data: documents, isLoading: false, error: null });
    mockHooks.useApplications.mockReturnValue({ data: applications });
    mockHooks.useAiStatus.mockReturnValue({ data: { configured: true } });
    mockHooks.useDeleteDocument.mockReturnValue({ mutateAsync: vi.fn() });
    mockHooks.useAddDocumentVersion.mockReturnValue({ mutateAsync: vi.fn() });

    const user = userEvent.setup();
    render(<Documents />);

    const search = screen.getByPlaceholderText('Search documents...');
    await user.type(search, 'Nope');

    expect(screen.getByText(/no matching documents/i)).toBeInTheDocument();
  });
});
