import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import TranscriptionCard from './TranscriptionCard';

describe('TranscriptionCard', () => {
  it('waits for a transcription before it shows anything to edit', () => {
    render(<TranscriptionCard status="idle" text="" error={null} />);

    expect(screen.queryByLabelText('Transcription')).not.toBeInTheDocument();
    expect(screen.getByText(/Your transcript appears here/)).toBeInTheDocument();
  });

  it('shows a loading state while the recording is being transcribed', () => {
    render(<TranscriptionCard status="uploading" text="" error={null} />);

    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByText('Transcribing your recording...')).toBeInTheDocument();
  });

  it('renders the transcription in an editable field', () => {
    render(<TranscriptionCard status="success" text="Hello there, how are you?" error={null} />);

    const field = screen.getByLabelText('Transcription');
    expect(field).toHaveValue('Hello there, how are you?');
    expect(field).not.toBeDisabled();
  });

  it('lets the user fix the transcription', () => {
    render(<TranscriptionCard status="success" text="Hello there" error={null} />);

    const field = screen.getByLabelText('Transcription');
    fireEvent.change(field, { target: { value: 'Hello their' } });

    expect(field).toHaveValue('Hello their');
  });

  it('keeps the edited text when the card re-renders with the same text', () => {
    const { rerender } = render(
      <TranscriptionCard status="success" text="Hello there" error={null} />,
    );

    fireEvent.change(screen.getByLabelText('Transcription'), { target: { value: 'Hello their' } });
    rerender(<TranscriptionCard status="success" text="Hello there" error={null} />);

    expect(screen.getByLabelText('Transcription')).toHaveValue('Hello their');
  });

  it('shows the error message and offers a retry', () => {
    const onRetry = vi.fn();
    render(
      <TranscriptionCard
        status="error"
        text=""
        error="Could not reach the transcription service."
        onRetry={onRetry}
      />,
    );

    expect(screen.getByText('Could not reach the transcription service.')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('disables the submit action when there is nothing to submit', () => {
    render(<TranscriptionCard status="success" text="" error={null} />);

    expect(screen.getByRole('button', { name: 'Submit for correction' })).toBeDisabled();
  });

  it('submits the edited text', () => {
    const onSubmit = vi.fn();
    render(
      <TranscriptionCard status="success" text="Hello there" error={null} onSubmit={onSubmit} />,
    );

    fireEvent.change(screen.getByLabelText('Transcription'), { target: { value: 'Hello their' } });
    fireEvent.click(screen.getByRole('button', { name: 'Submit for correction' }));

    expect(onSubmit).toHaveBeenCalledWith('Hello their');
  });
});
