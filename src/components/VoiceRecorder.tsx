import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import ReplayRoundedIcon from '@mui/icons-material/ReplayRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';

import AudioPlayer from './AudioPlayer';
import SpeakingButton from './SpeakingButton';
import type { SpeakingButtonState } from './SpeakingButton';
import useVoiceRecorder from '../hooks/useVoiceRecorder';
import { formatBytes, formatDuration } from '../utils/format';
import { palette } from '../theme/theme';
import type { RecorderError, RecorderStatus, VoiceRecording } from '../types';

export interface VoiceRecorderProps {
  /** Called once a take is finished and the audio blob is ready. */
  onRecordingComplete?: (recording: VoiceRecording) => void;
  /** Called when the user throws the last take away. */
  onReset?: () => void;
  /** Called when the microphone or the recorder fails. */
  onError?: (error: RecorderError) => void;
  disabled?: boolean;
}

const statusConfig: Record<
  RecorderStatus,
  { label: string; color: 'default' | 'primary' | 'error' | 'warning' | 'success' | 'info' }
> = {
  idle: { label: 'Ready to record', color: 'default' },
  requesting: { label: 'Waiting for microphone permission…', color: 'info' },
  recording: { label: 'Recording', color: 'error' },
  paused: { label: 'Paused', color: 'warning' },
  recorded: { label: 'Recording ready', color: 'success' },
  error: { label: 'Recording failed', color: 'error' },
};

/**
 * Reusable voice recorder built on the browser MediaRecorder API.
 *
 * The captured audio stays on the device as a `Blob` and is handed to
 * `onRecordingComplete` so it can be uploaded to the backend later.
 */
export default function VoiceRecorder({
  onRecordingComplete,
  onReset,
  onError,
  disabled = false,
}: VoiceRecorderProps) {
  const {
    status,
    error,
    recording,
    elapsedMs,
    support,
    canPause,
    start,
    pause,
    resume,
    stop,
    discard,
  } = useVoiceRecorder({ onRecordingComplete, onError });

  const isBusy = status === 'requesting';
  const statusInfo = statusConfig[status];
  const buttonState: SpeakingButtonState =
    status === 'recording' ? 'recording' : status === 'paused' ? 'paused' : 'idle';

  return (
    <Card sx={{ mt: 2 }}>
      <CardContent
        sx={{
          p: 3,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          '&:last-child': { pb: 3 },
        }}
      >
        <Chip
          size="small"
          label={statusInfo.label}
          color={statusInfo.color}
          aria-live="polite"
          sx={{ fontWeight: 700 }}
        />

        <Typography
          variant="h2"
          sx={{
            mt: 1.5,
            fontWeight: 800,
            fontVariantNumeric: 'tabular-nums',
            color: status === 'recording' ? palette.error : palette.text,
          }}
        >
          {formatDuration(elapsedMs)}
        </Typography>

        <Box sx={{ mt: 3 }}>
          <SpeakingButton
            state={buttonState}
            onStart={() => {
              void start();
            }}
            onStop={stop}
            onPause={pause}
            onResume={resume}
            disabled={disabled || isBusy || support !== 'ready'}
            canPause={canPause}
          />
        </Box>

        {support === 'unsupported' && (
          <Alert severity="warning" sx={{ mt: 3, width: '100%' }}>
            This browser cannot record audio. Open the app in a recent version of Chrome or Safari.
          </Alert>
        )}

        {support === 'insecure-context' && (
          <Alert severity="warning" sx={{ mt: 3, width: '100%' }}>
            Microphone access needs a secure connection. Open the app over https (or on localhost)
            and try again.
          </Alert>
        )}

        {error && (
          <Alert severity="error" sx={{ mt: 3, width: '100%' }}>
            {error.message}
          </Alert>
        )}

        {recording && status === 'recorded' && (
          <Box sx={{ mt: 3, width: '100%' }}>
            <AudioPlayer
              src={recording.url}
              fallbackDurationMs={recording.durationMs}
              label="Recorded audio playback"
            />

            <Stack
              direction="row"
              spacing={1}
              sx={{ mt: 2, justifyContent: 'center', flexWrap: 'wrap', gap: 1 }}
            >
              <Chip
                size="small"
                variant="outlined"
                label={formatDuration(recording.durationMs)}
              />
              <Chip size="small" variant="outlined" label={formatBytes(recording.sizeBytes)} />
              <Chip size="small" variant="outlined" label={recording.mimeType} />
            </Stack>

            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: 'block', textAlign: 'center', mt: 1.5 }}
            >
              Saved as {recording.fileName} — ready to transcribe.
            </Typography>

            <Stack direction="row" spacing={1.5} sx={{ mt: 2, justifyContent: 'center' }}>
              <Button
                variant="outlined"
                color="error"
                startIcon={<DeleteOutlineRoundedIcon />}
                onClick={() => {
                  discard();
                  onReset?.();
                }}
              >
                Delete
              </Button>
              <Button
                variant="contained"
                startIcon={<ReplayRoundedIcon />}
                onClick={() => {
                  onReset?.();
                  void start();
                }}
              >
                Record again
              </Button>
            </Stack>
          </Box>
        )}

        {status === 'idle' && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 3, textAlign: 'center' }}>
            Tap the microphone and speak clearly. The timer starts as soon as you begin.
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}
