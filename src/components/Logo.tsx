import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import GraphicEqRoundedIcon from '@mui/icons-material/GraphicEqRounded';
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded';

import { palette } from '../theme/theme';

interface LogoProps {
  size?: number;
  showWordmark?: boolean;
}

export default function Logo({ size = 40, showWordmark = true }: LogoProps) {
  return (
    <Box
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: `${size * 0.28}px`,
      }}
    >
      <Box
        sx={{
          width: `${size}px`,
          height: `${size}px`,
          borderRadius: `${Math.round(size * 0.35)}px`,
          display: 'grid',
          placeItems: 'center',
          backgroundImage: `linear-gradient(135deg, ${palette.primary} 0%, ${palette.primaryDark} 100%)`,
          boxShadow: `0 10px 24px -10px ${palette.primary}`,
          position: 'relative',
          flexShrink: 0,
        }}
      >
        <GraphicEqRoundedIcon sx={{ color: '#fff', fontSize: `${size * 0.58}px` }} />
        <AutoAwesomeRoundedIcon
          sx={{
            position: 'absolute',
            top: `${-size * 0.16}px`,
            right: `${-size * 0.16}px`,
            color: palette.secondary,
            fontSize: `${size * 0.4}px`,
          }}
        />
      </Box>

      {showWordmark && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: `${size * 0.14}px` }}>
          <Typography
            sx={{
              fontWeight: 800,
              fontSize: `${size * 0.36}px`,
              letterSpacing: '-0.03em',
              color: palette.text,
              lineHeight: 1,
              whiteSpace: 'nowrap',
            }}
          >
            SpeakMate
          </Typography>
          <Box
            sx={{
              px: `${size * 0.14}px`,
              py: `${size * 0.04}px`,
              borderRadius: 999,
              backgroundColor: palette.primaryLight,
              color: palette.primaryDark,
              fontWeight: 800,
              fontSize: `${size * 0.2}px`,
              letterSpacing: '0.06em',
              lineHeight: 1.4,
              whiteSpace: 'nowrap',
            }}
          >
            AI
          </Box>
        </Box>
      )}
    </Box>
  );
}
