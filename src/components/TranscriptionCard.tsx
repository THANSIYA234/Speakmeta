import { useEffect, useRef, useState } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import type { TranscriptionStatus } from '../hooks/useTranscription';
import { palette } from '../theme/theme';

export interface TranscriptionCardProps {
  status: TranscriptionStatus;
  /** The raw provider text. The card keeps an editable copy of it. */
  text: string;
  error: string | null;
  /** Called when the user asks for the failed request to run again. */
  onRetry?: () => void;
  /** Called with the edited text. No correction request is sent from here. */
  onSubmit?: (editedText: string) => void;
}

/**
 * Shows the transcription of a recording and lets the user fix it.
 *
 * The provider text is never edited in place: the card keeps a draft copy so
 * a new transcription replaces the draft, while edits the user already made
 * survive a re-render.
 */
export default function TranscriptionCard({
  status,
  text,
  error,
  onRetry,
  onSubmit,
}: TranscriptionCardProps) {
  const [draft, setDraft] = useState('');
  /**
   * The provider text the draft was last synced with.
   *
   * Comparing against it tells a fresh transcription apart from a re-render
   * that merely passes the same text again, so the user's edits are kept.
   */
  const syncedTextRef = useRef<string | null>(null);

  useEffect(() => {
    if (syncedTextRef.current === text) return;
    syncedTextRef.current = text;
    setDraft(text);
  }, [text]);

  const canSubmit = draft.trim().length > 0;

  return (
    <Card sx={{ mt: 2 }}>
      <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 800, color: palette.text }}>
          Your transcription
        </Typography>

        {status === 'uploading' && (
          <Box
            role="status"
            aria-live="polite"
            sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mt: 2 }}
          >
            <CircularProgress size={22} color="primary" aria-label="Transcribing your recording" />
            <Typography variant="body2" color="text.secondary">
              Transcribing your recording...
            </Typography>
          </Box>
        )}

        {status === 'error' && (
          <Box sx={{ mt: 2 }}>
            <Alert severity="error">{error ?? 'The transcription failed. Try again.'}</Alert>
            <Button variant="outlined" sx={{ mt: 1.5 }} onClick={() => onRetry?.()}>
              Try again
            </Button>
          </Box>
        )}

        {status === 'success' && (
          <Box sx={{ mt: 2 }}>
            <TextField
              fullWidth
              multiline
              minRows={4}
              label="Transcription"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              helperText="Edit any mistakes before sending it for correction."
            />

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1.5 }}>
              <Button
                variant="contained"
                disabled={!canSubmit}
                onClick={() => onSubmit?.(draft)}
              >
                Submit for correction
              </Button>
            </Box>
          </Box>
        )}

        {status === 'idle' && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
            Your transcript appears here once the recording is transcribed.
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}
