import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import MicRoundedIcon from '@mui/icons-material/MicRounded';
import StopRoundedIcon from '@mui/icons-material/StopRounded';
import PauseRoundedIcon from '@mui/icons-material/PauseRounded';
import PlayArrowRoundedIcon from '@mui/icons-material/PlayArrowRounded';

import { palette } from '../theme/theme';

export type SpeakingButtonState = 'idle' | 'recording' | 'paused';

interface SpeakingButtonProps {
  /** `idle` shows the microphone, `recording` and `paused` show the stop button. */
  state: SpeakingButtonState;
  onStart: () => void;
  onStop: () => void;
  onPause: () => void;
  onResume: () => void;
  disabled?: boolean;
  /** False hides the pause control, for browsers that cannot pause a recording. */
  canPause?: boolean;
  label?: string;
  stopLabel?: string;
}

export default function SpeakingButton({
  state,
  onStart,
  onStop,
  onPause,
  onResume,
  disabled = false,
  canPause = true,
  label = 'Start Recording',
  stopLabel = 'Stop Recording',
}: SpeakingButtonProps) {
  const isRecording = state === 'recording';
  const isPaused = state === 'paused';
  const isActive = isRecording || isPaused;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
      <Box sx={{ position: 'relative', display: 'grid', placeItems: 'center' }}>
        {isRecording && (
          <Box
            sx={{
              position: 'absolute',
              width: 132,
              height: 132,
              borderRadius: '50%',
              bgcolor: palette.primary,
              animation: 'speakmate-pulse 1.8s ease-out infinite',
            }}
          />
        )}
        <Box
          component="button"
          type="button"
          onClick={isActive ? onStop : onStart}
          disabled={disabled}
          /*
           * The circle and the text button below trigger the same action, so
           * they need different accessible names. Otherwise a screen reader
           * announces "Start Recording" twice for one control.
           */
          aria-label={isActive ? 'Microphone, stop recording' : 'Microphone, start recording'}
          aria-pressed={isActive}
          sx={{
            position: 'relative',
            width: 112,
            height: 112,
            borderRadius: '50%',
            border: 'none',
            cursor: disabled ? 'not-allowed' : 'pointer',
            display: 'grid',
            placeItems: 'center',
            color: '#fff',
            backgroundImage: isActive
              ? `linear-gradient(135deg, ${palette.error} 0%, #C9343C 100%)`
              : `linear-gradient(135deg, ${palette.primary} 0%, ${palette.primaryDark} 100%)`,
            boxShadow: isActive
              ? `0 18px 34px -16px ${palette.error}`
              : `0 18px 34px -16px ${palette.primary}`,
            opacity: disabled ? 0.5 : 1,
            transition: 'transform 160ms ease, box-shadow 160ms ease',
            '&:hover': { transform: 'scale(1.04)' },
            '&:focus-visible': { outline: `3px solid ${palette.secondary}`, outlineOffset: 4 },
            '&:active': { transform: 'scale(0.97)' },
          }}
        >
          {isActive ? (
            <StopRoundedIcon sx={{ fontSize: 44 }} />
          ) : (
            <MicRoundedIcon sx={{ fontSize: 48 }} />
          )}
        </Box>
      </Box>

      <Stack
        direction="row"
        spacing={1.5}
        sx={{ alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center', gap: 1.5 }}
      >
        <Button
          variant={isActive ? 'outlined' : 'contained'}
          size="large"
          color={isActive ? 'error' : 'primary'}
          onClick={isActive ? onStop : onStart}
          disabled={disabled}
          startIcon={isActive ? <StopRoundedIcon /> : <MicRoundedIcon />}
          sx={
            isActive
              ? { borderWidth: 2, minWidth: 190, whiteSpace: 'nowrap' }
              : { minWidth: 190, whiteSpace: 'nowrap' }
          }
        >
          {isActive ? stopLabel : label}
        </Button>

        {isActive && canPause && (
          <Button
            variant="text"
            size="large"
            color="primary"
            onClick={isPaused ? onResume : onPause}
            disabled={disabled}
            startIcon={isPaused ? <PlayArrowRoundedIcon /> : <PauseRoundedIcon />}
            sx={{ whiteSpace: 'nowrap' }}
          >
            {isPaused ? 'Resume' : 'Pause'}
          </Button>
        )}
      </Stack>
    </Box>
  );
}
