import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Login } from '../Login';

const signInWithOAuth = vi.hoisted(() => vi.fn());

vi.mock('../../services/supabase', () => ({
  supabase: {
    auth: {
      signInWithOAuth,
    },
  },
}));

describe('Login', () => {
  it('triggers Google OAuth flow', async () => {
    signInWithOAuth.mockResolvedValueOnce({ error: null });
    const user = userEvent.setup();

    render(<Login />);

    await user.click(screen.getByRole('button', { name: /continue with google/i }));

    expect(signInWithOAuth).toHaveBeenCalledWith({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
        scopes: 'email profile',
      },
    });
  });

  it('shows an error when OAuth fails', async () => {
    signInWithOAuth.mockResolvedValueOnce({ error: new Error('Denied') });
    const user = userEvent.setup();

    render(<Login />);

    await user.click(screen.getByRole('button', { name: /continue with google/i }));

    expect(screen.getByText(/denied/i)).toBeInTheDocument();
  });
});
