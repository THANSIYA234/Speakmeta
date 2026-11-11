import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import MicRoundedIcon from '@mui/icons-material/MicRounded';
import InsightsRoundedIcon from '@mui/icons-material/InsightsRounded';
import { useNavigate } from 'react-router-dom';

import Logo from '../components/Logo';
import { palette } from '../theme/theme';

const highlights = [
  { icon: <MicRoundedIcon />, label: 'Daily speaking prompts' },
  { icon: <InsightsRoundedIcon />, label: 'Track fluency and streaks' },
  { icon: <CheckCircleRoundedIcon />, label: 'Feedback after every session' },
];

export default function Welcome() {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: palette.background,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <Box
        aria-hidden
        sx={{
          position: 'absolute',
          top: -140,
          right: -120,
          width: 380,
          height: 380,
          borderRadius: '50%',
          background: `radial-gradient(circle at 30% 30%, ${palette.secondary} 0%, rgba(185,166,255,0) 70%)`,
        }}
      />
      <Box
        aria-hidden
        sx={{
          position: 'absolute',
          bottom: -160,
          left: -140,
          width: 420,
          height: 420,
          borderRadius: '50%',
          background: `radial-gradient(circle at 60% 40%, ${palette.primaryLight} 0%, rgba(237,231,255,0) 70%)`,
        }}
      />

      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          textAlign: 'center',
          px: 3,
          py: 6,
          position: 'relative',
        }}
      >
        <Box sx={{ animation: 'speakmate-float 4s ease-in-out infinite' }}>
          <Logo size={92} />
        </Box>

        <Typography
          variant="h3"
          sx={{ mt: 4, fontWeight: 800, color: palette.text, letterSpacing: '-0.03em' }}
        >
          Welcome to SpeakMate AI
        </Typography>

        <Typography
          variant="body1"
          color="text.secondary"
          sx={{ mt: 1.5, maxWidth: 420 }}
        >
          Practice your English out loud every day with guided speaking challenges,
          instant progress and a streak that keeps you going.
        </Typography>

        <Stack spacing={1.25} sx={{ mt: 4, width: '100%', maxWidth: 340 }}>
          {highlights.map((item) => (
            <Box
              key={item.label}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.25,
                bgcolor: '#fff',
                border: `1px solid ${palette.border}`,
                borderRadius: '16px',
                px: 2,
                py: 1.25,
              }}
            >
              <Box
                sx={{
                  width: 34,
                  height: 34,
                  borderRadius: '11px',
                  display: 'grid',
                  placeItems: 'center',
                  bgcolor: palette.primaryLight,
                  color: palette.primaryDark,
                  flexShrink: 0,
                }}
              >
                {item.icon}
              </Box>
              <Typography variant="body2" sx={{ fontWeight: 600, textAlign: 'left' }}>
                {item.label}
              </Typography>
            </Box>
          ))}
        </Stack>

        <Button
          variant="contained"
          size="large"
          onClick={() => navigate('/dashboard')}
          sx={{ mt: 5, minWidth: 220 }}
        >
          Get Started
        </Button>

        <Typography variant="caption" color="text.secondary" sx={{ mt: 2 }}>
          Free to start · No credit card required
        </Typography>
      </Box>
    </Box>
  );
}
