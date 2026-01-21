import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Toast } from '../Toast';

describe('Toast', () => {
  it('auto-dismisses after duration', () => {
    vi.useFakeTimers();
    const onDismiss = vi.fn();

    render(<Toast type="success" message="Saved" onDismiss={onDismiss} duration={500} />);

    expect(screen.getByText('Saved')).toBeInTheDocument();

    vi.advanceTimersByTime(500);
    expect(onDismiss).toHaveBeenCalledTimes(1);

    vi.useRealTimers();
  });

  it('dismisses on button click', async () => {
    const onDismiss = vi.fn();
    const user = userEvent.setup();

    render(<Toast type="info" message="Heads up" onDismiss={onDismiss} />);

    await user.click(screen.getByRole('button', { name: /dismiss/i }));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
});
