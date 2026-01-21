import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ApplicationsList } from '../ApplicationsList';
import type { Application } from '../../types';

const mockHooks = vi.hoisted(() => ({
  useApplications: vi.fn(),
  useCreateApplication: vi.fn(),
  useDeleteApplication: vi.fn(),
}));

vi.mock('../../hooks', () => mockHooks);

const navigateMock = vi.hoisted(() => vi.fn());
vi.mock('react-router-dom', () => ({
  useNavigate: () => navigateMock,
}));

const applications: Application[] = [
  {
    id: 1,
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
    updated_at: '2024-01-02T00:00:00Z',
  },
  {
    id: 2,
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
    updated_at: '2024-01-03T00:00:00Z',
  },
];

describe('ApplicationsList', () => {
  it('filters applications by search query', async () => {
    mockHooks.useApplications.mockReturnValue({ data: applications, isLoading: false, error: null });
    mockHooks.useCreateApplication.mockReturnValue({ mutateAsync: vi.fn() });
    mockHooks.useDeleteApplication.mockReturnValue({ mutateAsync: vi.fn() });

    const user = userEvent.setup();
    render(<ApplicationsList />);

    const search = screen.getByPlaceholderText('Search by company or role...');
    await user.type(search, 'Acme');

    expect(screen.getByText('Acme')).toBeInTheDocument();
    expect(screen.queryByText('Beta')).not.toBeInTheDocument();
  });
});
