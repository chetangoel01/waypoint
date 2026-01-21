import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { Modal } from '../Modal';

describe('Modal', () => {
  it('closes on escape key', () => {
    const onClose = vi.fn();

    render(
      <Modal isOpen title="Test Modal" onClose={onClose}>
        Content
      </Modal>
    );

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('closes via close button', () => {
    const onClose = vi.fn();

    render(
      <Modal isOpen title="Test Modal" onClose={onClose}>
        Content
      </Modal>
    );

    fireEvent.click(screen.getByRole('button', { name: /close modal/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
