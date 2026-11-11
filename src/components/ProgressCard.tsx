import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import LinearProgress from '@mui/material/LinearProgress';

import { palette } from '../theme/theme';

interface ProgressCardProps {
  title: string;
  caption?: string;
  value: number;
  max: number;
  unit?: string;
  icon?: React.ReactNode;
  accent?: string;
  footer?: React.ReactNode;
}

export default function ProgressCard({
  title,
  caption,
  value,
  max,
  unit,
  icon,
  accent = palette.primary,
  footer,
}: ProgressCardProps) {
  const percentage = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent
        sx={{ p: 2.5, height: '100%', display: 'flex', flexDirection: 'column', '&:last-child': { pb: 2.5 } }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          {icon && (
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: '14px',
                display: 'grid',
                placeItems: 'center',
                bgcolor: `${accent}1A`,
                color: accent,
                flexShrink: 0,
              }}
            >
              {icon}
            </Box>
          )}
          <Box sx={{ minWidth: 0, flexGrow: 1 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
              {title}
            </Typography>
            {caption && (
              <Typography variant="body2" color="text.secondary">
                {caption}
              </Typography>
            )}
          </Box>
          <Typography variant="h6" sx={{ fontWeight: 800, color: accent }}>
            {value}
            {unit ?? ''}
          </Typography>
        </Box>

        <Box sx={{ mt: 2 }}>
          <LinearProgress
            variant="determinate"
            value={percentage}
            aria-label={`${title}: ${percentage}%`}
          />
        </Box>

        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, fontWeight: 700 }}>
          {percentage}% of your daily goal
        </Typography>

        {footer && <Box sx={{ mt: 1.5 }}>{footer}</Box>}
      </CardContent>
    </Card>
  );
}
